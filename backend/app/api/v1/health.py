from fastapi import APIRouter, Depends
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.health_controller import HealthController
from app.database.redis import get_redis_client
from app.database.session import get_db_session
from app.schemas.health import HealthStatus
from app.schemas.response import ResponseSchema
from app.services.health_service import HealthService

router = APIRouter(prefix="/health", tags=["Health Check"])


def get_health_controller(
    db_session: AsyncSession = Depends(get_db_session),
    redis_client: Redis = Depends(get_redis_client),
) -> HealthController:
    """Dependency injection helper for HealthController."""
    health_service = HealthService(db_session=db_session, redis_client=redis_client)
    return HealthController(health_service=health_service)


@router.get("", response_model=ResponseSchema[HealthStatus])
async def health_check(
    controller: HealthController = Depends(get_health_controller),
) -> ResponseSchema[HealthStatus]:
    """Retrieve system health status across PostgreSQL and Redis."""
    return await controller.get_health_status()
