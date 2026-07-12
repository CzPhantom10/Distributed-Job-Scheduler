"""
Import all models here so Alembic's autogenerate sees them in one shot.
Order matters for FK resolution; Base.metadata.create_all respects it.
"""
from app.models.user import User, OrganizationMember  # noqa: F401
from app.models.organization import Organization  # noqa: F401
from app.models.project import Project  # noqa: F401
from app.models.queue import Queue, QueueStatus, RetryStrategy  # noqa: F401
from app.models.job import Job, JobStatus, JobKind  # noqa: F401
from app.models.job_event import JobEvent, JobEventType  # noqa: F401
from app.models.execution import JobExecution, ExecutionStatus  # noqa: F401
from app.models.worker import Worker, WorkerStatus  # noqa: F401
