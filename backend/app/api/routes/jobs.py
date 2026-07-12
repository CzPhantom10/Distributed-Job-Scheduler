import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exceptions import NotFoundError
from app.database.session import get_db
from app.models.job import Job, JobStatus
from app.models.queue import Queue
from app.models.user import User
from app.repositories.job import JobRepository
from app.schemas.common import Paginated
from app.schemas.job import EnqueueJobRequest, JobDetailResponse, JobResponse
from app.services.job import JobService

router = APIRouter()


async def _get_queue(queue_id: uuid.UUID, session: AsyncSession) -> Queue:
    q = await session.get(Queue, queue_id)
    if not q:
        raise NotFoundError("Queue", str(queue_id))
    return q


async def _get_job(job_id: str, session: AsyncSession) -> Job:
    j = await session.get(Job, uuid.UUID(job_id))
    if not j:
        raise NotFoundError("Job", job_id)
    return j


@router.post("/queues/{queue_id}/jobs", response_model=JobResponse, status_code=201)
async def enqueue_job(
    queue_id: str,
    req: EnqueueJobRequest,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    queue = await _get_queue(uuid.UUID(queue_id), session)
    service = JobService(session)
    job = await service.enqueue(queue, req)
    await session.commit()
    return job


@router.get("/queues/{queue_id}/jobs", response_model=Paginated[JobResponse])
async def list_jobs(
    queue_id: str,
    status: JobStatus | None = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    sort_by: str = Query("created_at", pattern="^(created_at|priority|status)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    from sqlalchemy import asc, desc
    repo = JobRepository(session)
    filters = [Job.queue_id == uuid.UUID(queue_id)]
    if status:
        filters.append(Job.status == status)

    sort_col = getattr(Job, sort_by)
    order = desc(sort_col) if sort_order == "desc" else asc(sort_col)
    items, total = await repo.list(*filters, offset=offset, limit=limit, order_by=order)
    return Paginated(items=items, total=total, offset=offset, limit=limit)


@router.get("/jobs/{job_id}", response_model=JobDetailResponse)
async def get_job_detail(
    job_id: str,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = JobService(session)
    job = await service.get_detail(uuid.UUID(job_id))

    return JobDetailResponse(
        id=job.id,
        name=job.name,
        kind=job.kind,
        status=job.status,
        priority=job.priority,
        payload=job.payload,
        queue_id=job.queue_id,
        queue_name=job.queue.name,
        batch_id=job.batch_id,
        idempotency_key=job.idempotency_key,
        run_at=job.run_at,
        scheduled_at=job.scheduled_at,
        cron_expression=job.cron_expression,
        retry_count=job.retry_count,
        max_retries=job.max_retries,
        last_error=job.last_error,
        retry_strategy=job.queue.retry_strategy.value,
        retry_delay_seconds=job.queue.retry_delay_seconds,
        executions=[e for e in job.executions],
        timeline=[e for e in job.events],
        created_at=job.created_at,
        updated_at=job.updated_at,
    )


@router.post("/jobs/{job_id}/retry", response_model=JobResponse)
async def retry_job(
    job_id: str,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    job = await _get_job(job_id, session)
    service = JobService(session)
    job = await service.retry(job)
    await session.commit()
    return job


@router.post("/jobs/{job_id}/cancel", response_model=JobResponse)
async def cancel_job(
    job_id: str,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    job = await _get_job(job_id, session)
    service = JobService(session)
    job = await service.cancel(job)
    await session.commit()
    return job
