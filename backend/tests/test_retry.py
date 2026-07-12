import pytest
from app.workers.executor import _retry_delay
from app.models.job import Job, JobStatus, JobKind
from app.models.organization import Organization
from app.models.project import Project
from app.models.queue import Queue
from app.repositories.base import BaseRepository
from app.services.job import JobService
from app.schemas.job import EnqueueJobRequest

class OrgRepo(BaseRepository[Organization]):
    model = Organization

class ProjectRepo(BaseRepository[Project]):
    model = Project

class QueueRepo(BaseRepository[Queue]):
    model = Queue

def test_exponential_backoff_calculation():
    # Attempt 0: delay should be base * (2**0)
    job = Job(retry_count=0, payload={"_retry_delay_seconds": 10})
    assert _retry_delay(job) == 10

    # Attempt 1: delay should be base * (2**1)
    job.retry_count = 1
    assert _retry_delay(job) == 20

    # Attempt 2: delay should be base * (2**2)
    job.retry_count = 2
    assert _retry_delay(job) == 40

    # Test ceiling capping (cap at 300s / 5 minutes)
    job.retry_count = 10
    assert _retry_delay(job) == 300

@pytest.mark.asyncio
async def test_manual_retry_transitions(db_session):
    org = await OrgRepo(db_session).create(name="Test Org", slug="test-org")
    project = await ProjectRepo(db_session).create(organization_id=org.id, name="Test Project", slug="test-project")
    queue = await QueueRepo(db_session).create(
        project_id=project.id,
        name="test-queue",
        concurrency_limit=5
    )

    job_service = JobService(db_session)
    job = await job_service.enqueue(queue, EnqueueJobRequest(name="retry-test-job"))

    # Move job to failed state manually to mock failure
    job.status = JobStatus.failed
    await db_session.flush()

    # Retry the job
    retried_job = await job_service.retry(job)
    assert retried_job.status == JobStatus.queued
    assert retried_job.retry_count == 1
    assert retried_job.last_error is None
