import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, HttpUrl


class ProjectCreateRequest(BaseModel):
    """Client website project creation request DTO."""

    name: str = Field(..., min_length=2, max_length=255)
    website_url: Optional[str] = Field(None, max_length=255)
    country: Optional[str] = Field(None, max_length=100)
    timezone: Optional[str] = Field(None, max_length=100)
    industry: Optional[str] = Field(None, max_length=100)
    currency: str = Field("USD", min_length=3, max_length=10)
    status: str = Field("active", max_length=50)
    logo_url: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None


class ProjectUpdateRequest(BaseModel):
    """Client website project update request DTO."""

    name: Optional[str] = Field(None, min_length=2, max_length=255)
    website_url: Optional[str] = Field(None, max_length=255)
    country: Optional[str] = Field(None, max_length=100)
    timezone: Optional[str] = Field(None, max_length=100)
    industry: Optional[str] = Field(None, max_length=100)
    currency: Optional[str] = Field(None, min_length=3, max_length=10)
    status: Optional[str] = Field(None, max_length=50)
    logo_url: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None


class AuditLogResponse(BaseModel):
    """Audit log entry summary for project timeline."""

    id: uuid.UUID
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[dict] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ProjectResponse(BaseModel):
    """Client website project detail response DTO."""

    id: uuid.UUID
    organization_id: uuid.UUID
    creator_id: Optional[uuid.UUID] = None
    name: str
    slug: str
    website_url: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = None
    industry: Optional[str] = None
    currency: str = "USD"
    status: str = "active"
    logo_url: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectDetailResponse(ProjectResponse):
    """Project details including audit logs timeline."""

    audit_logs: List[AuditLogResponse] = []


class ProjectListResponse(BaseModel):
    """Paginated projects response wrapper."""

    items: List[ProjectResponse]
    total: int
    page: int
    limit: int
    total_pages: int
