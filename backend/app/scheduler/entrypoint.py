"""
Scheduler process entry point.
Run with: python -m app.scheduler.entrypoint
"""
import asyncio
import signal

from app.core.logging import configure_logging, get_logger
from app.scheduler.service import SchedulerService

logger = get_logger(__name__)


async def main() -> None:
    configure_logging()
    logger.info("scheduler_process_starting")

    service = SchedulerService()

    import os
    if os.name != "nt":
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGINT, signal.SIGTERM):
            loop.add_signal_handler(sig, service.stop)
    
    try:
        await service.start()
    except (KeyboardInterrupt, SystemExit):
        service.stop()
    logger.info("scheduler_process_stopped")


if __name__ == "__main__":
    asyncio.run(main())
