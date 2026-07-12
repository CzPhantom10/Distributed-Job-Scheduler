from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.execution import ExecutionStatus, JobExecution
from app.models.worker import Worker, WorkerStatus
from app.repositories.base import BaseRepository


class WorkerRepository(BaseRepository[Worker]):
    model = Worker

    async def update_heartbeat(self, worker_id: UUID) -> None:
        worker = await self.get(worker_id)
        if worker:
            worker.last_heartbeat_at = datetime.now(timezone.utc)
            await self.session.flush()

    async def get_active(self) -> list[Worker]:
        """Workers that have sent a heartbeat in the last 3× heartbeat interval."""
        from app.core.config import settings
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=settings.worker_heartbeat_interval * 3)
        result = await self.session.execute(
            select(Worker)
            .where(
                Worker.last_heartbeat_at >= cutoff,
                Worker.status != WorkerStatus.offline,
            )
            .order_by(Worker.name)
        )
        return list(result.scalars())

    async def get_stats(self, worker_id: UUID) -> dict:
        """Per-worker execution counts."""
        rows = await self.session.execute(
            select(JobExecution.status, func.count(JobExecution.id))
            .where(JobExecution.worker_id == worker_id)
            .group_by(JobExecution.status)
        )
        counts = {row[0].value: row[1] for row in rows}
        return {
            "completed": counts.get("completed", 0),
            "failed": counts.get("failed", 0),
        }

    async def mark_stale_offline(self) -> int:
        """
        Marks workers as offline if their heartbeat is too old.
        Called by the scheduler service periodically.
        Returns the count of workers marked offline.
        """
        from app.core.config import settings
        from sqlalchemy import update

        cutoff = datetime.now(timezone.utc) - timedelta(seconds=settings.worker_heartbeat_interval * 3)
        result = await self.session.execute(
            update(Worker)
            .where(
                Worker.last_heartbeat_at < cutoff,
                Worker.status != WorkerStatus.offline,
            )
            .values(status=WorkerStatus.offline)
            .returning(Worker.id)
        )
        marked = result.scalars().all()
        return len(marked)
