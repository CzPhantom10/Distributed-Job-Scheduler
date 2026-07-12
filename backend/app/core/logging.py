import logging
import sys

import structlog

from app.core.config import settings


def configure_logging() -> None:
    """
    Set up structlog with JSON output in production, pretty console output in debug mode.
    Call once at application startup.
    """
    shared_processors: list = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
    ]

    if settings.debug:
        renderer = structlog.dev.ConsoleRenderer()
    else:
        renderer = structlog.processors.JSONRenderer()

    structlog.configure(
        processors=shared_processors + [
            structlog.stdlib.filter_by_level,
            structlog.processors.format_exc_info,
            renderer
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # Setup basic config for standard log levels routing to stdout
    logging.basicConfig(level=logging.INFO if settings.debug else logging.WARNING, stream=sys.stdout)


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    return structlog.get_logger(name)
