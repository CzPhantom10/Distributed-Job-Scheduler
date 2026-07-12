import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.worker import WorkerStatus


class WorkerResponse(BaseModel):
    id: uuid.UUID
    name: str
    status: WorkerStatus
    hostname: str
    pid: int
    max_concurrency: int
    active_jobs: int
    last_heartbeat_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class WorkerStatsResponse(BaseModel):
    worker_id: uuid.UUID
    worker_name: str
    hostname: str
    status: WorkerStatus
    active_jobs: int
    max_concurrency: int
    last_heartbeat_at: datetime | None
    completed_jobs: int
    failed_jobs: int
