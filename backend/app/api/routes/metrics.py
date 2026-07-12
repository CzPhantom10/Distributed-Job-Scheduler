from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.metrics import MetricsSummaryResponse, SystemOverviewResponse, ThroughputResponse
from app.services.metrics import MetricsService

router = APIRouter()


@router.get("/overview", response_model=SystemOverviewResponse)
async def system_overview(
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """System-wide job and worker counts for the main dashboard."""
    return await MetricsService(session).system_overview()


@router.get("/throughput", response_model=ThroughputResponse)
async def throughput(
    window_minutes: int = Query(60, ge=5, le=1440),
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Jobs completed/failed per minute — time-series data for charts."""
    return await MetricsService(session).throughput(window_minutes)


@router.get("/summary", response_model=MetricsSummaryResponse)
async def metrics_summary(
    session: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Rolled-up rates and averages over the last hour."""
    return await MetricsService(session).summary()
