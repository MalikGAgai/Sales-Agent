import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ActorInfo(BaseModel):
    """Actor information snapshot."""

    id: uuid.UUID
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

    model_config = {"from_attributes": True}


class AuditLogResponse(BaseModel):
    """Single audit log entry response DTO."""

    id: uuid.UUID
    organization_id: Optional[uuid.UUID] = None
    actor_id: Optional[uuid.UUID] = None
    actor: Optional[ActorInfo] = None
    action: str = Field(..., description="Action name (e.g. user.login, project.created, api_key.regenerated)")
    resource_type: str = Field(..., description="Target resource type (e.g. user, project, api_key, settings)")
    resource_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditLogListResponse(BaseModel):
    """Paginated list of audit log entries."""

    items: List[AuditLogResponse]
    total: int
    page: int
    limit: int
    total_pages: int
