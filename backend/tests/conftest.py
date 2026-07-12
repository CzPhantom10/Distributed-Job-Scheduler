import asyncio
import pytest
import pytest_asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.sql import text

from app.database.session import Base
from app.core.config import settings

# Test database URL
TEST_DB_URL = "sqlite+aiosqlite:///./test.db"

# Override settings database URL for tests
settings.database_url = TEST_DB_URL

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    # Import all models to ensure they register on Base.metadata
    from app.models import User, Organization, Project, Queue, Job, JobEvent, JobExecution # noqa: F401
    
    engine = create_async_engine(TEST_DB_URL)
    async with engine.begin() as conn:
        # Recreate tables schema
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()
    
    # Remove SQLite file clean up
    import os
    if os.path.exists("./test.db"):
        try:
            os.remove("./test.db")
        except PermissionError:
            pass

@pytest_asyncio.fixture
async def db_session(setup_db) -> AsyncGenerator[AsyncSession, None]:
    engine = setup_db
    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
    async with AsyncSessionLocal() as session:
        yield session
        await session.rollback() # rollback changes between tests
