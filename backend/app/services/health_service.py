import asyncio
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from app.config.settings import settings
from app.schemas.health import HealthStatus


class HealthService:
    """Service layer handling application health checks across DB and Redis."""

    def __init__(self, db_session: AsyncSession, redis_client: Redis) -> None:
        self.db_session = db_session
        self.redis_client = redis_client

    async def check_health(self) -> HealthStatus:
        """Perform health checks on database and cache services."""
        # Check PostgreSQL
        db_status = "healthy"
        try:
            await asyncio.wait_for(self.db_session.execute(text("SELECT 1")), timeout=2.0)
        except Exception:
            db_status = "unhealthy"

        # Check Redis
        redis_status = "healthy"
        try:
            await asyncio.wait_for(self.redis_client.ping(), timeout=2.0)
        except Exception:
            redis_status = "unhealthy"

        overall_status = (
            "healthy"
            if db_status == "healthy" and redis_status == "healthy"
            else "degraded"
        )

        return HealthStatus(
            status=overall_status,
            environment=settings.ENVIRONMENT,
            version="0.1.0",
            timestamp=datetime.utcnow(),
            database=db_status,
            redis=redis_status,
        )
