import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ApiKeyCreateRequest(BaseModel):
    """Request DTO for creating a new API key."""

    name: str = Field(..., min_length=2, max_length=100, description="Friendly name for the API key")
    expires_at: Optional[datetime] = Field(None, description="Optional expiration datetime (UTC)")
    scopes: List[str] = Field(default_factory=list, description="Permission scopes granted to this key")
    rate_limit_per_minute: Optional[int] = Field(
        None, ge=1, le=10000, description="Max requests per minute (None = unlimited)"
    )


class ApiKeyUpdateRequest(BaseModel):
    """Request DTO for updating an existing API key."""

    name: Optional[str] = Field(None, min_length=2, max_length=100)
    expires_at: Optional[datetime] = None
    scopes: Optional[List[str]] = None
    is_active: Optional[bool] = None
    rate_limit_per_minute: Optional[int] = Field(None, ge=1, le=10000)


class ApiKeyResponse(BaseModel):
    """API key response DTO — never exposes the raw token."""

    id: uuid.UUID
    organization_id: uuid.UUID
    user_id: uuid.UUID
    name: str
    prefix: str
    scopes: List[str]
    usage_count: int
    last_used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    is_active: bool
    rate_limit_per_minute: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ApiKeyGenerateResponse(BaseModel):
    """Response DTO returned once after key generation or regeneration.
    The plain `key` field is shown exactly once and never stored."""

    key: str = Field(..., description="Plain-text API key — shown once, store it securely")
    api_key: ApiKeyResponse


class ApiKeyListResponse(BaseModel):
    """Paginated list of API keys."""

    items: List[ApiKeyResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class ApiKeyValidateResponse(BaseModel):
    """Lightweight response from key validation endpoint."""

    valid: bool
    key_id: Optional[uuid.UUID] = None
    scopes: Optional[List[str]] = None
    message: str = "OK"
