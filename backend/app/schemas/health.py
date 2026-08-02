from datetime import datetime
from pydantic import BaseModel, Field


class HealthStatus(BaseModel):
    """Health check status schema."""

    status: str = Field(..., description="Overall service status (healthy/degraded)")
    environment: str = Field(..., description="Current running environment")
    version: str = Field(..., description="Application version")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="UTC Timestamp")
    database: str = Field(..., description="Database connection status")
    redis: str = Field(..., description="Redis connection status")
