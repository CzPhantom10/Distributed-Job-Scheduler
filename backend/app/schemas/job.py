import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel

from app.models.job import JobKind, JobStatus
from app.models.job_event import JobEventType


# ── Requests ────────────────────────────────────────────────────────────────

class EnqueueJobRequest(BaseModel):
    name: str
    payload: dict[str, Any] = {}
    kind: JobKind = JobKind.immediate
    priority: int = 0
    run_at: datetime | None = None
    cron_expression: str | None = None
    batch_id: uuid.UUID | None = None
    idempotency_key: str | None = None


# ── Responses ───────────────────────────────────────────────────────────────

class JobEventResponse(BaseModel):
    id: uuid.UUID
    event_type: JobEventType
    message: str | None
    attempt: int
    worker_id: uuid.UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ExecutionResponse(BaseModel):
    id: uuid.UUID
    attempt: int
    status: str
    worker_id: uuid.UUID | None
    started_at: datetime
    finished_at: datetime | None
    duration_ms: float | None
    output: str | None
    error: str | None

    model_config = {"from_attributes": True}


class JobResponse(BaseModel):
    """Lightweight job representation for list views."""
    id: uuid.UUID
    name: str
    kind: JobKind
    status: JobStatus
    priority: int
    retry_count: int
    max_retries: int
    queue_id: uuid.UUID
    batch_id: uuid.UUID | None
    run_at: datetime | None
    scheduled_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class JobDetailResponse(BaseModel):
    """Full job detail — used by the Job Details page."""
    id: uuid.UUID
    name: str
    kind: JobKind
    status: JobStatus
    priority: int
    payload: dict[str, Any]
    queue_id: uuid.UUID
    queue_name: str
    batch_id: uuid.UUID | None
    idempotency_key: str | None

    # Scheduling
    run_at: datetime | None
    scheduled_at: datetime | None
    cron_expression: str | None

    # Retry
    retry_count: int
    max_retries: int
    last_error: str | None

    # Retry policy inherited from queue
    retry_strategy: str
    retry_delay_seconds: int

    # Relations
    executions: list[ExecutionResponse]
    timeline: list[JobEventResponse]

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
