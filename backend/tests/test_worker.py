import pytest
import uuid
import os
import socket
from datetime import datetime, timezone
from app.models.organization import Organization
from app.models.project import Project
from app.models.queue import Queue
from app.models.job import Job, JobStatus
from app.models.worker import Worker, WorkerStatus
from app.repositories.base import BaseRepository
from app.repositories.job import JobRepository
from app.repositories.worker import WorkerRepository

class OrgRepo(BaseRepository[Organization]):
    model = Organization

class ProjectRepo(BaseRepository[Project]):
    model = Project

class QueueRepo(BaseRepository[Queue]):
    model = Queue

@pytest.mark.asyncio
async def test_worker_registration_and_atomic_claim(db_session):
    # 1. Register worker
    worker_repo = WorkerRepository(db_session)
    worker = await worker_repo.create(
        name="test-worker-node",
        hostname=socket.gethostname(),
        pid=os.getpid(),
        status=WorkerStatus.idle,
        max_concurrency=10,
        last_heartbeat_at=datetime.now(timezone.utc)
    )
    assert worker.id is not None
    assert worker.status == WorkerStatus.idle

    # 2. Update heartbeat
    old_heartbeat = worker.last_heartbeat_at
    await worker_repo.update_heartbeat(worker.id)
    assert worker.last_heartbeat_at > old_heartbeat

    # 3. Setup organization, project, queue, and jobs
    org = await OrgRepo(db_session).create(name="Test Org", slug="test-org")
    project = await ProjectRepo(db_session).create(organization_id=org.id, name="Test Project", slug="test-project")
    queue = await QueueRepo(db_session).create(
        project_id=project.id,
        name="test-queue",
        concurrency_limit=5
    )

    job_repo = JobRepository(db_session)
    job1 = await job_repo.create(
        queue_id=queue.id,
        name="job-1",
        status=JobStatus.queued,
        priority=10
    )
    job2 = await job_repo.create(
        queue_id=queue.id,
        name="job-2",
        status=JobStatus.queued,
        priority=20 # Higher priority job
    )

    # 4. Atomic claim: Should return the highest priority job (job2)
    claimed_job = await job_repo.claim_next(queue.id, worker.id)
    assert claimed_job is not None
    assert claimed_job.id == job2.id
    assert claimed_job.status == JobStatus.claimed

    # 5. Claim next should return job1
    claimed_job_2 = await job_repo.claim_next(queue.id, worker.id)
    assert claimed_job_2 is not None
    assert claimed_job_2.id == job1.id

    # 6. Claim when no jobs left should return None
    no_job = await job_repo.claim_next(queue.id, worker.id)
    assert no_job is None
