from typing import Optional
from redis.asyncio import Redis, ConnectionPool
from app.config.settings import settings
from app.core.logging import logger

redis_pool: Optional[ConnectionPool] = None


def get_redis_pool() -> ConnectionPool:
    """Initialize or return the Redis connection pool."""
    global redis_pool
    if redis_pool is None:
        redis_pool = ConnectionPool.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=20,
        )
    return redis_pool


async def get_redis_client() -> Redis:
    """Dependency provider for async Redis client instance."""
    pool = get_redis_pool()
    return Redis(connection_pool=pool)


async def close_redis() -> None:
    """Close Redis connection pool on application shutdown."""
    global redis_pool
    if redis_pool is not None:
        logger.info("Closing Redis connection pool...")
        await redis_pool.disconnect()
        redis_pool = None
