from fastapi import status
from app.schemas.health import HealthStatus
from app.schemas.response import ResponseSchema
from app.services.health_service import HealthService


class HealthController:
    """Controller layer handling HTTP request processing for health endpoints."""

    def __init__(self, health_service: HealthService) -> None:
        self.health_service = health_service

    async def get_health_status(self) -> ResponseSchema[HealthStatus]:
        """Orchestrate health status retrieval and wrap in standard API response."""
        health_data = await self.health_service.check_health()
        return ResponseSchema[HealthStatus](
            success=True,
            message="SalesAI API health status retrieved successfully",
            data=health_data,
        )
