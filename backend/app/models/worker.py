import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, Integer, String, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.mixins import created_at, updated_at, uuid_pk

if TYPE_CHECKING:
    from app.models.execution import JobExecution


class WorkerStatus(str, enum.Enum):
    idle = "idle"
    busy = "busy"
    offline = "offline"


class Worker(Base):
    """
    A worker process registers itself on startup and updates its heartbeat
    on a fixed interval. The scheduler considers a worker offline if its
    last_heartbeat_at is older than 3× the heartbeat interval.
    """

    __tablename__ = "workers"

    id: Mapped[uuid.UUID] = uuid_pk()
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[WorkerStatus] = mapped_column(
        Enum(WorkerStatus, name="worker_status"),
        default=WorkerStatus.idle,
        nullable=False,
        index=True,
    )

    # Process / network identity
    hostname: Mapped[str] = mapped_column(String(255), nullable=False)
    pid: Mapped[int] = mapped_column(Integer, nullable=False)

    # Heartbeat stored on the Worker row itself.
    # ponytail: ceiling = fan-out heartbeat queries per worker per second at scale;
    # upgrade = separate worker_heartbeats table with time-series retention
    last_heartbeat_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )

    # Capacity
    max_concurrency: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    active_jobs: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Queue subscriptions — worker only polls queues it's assigned to.
    # None means "all queues" (default for simple deployments).
    queue_ids: Mapped[list | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = created_at()
    updated_at: Mapped[datetime] = updated_at()

    executions: Mapped[list["JobExecution"]] = relationship(
        "JobExecution", back_populates="worker"
    )
