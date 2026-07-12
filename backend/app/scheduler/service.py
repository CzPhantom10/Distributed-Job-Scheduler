"""
Scheduler service — responsible ONLY for:
  1. Moving scheduled/delayed jobs into the queued state when their run_at has passed.
  2. Enqueuing the next run of completed cron jobs.
  3. Marking stale workers as offline.

It never executes jobs. That is the worker's responsibility.
"""
import asyncio
from datetime import datetime, timezone

import structlog

from app.core.config import settings
from app.core.logging import get_logger
from app.database.session import AsyncSessionLocal
from app.models.job import Job, JobKind, JobStatus
from app.models.job_event import JobEventType
from app.repositories.job import JobRepository
from app.repositories.worker import WorkerRepository
from app.scheduler.cron import next_run_after

logger = get_logger(__name__)


class SchedulerService:
    def __init__(self) -> None:
        self._running = False

    async def start(self) -> None:
        self._running = True
        logger.info("scheduler_started")
        await asyncio.gather(
            self._scheduled_job_loop(),
            self._cron_job_loop(),
            self._stale_worker_loop(),
        )

    def stop(self) -> None:
        self._running = False
        logger.info("scheduler_stopping")

    async def _scheduled_job_loop(self) -> None:
        """Promotes scheduled/delayed jobs to queued when their time arrives."""
        while self._running:
            try:
                async with AsyncSessionLocal() as session:
                    async with session.begin():
                        repo = JobRepository(session)
                        due_jobs = await repo.get_due_scheduled()
                        for job in due_jobs:
                            job.status = JobStatus.queued
                            job.scheduled_at = datetime.now(timezone.utc)
                            await repo.add_event(
                                job_id=job.id,
                                event_type=JobEventType.queued,
                                attempt=job.retry_count + 1,
                                message="Promoted from scheduled to queued by scheduler",
                            )
                        if due_jobs:
                            logger.info("scheduled_jobs_promoted", count=len(due_jobs))
            except Exception:
                logger.exception("scheduler_scheduled_loop_error")

            await asyncio.sleep(settings.worker_poll_interval)

    async def _cron_job_loop(self) -> None:
        """Enqueues the next run for completed cron jobs."""
        while self._running:
            try:
                async with AsyncSessionLocal() as session:
                    async with session.begin():
                        repo = JobRepository(session)
                        cron_jobs = await repo.get_due_cron()
                        for job in cron_jobs:
                            next_run = next_run_after(
                                job.cron_expression,
                                datetime.now(timezone.utc),
                            )
                            # Create a new job record for the next execution
                            new_job = await repo.create(
                                queue_id=job.queue_id,
                                name=job.name,
                                kind=JobKind.cron,
                                status=JobStatus.scheduled,
                                payload=job.payload,
                                priority=job.priority,
                                run_at=next_run,
                                cron_expression=job.cron_expression,
                                max_retries=job.max_retries,
                            )
                            await repo.add_event(
                                job_id=new_job.id,
                                event_type=JobEventType.scheduled,
                                attempt=1,
                                message=f"Next cron run scheduled for {next_run.isoformat()}",
                            )
                        if cron_jobs:
                            logger.info("cron_jobs_scheduled", count=len(cron_jobs))
            except Exception:
                logger.exception("scheduler_cron_loop_error")

            await asyncio.sleep(60)  # check for new cron runs every minute

    async def _stale_worker_loop(self) -> None:
        """Marks workers as offline if they stop sending heartbeats."""
        while self._running:
            try:
                async with AsyncSessionLocal() as session:
                    async with session.begin():
                        repo = WorkerRepository(session)
                        count = await repo.mark_stale_offline()
                        if count:
                            logger.warning("stale_workers_marked_offline", count=count)
            except Exception:
                logger.exception("scheduler_stale_worker_loop_error")

            await asyncio.sleep(settings.worker_heartbeat_interval)
