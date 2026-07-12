import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, Index, Integer, String, Text, Uuid, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.mixins import created_at, updated_at, uuid_pk

if TYPE_CHECKING:
    from app.models.execution import JobExecution
    from app.models.job_event import JobEvent
    from app.models.queue import Queue


class JobStatus(str, enum.Enum):
    queued = "queued"
    scheduled = "scheduled"
    claimed = "claimed"
    running = "running"
    completed = "completed"
    failed = "failed"
    dead = "dead"       # exhausted retries → dead letter


class JobKind(str, enum.Enum):
    immediate = "immediate"
    delayed = "delayed"
    scheduled = "scheduled"  # run_at is set, non-recurring
    cron = "cron"
    batch = "batch"


class Job(Base):
    __tablename__ = "jobs"
    __table_args__ = (
        CheckConstraint("retry_count >= 0", name="retry_count_non_negative"),
        CheckConstraint("max_retries >= 0", name="job_max_retries_non_negative"),
        # Partial index: fast lookup of jobs ready to run
        Index(
            "ix_jobs_queue_status_run_at",
            "queue_id",
            "status",
            "run_at",
            postgresql_where="status IN ('queued', 'scheduled')",
        ),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    queue_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("queues.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Human-readable name for dashboards / logs
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    kind: Mapped[JobKind] = mapped_column(
        Enum(JobKind, name="job_kind"), default=JobKind.immediate, nullable=False
    )
    status: Mapped[JobStatus] = mapped_column(
        Enum(JobStatus, name="job_status"), default=JobStatus.queued, nullable=False, index=True
    )

    # The actual work payload — opaque to the scheduler
    payload: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)

    # Scheduling
    run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cron_expression: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Retry tracking — copied from queue defaults at enqueue time so queue
    # policy changes don't affect in-flight jobs.
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_retries: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Idempotency key — optional, unique per queue
    idempotency_key: Mapped[str | None] = mapped_column(String(255), nullable=True)

    priority: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Batch grouping — nullable; set by the caller when submitting a batch.
    # ponytail: ceiling = batch progress tracking; upgrade = separate batches table
    batch_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), nullable=True, index=True
    )

    # Set by the scheduler when it moves the job from scheduled → queued.
    # Distinct from run_at (desired run time) — useful for measuring scheduler lag.
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = created_at()
    updated_at: Mapped[datetime] = updated_at()

    queue: Mapped["Queue"] = relationship("Queue", back_populates="jobs")
    executions: Mapped[list["JobExecution"]] = relationship(
        "JobExecution", back_populates="job", cascade="all, delete-orphan", order_by="JobExecution.started_at"
    )
    events: Mapped[list["JobEvent"]] = relationship(
        "JobEvent", back_populates="job", cascade="all, delete-orphan", order_by="JobEvent.created_at"
    )
