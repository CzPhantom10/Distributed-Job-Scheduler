"""
Worker process entry point.
Run with: python -m app.workers.entrypoint
"""
import asyncio
import signal

from app.core.logging import configure_logging, get_logger
from app.workers.service import WorkerService

logger = get_logger(__name__)


async def main() -> None:
    configure_logging()
    logger.info("worker_process_starting")

    service = WorkerService()

    import os
    if os.name != "nt":
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGINT, signal.SIGTERM):
            loop.add_signal_handler(sig, service.stop)
    
    try:
        await service.start()
    except (KeyboardInterrupt, SystemExit):
        service.stop()
    logger.info("worker_process_stopped")


if __name__ == "__main__":
    asyncio.run(main())
