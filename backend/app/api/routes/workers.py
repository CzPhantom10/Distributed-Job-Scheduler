import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.exceptions import NotFoundError
from app.database.session import get_db
from app.models.user import User
from app.models.worker import Worker
from app.repositories.worker import WorkerRepository
from app.schemas.common import Paginated
from app.schemas.worker import WorkerResponse, WorkerStatsResponse

router = APIRouter()


@router.get("", response_model=Paginated[WorkerResponse])
async def list_workers(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    repo = WorkerRepository(session)
    items, total = await repo.list(offset=offset, limit=limit, order_by=Worker.name)
    return Paginated(items=items, total=total, offset=offset, limit=limit)


@router.get("/active", response_model=list[WorkerStatsResponse])
async def list_active_workers(
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Returns only currently-alive workers with their stats — for the Worker Status dashboard."""
    repo = WorkerRepository(session)
    workers = await repo.get_active()
    result = []
    for w in workers:
        stats = await repo.get_stats(w.id)
        result.append(WorkerStatsResponse(
            worker_id=w.id,
            worker_name=w.name,
            hostname=w.hostname,
            status=w.status,
            active_jobs=w.active_jobs,
            max_concurrency=w.max_concurrency,
            last_heartbeat_at=w.last_heartbeat_at,
            completed_jobs=stats["completed"],
            failed_jobs=stats["failed"],
        ))
    return result


@router.get("/{worker_id}", response_model=WorkerStatsResponse)
async def get_worker(
    worker_id: str,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    repo = WorkerRepository(session)
    worker = await repo.get(uuid.UUID(worker_id))
    if not worker:
        raise NotFoundError("Worker", worker_id)

    stats = await repo.get_stats(worker.id)
    return WorkerStatsResponse(
        worker_id=worker.id,
        worker_name=worker.name,
        hostname=worker.hostname,
        status=worker.status,
        active_jobs=worker.active_jobs,
        max_concurrency=worker.max_concurrency,
        last_heartbeat_at=worker.last_heartbeat_at,
        completed_jobs=stats["completed"],
        failed_jobs=stats["failed"],
    )
