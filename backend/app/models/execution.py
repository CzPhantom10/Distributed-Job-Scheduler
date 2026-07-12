import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, Text, Uuid, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.mixins import created_at, uuid_pk

if TYPE_CHECKING:
    from app.models.job import Job
    from app.models.worker import Worker


class ExecutionStatus(str, enum.Enum):
    running = "running"
    completed = "completed"
    failed = "failed"


class JobExecution(Base):
    """One record per execution attempt. Retry #2 produces a second row."""

    __tablename__ = "job_executions"

    id: Mapped[uuid.UUID] = uuid_pk()
    job_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    worker_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("workers.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    attempt: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    status: Mapped[ExecutionStatus] = mapped_column(
        Enum(ExecutionStatus, name="execution_status"),
        default=ExecutionStatus.running,
        nullable=False,
    )

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_ms: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Logs captured during execution — stored inline.
    # ponytail: ceiling = GB-scale logs or log streaming; upgrade = separate job_logs table or object storage
    output: Mapped[str | None] = mapped_column(Text, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Snapshot of payload / result for audit purposes
    result: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = created_at()

    job: Mapped["Job"] = relationship("Job", back_populates="executions")
    worker: Mapped["Worker | None"] = relationship("Worker", back_populates="executions")
