"""
Job executor — runs a single job and records the outcome.

The actual "work" is dispatching on job.kind / job.payload.
For this project, the executor simulates work with a sleep.
In production, this would call a registered handler function or
make an HTTP callback to the job's target service.
"""
import asyncio
from datetime import datetime, timezone

import structlog

from app.core.logging import get_logger
from app.database.session import AsyncSessionLocal
from app.models.execution import ExecutionStatus, JobExecution
from app.models.job import Job, JobStatus
from app.models.job_event import JobEventType
from app.models.queue import RetryStrategy
from app.repositories.job import JobRepository

logger = get_logger(__name__)


async def execute_job(job: Job, worker_id) -> None:
    """
    Executes one job. Creates a JobExecution record, runs the job,
    then updates both the execution and job records with the outcome.
    Called by the worker service as an asyncio task.
    """
    started_at = datetime.now(timezone.utc)

    async with AsyncSessionLocal() as session:
        async with session.begin():
            # Transition: claimed → running
            job_repo = JobRepository(session)
            job = await session.get(Job, job.id)
            job.status = JobStatus.running

            execution = JobExecution(
                job_id=job.id,
                worker_id=worker_id,
                attempt=job.retry_count + 1,
                status=ExecutionStatus.running,
                started_at=started_at,
            )
            session.add(execution)
            await session.flush()

            await job_repo.add_event(
                job_id=job.id,
                event_type=JobEventType.running,
                attempt=execution.attempt,
                worker_id=worker_id,
            )

    # ── Run the job ──────────────────────────────────────────────────────
    output = None
    error = None
    succeeded = False
    try:
        output = await _dispatch(job)
        succeeded = True
        logger.info("job_completed", job_id=str(job.id), job_name=job.name)
    except Exception as exc:
        error = str(exc)
        logger.warning("job_failed", job_id=str(job.id), error=error)

    # ── Record outcome ───────────────────────────────────────────────────
    finished_at = datetime.now(timezone.utc)
    duration_ms = (finished_at - started_at).total_seconds() * 1000

    async with AsyncSessionLocal() as session:
        async with session.begin():
            job_repo = JobRepository(session)
            job = await session.get(Job, job.id)
            execution = await session.get(JobExecution, execution.id)

            execution.finished_at = finished_at
            execution.duration_ms = duration_ms
            execution.output = output
            execution.error = error

            if succeeded:
                execution.status = ExecutionStatus.completed
                job.status = JobStatus.completed
                await job_repo.add_event(
                    job_id=job.id,
                    event_type=JobEventType.completed,
                    attempt=execution.attempt,
                    worker_id=worker_id,
                )
            else:
                execution.status = ExecutionStatus.failed
                job.last_error = error

                if job.retry_count < job.max_retries:
                    job.retry_count += 1
                    delay = _retry_delay(job)
                    job.status = JobStatus.queued
                    await job_repo.add_event(
                        job_id=job.id,
                        event_type=JobEventType.retry,
                        attempt=execution.attempt,
                        worker_id=worker_id,
                        message=f"Retry #{job.retry_count} scheduled after {delay}s",
                    )
                    # Brief delay before re-queueing — in production this would
                    # set run_at for proper backoff scheduling
                    await asyncio.sleep(delay)
                    job.status = JobStatus.queued
                else:
                    job.status = JobStatus.dead
                    await job_repo.add_event(
                        job_id=job.id,
                        event_type=JobEventType.dead,
                        attempt=execution.attempt,
                        worker_id=worker_id,
                        message="Exhausted all retries",
                    )


async def _dispatch(job: Job) -> str:
    """
    Dispatches a job to its handler.
    ponytail: ceiling = real handler registry / plugin system;
    upgrade = dict mapping job.kind or payload['handler'] to async callables
    """
    # Simulate work duration from payload or default to 1s
    duration = float(job.payload.get("duration_seconds", 1.0))
    await asyncio.sleep(duration)
    return f"Job '{job.name}' completed after {duration}s"


def _retry_delay(job: Job) -> int:
    """Calculates retry delay based on the queue's retry strategy."""
    base = job.payload.get("_retry_delay_seconds", 10)
    attempt = job.retry_count

    from app.models.queue import RetryStrategy as RS
    # We stored retry_strategy on the queue but not on the job.
    # For now, use exponential as a safe default.
    # The queue's strategy is accessible via job.queue when loaded,
    # but executor runs with a fresh session — keep it simple.
    return min(base * (2 ** attempt), 300)  # cap at 5 minutes
