from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job import Job, JobStatus
from app.models.queue import Queue, QueueStatus
from app.repositories.base import BaseRepository


class QueueRepository(BaseRepository[Queue]):
    model = Queue

    async def get_stats(self, queue_id: UUID) -> dict:
        """Per-queue job counts and average execution time."""
        from app.models.execution import JobExecution, ExecutionStatus

        counts_rows = await self.session.execute(
            select(Job.status, func.count(Job.id))
            .where(Job.queue_id == queue_id)
            .group_by(Job.status)
        )
        counts = {row[0].value: row[1] for row in counts_rows}

        avg_row = await self.session.execute(
            select(func.avg(JobExecution.duration_ms))
            .join(Job, JobExecution.job_id == Job.id)
            .where(
                Job.queue_id == queue_id,
                JobExecution.status == ExecutionStatus.completed,
            )
        )
        avg_duration_ms = avg_row.scalar()

        return {
            "queued": counts.get("queued", 0),
            "running": counts.get("running", 0),
            "completed": counts.get("completed", 0),
            "failed": counts.get("failed", 0),
            "dead": counts.get("dead", 0),
            "avg_duration_ms": round(avg_duration_ms, 2) if avg_duration_ms else None,
        }

    async def get_health(self, queue: Queue) -> dict:
        """
        Calculates queue health based on simple heuristics.
        Returns {"status": "healthy"|"warning"|"critical", "reasons": [...]}
        """
        stats = await self.get_stats(queue.id)
        reasons = []

        total_finished = stats["completed"] + stats["failed"]
        failure_rate = stats["failed"] / total_finished if total_finished > 0 else 0
        dead_count = stats["dead"]
        queued_depth = stats["queued"]

        if failure_rate > 0.5:
            reasons.append(f"High failure rate: {failure_rate:.0%}")
        if dead_count > 10:
            reasons.append(f"{dead_count} dead-letter jobs")
        if queued_depth > 500:
            reasons.append(f"Queue depth is high: {queued_depth} jobs waiting")
        if queue.status == QueueStatus.paused:
            reasons.append("Queue is paused")

        if len(reasons) >= 2 or failure_rate > 0.75 or dead_count > 50:
            health = "critical"
        elif reasons:
            health = "warning"
        else:
            health = "healthy"

        return {"status": health, "reasons": reasons, "stats": stats}

    async def list_for_project(self, project_id: UUID) -> list[Queue]:
        result = await self.session.execute(
            select(Queue).where(Queue.project_id == project_id).order_by(Queue.name)
        )
        return list(result.scalars())
