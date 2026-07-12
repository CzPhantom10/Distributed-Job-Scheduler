import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models.job import Job, JobKind, JobStatus
from app.models.job_event import JobEventType
from app.models.queue import Queue, QueueStatus
from app.repositories.job import JobRepository
from app.repositories.queue import QueueRepository
from app.schemas.job import EnqueueJobRequest


class JobService:
    def __init__(self, session: AsyncSession) -> None:
        self._jobs = JobRepository(session)
        self._queues = QueueRepository(session)
        self._session = session

    async def enqueue(self, queue: Queue, req: EnqueueJobRequest) -> Job:
        if queue.status == QueueStatus.paused:
            raise ValidationError(f"Queue '{queue.name}' is paused and not accepting new jobs")

        # Idempotency check — if caller supplies a key, refuse duplicates in this queue
        if req.idempotency_key:
            from sqlalchemy import select
            existing = (await self._session.execute(
                select(Job).where(
                    Job.queue_id == queue.id,
                    Job.idempotency_key == req.idempotency_key,
                )
            )).scalars().first()
            if existing:
                return existing  # idempotent: return the existing job

        # Determine initial status
        initial_status = JobStatus.scheduled if req.run_at else JobStatus.queued

        job = await self._jobs.create(
            queue_id=queue.id,
            name=req.name,
            kind=req.kind,
            status=initial_status,
            payload=req.payload,
            priority=req.priority,
            run_at=req.run_at,
            cron_expression=req.cron_expression,
            batch_id=req.batch_id,
            idempotency_key=req.idempotency_key,
            # Snapshot retry policy from queue at enqueue time
            max_retries=queue.max_retries,
        )

        await self._jobs.add_event(
            job_id=job.id,
            event_type=JobEventType.queued if initial_status == JobStatus.queued else JobEventType.scheduled,
            attempt=1,
        )

        return job

    async def retry(self, job: Job) -> Job:
        """Manually re-queue a failed or dead job."""
        if job.status not in (JobStatus.failed, JobStatus.dead):
            raise ValidationError(f"Only failed or dead jobs can be retried, got '{job.status}'")

        job = await self._jobs.update(
            job,
            status=JobStatus.queued,
            retry_count=job.retry_count + 1,
            last_error=None,
        )
        await self._jobs.add_event(
            job_id=job.id,
            event_type=JobEventType.retry,
            attempt=job.retry_count,
            message="Manually re-queued",
        )
        return job

    async def cancel(self, job: Job) -> Job:
        if job.status in (JobStatus.running, JobStatus.claimed):
            raise ValidationError("Cannot cancel a job that is currently running")
        if job.status == JobStatus.completed:
            raise ValidationError("Cannot cancel a completed job")

        job = await self._jobs.update(job, status=JobStatus.failed)
        await self._jobs.add_event(
            job_id=job.id,
            event_type=JobEventType.cancelled,
            attempt=job.retry_count,
            message="Cancelled via API",
        )
        return job

    async def get_detail(self, job_id: uuid.UUID) -> Job:
        job = await self._jobs.get_with_relations(job_id)
        if not job:
            raise NotFoundError("Job", str(job_id))
        return job
