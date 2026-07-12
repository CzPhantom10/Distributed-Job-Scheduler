from croniter import croniter
from datetime import datetime, timezone


def next_run_after(cron_expression: str, after: datetime) -> datetime:
    """Returns the next datetime a cron expression fires after `after`."""
    itr = croniter(cron_expression, after)
    return itr.get_next(datetime).replace(tzinfo=timezone.utc)


def is_valid(expression: str) -> bool:
    return croniter.is_valid(expression)
