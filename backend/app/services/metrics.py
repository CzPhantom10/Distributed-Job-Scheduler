from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.execution import JobExecution, ExecutionStatus
from app.models.job import Job, JobStatus
from app.models.project import Project
from app.models.queue import Queue
from app.models.worker import Worker, WorkerStatus
from app.repositories.worker import WorkerRepository
from app.schemas.metrics import (
    MetricsSummaryResponse,
    SystemOverviewResponse,
    ThroughputPoint,
    ThroughputResponse,
)


class MetricsService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def system_overview(self) -> SystemOverviewResponse:
        worker_repo = WorkerRepository(self._session)
        active_workers = await worker_repo.get_active()

        job_counts = {row[0].value: row[1] for row in await self._session.execute(
            select(Job.status, func.count(Job.id)).group_by(Job.status)
        )}

        return SystemOverviewResponse(
            total_projects=(await self._session.execute(
                select(func.count(Project.id))
            )).scalar_one(),
            total_queues=(await self._session.execute(
                select(func.count(Queue.id))
            )).scalar_one(),
            active_workers=len(active_workers),
            queued_jobs=job_counts.get("queued", 0),
            running_jobs=job_counts.get("running", 0),
            failed_jobs=job_counts.get("failed", 0),
            dead_jobs=job_counts.get("dead", 0),
            completed_jobs=job_counts.get("completed", 0),
        )

    async def throughput(self, window_minutes: int = 60) -> ThroughputResponse:
        """
        Jobs completed/failed per minute over the last `window_minutes`.
        Returns one data point per minute — suitable for a time-series chart.
        """
        now = datetime.now(timezone.utc)
        since = now - timedelta(minutes=window_minutes)

        if self._session.bind.dialect.name == "sqlite":
            minute_expr = func.strftime("%Y-%m-%d %H:%M:00", JobExecution.finished_at)
        else:
            minute_expr = func.date_trunc("minute", JobExecution.finished_at)

        rows = await self._session.execute(
            select(
                minute_expr.label("minute"),
                JobExecution.status,
                func.count(JobExecution.id).label("cnt"),
            )
            .where(
                JobExecution.finished_at >= since,
                JobExecution.status.in_([ExecutionStatus.completed, ExecutionStatus.failed]),
            )
            .group_by("minute", JobExecution.status)
            .order_by("minute")
        )

        # Build minute → {completed, failed} map
        buckets = {}
        for minute, status, cnt in rows:
            if minute not in buckets:
                buckets[minute] = {"completed": 0, "failed": 0}
            buckets[minute][status.value] = cnt

        points = []
        for ts, v in sorted(buckets.items()):
            # Safe parse for SQLite string dates or direct timezone datetimes from PG
            if isinstance(ts, str):
                dt = datetime.fromisoformat(ts.replace(" ", "T")).replace(tzinfo=timezone.utc)
            else:
                dt = ts
            points.append(ThroughputPoint(timestamp=dt, completed=v["completed"], failed=v["failed"]))

        return ThroughputResponse(window_minutes=window_minutes, points=points)

    async def summary(self) -> MetricsSummaryResponse:
        """Rolled-up metrics for the last 60 minutes."""
        since = datetime.now(timezone.utc) - timedelta(hours=1)

        exec_rows = await self._session.execute(
            select(JobExecution.status, func.count(JobExecution.id), func.avg(JobExecution.duration_ms))
            .where(JobExecution.finished_at >= since)
            .group_by(JobExecution.status)
        )

        completed = failed = total_retries = 0
        avg_ms = None
        for status, cnt, avg in exec_rows:
            if status == ExecutionStatus.completed:
                completed = cnt
                avg_ms = avg
            elif status == ExecutionStatus.failed:
                failed = cnt

        total = completed + failed
        jobs_pm = total / 60 if total else 0.0
        success_rate = completed / total if total else 0.0

        # Retry rate = jobs with retry_count > 0 / total finished jobs
        retried = (await self._session.execute(
            select(func.count(Job.id)).where(Job.retry_count > 0)
        )).scalar_one()
        all_finished = (await self._session.execute(
            select(func.count(Job.id)).where(
                Job.status.in_([JobStatus.completed, JobStatus.failed, JobStatus.dead])
            )
        )).scalar_one()
        retry_rate = retried / all_finished if all_finished else 0.0

        # Worker utilization
        active_workers = await self._session.execute(
            select(Worker.active_jobs, Worker.max_concurrency)
            .where(Worker.status != WorkerStatus.offline)
        )
        worker_rows = active_workers.all()
        if worker_rows:
            utilization = sum(r[0] / r[1] for r in worker_rows if r[1] > 0) / len(worker_rows)
        else:
            utilization = 0.0

        return MetricsSummaryResponse(
            jobs_per_minute=round(jobs_pm, 2),
            success_rate=round(success_rate, 4),
            failure_rate=round(1 - success_rate, 4) if total else 0.0,
            retry_rate=round(retry_rate, 4),
            avg_execution_ms=round(avg_ms, 2) if avg_ms else None,
            worker_utilization=round(utilization, 4),
        )
