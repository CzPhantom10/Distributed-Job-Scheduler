import pytest
from app.models.organization import Organization
from app.models.project import Project
from app.models.queue import Queue, QueueStatus, RetryStrategy
from app.repositories.queue import QueueRepository
from app.repositories.base import BaseRepository
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

class OrgRepo(BaseRepository[Organization]):
    model = Organization

class ProjectRepo(BaseRepository[Project]):
    model = Project

@pytest.mark.asyncio
async def test_queue_creation_and_constraints(db_session):
    org_repo = OrgRepo(db_session)
    proj_repo = ProjectRepo(db_session)
    queue_repo = QueueRepository(db_session)

    # 1. Setup organization and project
    org = await org_repo.create(name="Test Org", slug="test-org")
    project = await proj_repo.create(organization_id=org.id, name="Test Project", slug="test-project")

    # 2. Create queue successfully
    queue = await queue_repo.create(
        project_id=project.id,
        name="test-queue",
        concurrency_limit=5,
        max_retries=3,
        retry_strategy=RetryStrategy.exponential,
        retry_delay_seconds=30
    )
    assert queue.name == "test-queue"
    assert queue.status == QueueStatus.active

    # 3. Pause and resume queue
    queue.status = QueueStatus.paused
    await db_session.flush()
    assert queue.status == QueueStatus.paused

    queue.status = QueueStatus.active
    await db_session.flush()
    assert queue.status == QueueStatus.active

    # 4. Verify Db check constraints (concurrency limit must be positive)
    with pytest.raises(IntegrityError):
        bad_queue = Queue(
            project_id=project.id,
            name="bad-queue",
            concurrency_limit=0, # constraint fails
            max_retries=3,
            retry_strategy=RetryStrategy.fixed,
            retry_delay_seconds=30
        )
        db_session.add(bad_queue)
        await db_session.flush()
