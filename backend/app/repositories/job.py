from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job import Job, JobStatus
from app.models.job_event import JobEvent, JobEventType
from app.repositories.base import BaseRepository


class JobRepository(BaseRepository[Job]):
    model = Job

    async def claim_next(self, queue_id: UUID, worker_id: UUID) -> Job | None:
        """
        Atomically claims the highest-priority queued job in the given queue.

        Uses SELECT FOR UPDATE SKIP LOCKED on Postgres. For SQLite, falls back to
        sequential selection + optimistic lock check.
        """
        if self.session.bind.dialect.name == "sqlite":
            job_id_row = await self.session.execute(
                select(Job.id)
                .where(
                    Job.queue_id == queue_id,
                    Job.status == JobStatus.queued,
                    (Job.run_at.is_(None)) | (Job.run_at <= datetime.now(timezone.utc)),
                )
                .order_by(Job.priority.desc(), Job.created_at.asc())
                .limit(1)
            )
            job_id = job_id_row.scalar()
            if not job_id:
                return None
            
            stmt = (
                update(Job)
                .where(Job.id == job_id, Job.status == JobStatus.queued)
                .values(status=JobStatus.claimed, updated_at=datetime.now(timezone.utc))
                .returning(Job)
            )
            result = await self.session.execute(stmt)
            return result.scalars().first()
        else:
            subq = (
                select(Job.id)
                .where(
                    Job.queue_id == queue_id,
                    Job.status == JobStatus.queued,
                    (Job.run_at.is_(None)) | (Job.run_at <= datetime.now(timezone.utc)),
                )
                .order_by(Job.priority.desc(), Job.created_at.asc())
                .limit(1)
                .with_for_update(skip_locked=True)
                .scalar_subquery()
            )
            stmt = (
                update(Job)
                .where(Job.id == subq)
                .values(status=JobStatus.claimed, updated_at=datetime.now(timezone.utc))
                .returning(Job)
            )
            result = await self.session.execute(stmt)
            return result.scalars().first()

    async def status_counts(self, queue_id: UUID) -> dict[str, int]:
        """Returns a dict of {status: count} for one queue."""
        rows = await self.session.execute(
            select(Job.status, func.count(Job.id))
            .where(Job.queue_id == queue_id)
            .group_by(Job.status)
        )
        return {row[0].value: row[1] for row in rows}

    async def system_status_counts(self) -> dict[str, int]:
        """Aggregate status counts across all jobs — for the system overview."""
        rows = await self.session.execute(
            select(Job.status, func.count(Job.id)).group_by(Job.status)
        )
        return {row[0].value: row[1] for row in rows}

    async def get_with_relations(self, job_id: UUID) -> Job | None:
        """Fetches job with executions, events and queue eagerly loaded."""
        from sqlalchemy.orm import selectinload
        result = await self.session.execute(
            select(Job)
            .options(
                selectinload(Job.executions),
                selectinload(Job.events),
                selectinload(Job.queue),
            )
            .where(Job.id == job_id)
        )
        return result.scalars().first()

    async def add_event(
        self,
        job_id: UUID,
        event_type: JobEventType,
        attempt: int = 1,
        worker_id: UUID | None = None,
        message: str | None = None,
    ) -> JobEvent:
        event = JobEvent(
            job_id=job_id,
            event_type=event_type,
            attempt=attempt,
            worker_id=worker_id,
            message=message,
        )
        self.session.add(event)
        await self.session.flush()
        return event

    async def get_due_scheduled(self, limit: int = 100) -> list[Job]:
        """Returns scheduled/delayed jobs whose run_at has passed."""
        now = datetime.now(timezone.utc)
        result = await self.session.execute(
            select(Job)
            .where(
                Job.status == JobStatus.scheduled,
                Job.run_at <= now,
            )
            .order_by(Job.run_at.asc())
            .limit(limit)
            .with_for_update(skip_locked=True)
        )
        return list(result.scalars())

    async def get_due_cron(self, limit: int = 50) -> list[Job]:
        """Returns cron jobs that need their next run enqueued."""
        from app.models.job import JobKind
        result = await self.session.execute(
            select(Job)
            .where(
                Job.kind == JobKind.cron,
                Job.status == JobStatus.completed,
                Job.cron_expression.isnot(None),
            )
            .limit(limit)
        )
        return list(result.scalars())
