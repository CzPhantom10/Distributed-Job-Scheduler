"""
Worker service — polls queues, claims jobs, executes them concurrently.
Responsibilities:
  - Register itself in the workers table on startup
  - Poll assigned queues for claimable jobs
  - Atomically claim jobs (SELECT FOR UPDATE SKIP LOCKED via JobRepository)
  - Execute jobs as asyncio tasks (respecting concurrency limit)
  - Send heartbeat on a fixed interval
  - Deregister / mark offline on graceful shutdown
"""
import asyncio
import os
import socket
import uuid
from datetime import datetime, timezone

import structlog

from app.core.config import settings
from app.core.logging import get_logger
from app.database.session import AsyncSessionLocal
from app.models.worker import Worker, WorkerStatus
from app.repositories.job import JobRepository
from app.repositories.queue import QueueRepository
from app.repositories.worker import WorkerRepository
from app.workers.executor import execute_job

logger = get_logger(__name__)


class WorkerService:
    def __init__(self, name: str | None = None) -> None:
        self._name = name or f"worker-{uuid.uuid4().hex[:8]}"
        self._worker_id: uuid.UUID | None = None
        self._running = False
        self._active_tasks: set[asyncio.Task] = set()

    async def start(self) -> None:
        self._running = True
        self._worker_id = await self._register()
        logger.info("worker_started", name=self._name, id=str(self._worker_id))

        await asyncio.gather(
            self._poll_loop(),
            self._heartbeat_loop(),
        )

    def stop(self) -> None:
        self._running = False

    async def _register(self) -> uuid.UUID:
        async with AsyncSessionLocal() as session:
            async with session.begin():
                worker = Worker(
                    name=self._name,
                    hostname=socket.gethostname(),
                    pid=os.getpid(),
                    status=WorkerStatus.idle,
                    max_concurrency=settings.worker_max_concurrency,
                    last_heartbeat_at=datetime.now(timezone.utc),
                )
                session.add(worker)
            return worker.id

    async def _poll_loop(self) -> None:
        """Continuously polls all active queues and claims available jobs."""
        while self._running:
            if len(self._active_tasks) >= settings.worker_max_concurrency:
                await asyncio.sleep(settings.worker_poll_interval)
                continue

            try:
                queues = await self._get_queues()
                claimed_any = False

                for queue in queues:
                    if len(self._active_tasks) >= settings.worker_max_concurrency:
                        break

                    async with AsyncSessionLocal() as session:
                        async with session.begin():
                            job_repo = JobRepository(session)
                            job = await job_repo.claim_next(queue.id, self._worker_id)

                    if job:
                        claimed_any = True
                        task = asyncio.create_task(
                            execute_job(job, self._worker_id),
                            name=f"job-{job.id}",
                        )
                        self._active_tasks.add(task)
                        task.add_done_callback(self._active_tasks.discard)
                        await self._update_active_count()

                if not claimed_any:
                    await asyncio.sleep(settings.worker_poll_interval)

            except Exception:
                logger.exception("worker_poll_error")
                await asyncio.sleep(settings.worker_poll_interval)

        # Wait for in-flight jobs to finish before exiting
        if self._active_tasks:
            logger.info("worker_draining", active_tasks=len(self._active_tasks))
            await asyncio.gather(*self._active_tasks, return_exceptions=True)

        await self._mark_offline()

    async def _heartbeat_loop(self) -> None:
        """Sends heartbeat on a fixed interval."""
        while self._running:
            await asyncio.sleep(settings.worker_heartbeat_interval)
            try:
                async with AsyncSessionLocal() as session:
                    async with session.begin():
                        repo = WorkerRepository(session)
                        await repo.update_heartbeat(self._worker_id)
                logger.debug("worker_heartbeat_sent", id=str(self._worker_id))
            except Exception:
                logger.exception("worker_heartbeat_error")

    async def _get_queues(self):
        from sqlalchemy import select
        from app.models.queue import Queue, QueueStatus
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(Queue).where(Queue.status == QueueStatus.active)
            )
            return list(result.scalars())

    async def _update_active_count(self) -> None:
        try:
            async with AsyncSessionLocal() as session:
                async with session.begin():
                    worker = await session.get(Worker, self._worker_id)
                    if worker:
                        worker.active_jobs = len(self._active_tasks)
                        worker.status = WorkerStatus.busy if self._active_tasks else WorkerStatus.idle
        except Exception:
            pass  # non-critical — heartbeat will correct it

    async def _mark_offline(self) -> None:
        try:
            async with AsyncSessionLocal() as session:
                async with session.begin():
                    worker = await session.get(Worker, self._worker_id)
                    if worker:
                        worker.status = WorkerStatus.offline
                        worker.active_jobs = 0
        except Exception:
            logger.exception("worker_mark_offline_error")
