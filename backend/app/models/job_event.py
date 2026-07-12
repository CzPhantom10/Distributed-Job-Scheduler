import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Enum as SAEnum, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.mixins import created_at, uuid_pk

if TYPE_CHECKING:
    from app.models.job import Job


class JobEventType(str, enum.Enum):
    queued = "queued"
    claimed = "claimed"
    running = "running"
    completed = "completed"
    failed = "failed"
    retry = "retry"
    dead = "dead"
    cancelled = "cancelled"
    scheduled = "scheduled"  # scheduler picked it up and set run_at


class JobEvent(Base):
    """
    Lightweight timeline record — one row per status transition.
    Distinct from JobExecution: events track *state changes*, executions
    track *attempt outcomes*. A retry produces one event (retry) and one
    new execution row.
    """

    __tablename__ = "job_events"

    id: Mapped[uuid.UUID] = uuid_pk()
    job_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Which worker was involved (nullable — scheduling events have no worker)
    worker_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("workers.id", ondelete="SET NULL"),
        nullable=True,
    )

    event_type: Mapped[JobEventType] = mapped_column(
        SAEnum(JobEventType, name="job_event_type"), nullable=False
    )

    # Human-readable context: error message, retry reason, etc.
    message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Attempt number at the time of this event — makes retry timeline readable
    attempt: Mapped[int] = mapped_column(nullable=False, default=1)

    created_at: Mapped[datetime] = created_at()

    job: Mapped["Job"] = relationship("Job", back_populates="events")
