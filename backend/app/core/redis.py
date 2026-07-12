import redis.asyncio as aioredis

from app.core.config import settings

# Module-level singleton — created once in app lifespan, reused across requests.
_redis: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    if _redis is None:
        raise RuntimeError("Redis client not initialized. Call init_redis() first.")
    return _redis


async def init_redis() -> None:
    global _redis
    _redis = await aioredis.from_url(
        settings.redis_url,
        encoding="utf-8",
        decode_responses=True,
    )


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None
