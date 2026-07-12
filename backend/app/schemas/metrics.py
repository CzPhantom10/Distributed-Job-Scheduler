from datetime import datetime

from pydantic import BaseModel


class SystemOverviewResponse(BaseModel):
    """Top-level dashboard numbers."""
    total_projects: int
    total_queues: int
    active_workers: int
    queued_jobs: int
    running_jobs: int
    failed_jobs: int
    dead_jobs: int
    completed_jobs: int


class ThroughputPoint(BaseModel):
    """One data point for a time-series chart."""
    timestamp: datetime
    completed: int
    failed: int


class ThroughputResponse(BaseModel):
    """Jobs completed/failed per minute over a time window."""
    window_minutes: int
    points: list[ThroughputPoint]


class MetricsSummaryResponse(BaseModel):
    """Rolled-up metrics for the metrics dashboard."""
    jobs_per_minute: float
    success_rate: float        # 0.0 – 1.0
    failure_rate: float
    retry_rate: float          # retried / total_finished
    avg_execution_ms: float | None
    worker_utilization: float  # avg(active_jobs / max_concurrency) across active workers
