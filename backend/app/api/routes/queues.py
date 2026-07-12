import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exceptions import NotFoundError
from app.database.session import get_db
from app.models.project import Project
from app.models.queue import Queue, QueueStatus
from app.models.user import User
from app.repositories.queue import QueueRepository
from app.schemas.common import Paginated
from app.schemas.queue import (
    CreateQueueRequest,
    QueueHealthResponse,
    QueueResponse,
    QueueStatsResponse,
    UpdateQueueRequest,
)

router = APIRouter()


async def _get_queue(queue_id: str, session: AsyncSession) -> Queue:
    q = await session.get(Queue, uuid.UUID(queue_id))
    if not q:
        raise NotFoundError("Queue", queue_id)
    return q


@router.post("/projects/{project_id}/queues", response_model=QueueResponse, status_code=201)
async def create_queue(
    project_id: str,
    req: CreateQueueRequest,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    project = await session.get(Project, uuid.UUID(project_id))
    if not project:
        raise NotFoundError("Project", project_id)

    repo = QueueRepository(session)
    queue = await repo.create(
        project_id=project.id,
        name=req.name,
        priority=req.priority,
        concurrency_limit=req.concurrency_limit,
        max_retries=req.max_retries,
        retry_strategy=req.retry_strategy,
        retry_delay_seconds=req.retry_delay_seconds,
    )
    await session.commit()
    return queue


@router.get("/projects/{project_id}/queues", response_model=Paginated[QueueResponse])
async def list_queues(
    project_id: str,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    repo = QueueRepository(session)
    items, total = await repo.list(
        Queue.project_id == uuid.UUID(project_id),
        offset=offset,
        limit=limit,
        order_by=Queue.name,
    )
    return Paginated(items=items, total=total, offset=offset, limit=limit)


@router.get("/queues/{queue_id}", response_model=QueueResponse)
async def get_queue(queue_id: str, session: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    return await _get_queue(queue_id, session)


@router.patch("/queues/{queue_id}", response_model=QueueResponse)
async def update_queue(
    queue_id: str,
    req: UpdateQueueRequest,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    queue = await _get_queue(queue_id, session)
    updates = req.model_dump(exclude_none=True)
    for k, v in updates.items():
        setattr(queue, k, v)
    await session.commit()
    return queue


@router.post("/queues/{queue_id}/pause", response_model=QueueResponse)
async def pause_queue(queue_id: str, session: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    queue = await _get_queue(queue_id, session)
    queue.status = QueueStatus.paused
    await session.commit()
    return queue


@router.post("/queues/{queue_id}/resume", response_model=QueueResponse)
async def resume_queue(queue_id: str, session: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    queue = await _get_queue(queue_id, session)
    queue.status = QueueStatus.active
    await session.commit()
    return queue


@router.delete("/queues/{queue_id}", status_code=204)
async def delete_queue(queue_id: str, session: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    queue = await _get_queue(queue_id, session)
    await session.delete(queue)
    await session.commit()


@router.get("/queues/{queue_id}/stats", response_model=QueueStatsResponse)
async def queue_stats(queue_id: str, session: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    queue = await _get_queue(queue_id, session)
    repo = QueueRepository(session)
    stats = await repo.get_stats(queue.id)
    return QueueStatsResponse(queue_id=queue.id, queue_name=queue.name, **stats)


@router.get("/queues/{queue_id}/health", response_model=QueueHealthResponse)
async def queue_health(queue_id: str, session: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    queue = await _get_queue(queue_id, session)
    repo = QueueRepository(session)
    health = await repo.get_health(queue)
    stats_data = health.pop("stats")
    stats = QueueStatsResponse(queue_id=queue.id, queue_name=queue.name, **stats_data)
    return QueueHealthResponse(queue_id=queue.id, queue_name=queue.name, stats=stats, **health)
