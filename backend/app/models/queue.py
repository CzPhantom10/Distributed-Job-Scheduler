import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Enum, ForeignKey, Integer, String, UniqueConstraint, Uuid, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base
from app.models.mixins import created_at, updated_at, uuid_pk

if TYPE_CHECKING:
    from app.models.job import Job
    from app.models.project import Project


class QueueStatus(str, enum.Enum):
    active = "active"
    paused = "paused"


class RetryStrategy(str, enum.Enum):
    fixed = "fixed"
    linear = "linear"
    exponential = "exponential"


class Queue(Base):
    __tablename__ = "queues"
    __table_args__ = (
        UniqueConstraint("project_id", "name"),
        CheckConstraint("concurrency_limit > 0", name="concurrency_limit_positive"),
        CheckConstraint("max_retries >= 0", name="max_retries_non_negative"),
        CheckConstraint("retry_delay_seconds > 0", name="retry_delay_positive"),
    )

    id: Mapped[uuid.UUID] = uuid_pk()
    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[QueueStatus] = mapped_column(
        Enum(QueueStatus, name="queue_status"), default=QueueStatus.active, nullable=False
    )

    # Execution limits
    concurrency_limit: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=0, nullable=False, index=True)

    # Retry policy stored inline — YAGNI for a separate RetryPolicy table until
    # retry policies need to be shared across queues.
    # ponytail: ceiling = shared retry templates; upgrade = separate retry_policies table
    max_retries: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    retry_strategy: Mapped[RetryStrategy] = mapped_column(
        Enum(RetryStrategy, name="retry_strategy"), default=RetryStrategy.exponential, nullable=False
    )
    retry_delay_seconds: Mapped[int] = mapped_column(Integer, default=60, nullable=False)

    # Arbitrary queue-level metadata (webhooks, tags, etc.)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)

    created_at: Mapped[datetime] = created_at()
    updated_at: Mapped[datetime] = updated_at()

    project: Mapped["Project"] = relationship("Project", back_populates="queues")
    jobs: Mapped[list["Job"]] = relationship(
        "Job", back_populates="queue", cascade="all, delete-orphan"
    )
