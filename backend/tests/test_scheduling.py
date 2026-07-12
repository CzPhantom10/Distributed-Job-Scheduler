import pytest
from datetime import datetime, timedelta, timezone
from app.models.organization import Organization
from app.models.project import Project
from app.models.queue import Queue
from app.models.job import Job, JobStatus, JobKind
from app.repositories.base import BaseRepository
from app.repositories.job import JobRepository
from app.services.job import JobService
from app.schemas.job import EnqueueJobRequest
from app.scheduler.service import SchedulerService

class OrgRepo(BaseRepository[Organization]):
    model = Organization

class ProjectRepo(BaseRepository[Project]):
    model = Project

class QueueRepo(BaseRepository[Queue]):
    model = Queue

@pytest.mark.asyncio
async def test_job_scheduling_and_promotion(db_session):
    # 1. Setup organization, project, and queue
    org = await OrgRepo(db_session).create(name="Test Org", slug="test-org")
    project = await ProjectRepo(db_session).create(organization_id=org.id, name="Test Project", slug="test-project")
    queue = await QueueRepo(db_session).create(
        project_id=project.id,
        name="test-queue",
        concurrency_limit=5
    )

    job_service = JobService(db_session)

    # 2. Enqueue immediate job -> status should be queued
    imm_req = EnqueueJobRequest(
        name="immediate-task",
        payload={"key": "val"},
        kind=JobKind.immediate
    )
    imm_job = await job_service.enqueue(queue, imm_req)
    assert imm_job.status == JobStatus.queued
    assert imm_job.run_at is None

    # 3. Enqueue delayed job -> status should be scheduled
    future_time = datetime.now(timezone.utc) + timedelta(seconds=1)
    del_req = EnqueueJobRequest(
        name="delayed-task",
        payload={"key": "val"},
        kind=JobKind.delayed,
        run_at=future_time
    )
    del_job = await job_service.enqueue(queue, del_req)
    assert del_job.status == JobStatus.scheduled
    assert del_job.run_at == future_time

    # 4. Trigger scheduler promotion (Simulating the scheduler loop)
    # Update mock past time to force execution promotion
    del_job.run_at = datetime.now(timezone.utc) - timedelta(seconds=10)
    await db_session.flush()

    job_repo = JobRepository(db_session)
    due_jobs = await job_repo.get_due_scheduled()
    assert len(due_jobs) == 1
    assert due_jobs[0].id == del_job.id

    # Promote
    for job in due_jobs:
        job.status = JobStatus.queued
        job.scheduled_at = datetime.now(timezone.utc)
    await db_session.flush()

    assert del_job.status == JobStatus.queued
    assert del_job.scheduled_at is not None
