"""
Shared SQLAlchemy column helpers used across all models.
Keeps model files clean and avoids repetition.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column


def uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def created_at() -> Mapped[datetime]:
    return mapped_column(DateTime(timezone=True), default=now_utc, nullable=False)


def updated_at() -> Mapped[datetime]:
    return mapped_column(
        DateTime(timezone=True),
        default=now_utc,
        onupdate=now_utc,
        nullable=False,
    )
