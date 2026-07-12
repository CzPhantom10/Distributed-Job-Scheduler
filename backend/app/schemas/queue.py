import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.queue import QueueStatus, RetryStrategy


# ── Requests ────────────────────────────────────────────────────────────────

class CreateQueueRequest(BaseModel):
    name: str
    priority: int = 0
    concurrency_limit: int = Field(default=5, ge=1)
    max_retries: int = Field(default=3, ge=0)
    retry_strategy: RetryStrategy = RetryStrategy.exponential
    retry_delay_seconds: int = Field(default=60, ge=1)


class UpdateQueueRequest(BaseModel):
    concurrency_limit: int | None = Field(default=None, ge=1)
    max_retries: int | None = Field(default=None, ge=0)
    retry_strategy: RetryStrategy | None = None
    retry_delay_seconds: int | None = Field(default=None, ge=1)
    priority: int | None = None


# ── Responses ────────────────────────────────────────────────────────────────

class QueueResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    status: QueueStatus
    priority: int
    concurrency_limit: int
    max_retries: int
    retry_strategy: RetryStrategy
    retry_delay_seconds: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class QueueStatsResponse(BaseModel):
    queue_id: uuid.UUID
    queue_name: str
    queued: int
    running: int
    completed: int
    failed: int
    dead: int
    avg_duration_ms: float | None


class QueueHealthResponse(BaseModel):
    queue_id: uuid.UUID
    queue_name: str
    status: str          # "healthy" | "warning" | "critical"
    reasons: list[str]
    stats: QueueStatsResponse
