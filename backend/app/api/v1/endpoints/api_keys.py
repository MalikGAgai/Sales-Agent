import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import (
    get_api_key_service,
    get_current_user,
)
from app.models.user import User
from app.schemas.api_key import (
    ApiKeyCreateRequest,
    ApiKeyGenerateResponse,
    ApiKeyListResponse,
    ApiKeyResponse,
    ApiKeyUpdateRequest,
    ApiKeyValidateResponse,
)
from app.services.api_key_service import ApiKeyService, AVAILABLE_SCOPES

router = APIRouter(prefix="/api-keys", tags=["API Keys"])


# ── List ───────────────────────────────────────────────────────────────────────
@router.get("", response_model=ApiKeyListResponse, summary="List API keys")
async def list_api_keys(
    search: Optional[str] = Query(None, description="Search by key name"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    scope: Optional[str] = Query(None, description="Filter keys that include this scope"),
    expires_before: Optional[datetime] = Query(None, description="Keys expiring before this datetime"),
    expires_after: Optional[datetime] = Query(None, description="Keys expiring after this datetime"),
    sort_by: str = Query("created_at", description="Column to sort by"),
    sort_order: str = Query("desc", description="Sort direction: asc | desc"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    service: ApiKeyService = Depends(get_api_key_service),
) -> ApiKeyListResponse:
    """List all API keys for the current user's organization."""
    return await service.list_keys(
        organization_id=current_user.organization_id,
        search=search,
        is_active=is_active,
        scope=scope,
        expires_before=expires_before,
        expires_after=expires_after,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit,
    )


# ── Available Scopes Catalogue ─────────────────────────────────────────────────
@router.get("/scopes", response_model=List[str], summary="Available permission scopes")
async def list_available_scopes(
    current_user: User = Depends(get_current_user),
) -> List[str]:
    """Return the catalogue of all valid permission scopes."""
    return AVAILABLE_SCOPES


# ── Generate ───────────────────────────────────────────────────────────────────
@router.post(
    "",
    response_model=ApiKeyGenerateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a new API key",
)
async def generate_api_key(
    data: ApiKeyCreateRequest,
    current_user: User = Depends(get_current_user),
    service: ApiKeyService = Depends(get_api_key_service),
) -> ApiKeyGenerateResponse:
    """
    Generate a new API key. The plain token is returned **once** — store it securely.
    Permission check (owner/admin) is enforced by the service layer.
    """
    return await service.generate_key(
        organization_id=current_user.organization_id,
        user=current_user,
        data=data,
    )


# ── Get single ─────────────────────────────────────────────────────────────────
@router.get("/{key_id}", response_model=ApiKeyResponse, summary="Get API key detail")
async def get_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: ApiKeyService = Depends(get_api_key_service),
) -> ApiKeyResponse:
    """Fetch details of a single API key by ID."""
    return await service.get_key(
        organization_id=current_user.organization_id,
        key_id=key_id,
    )


# ── Regenerate ────────────────────────────────────────────────────────────────
@router.post(
    "/{key_id}/regenerate",
    response_model=ApiKeyGenerateResponse,
    summary="Regenerate API key",
)
async def regenerate_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: ApiKeyService = Depends(get_api_key_service),
) -> ApiKeyGenerateResponse:
    """
    Invalidate the current key and issue a new one. The new plain token is returned **once**.
    Permission check (owner/admin) is enforced by the service layer.
    """
    return await service.regenerate_key(
        organization_id=current_user.organization_id,
        key_id=key_id,
        user=current_user,
    )


# ── Update (deactivate / change name / scopes / expiry / rate-limit) ─────────
@router.patch(
    "/{key_id}",
    response_model=ApiKeyResponse,
    summary="Update API key",
)
async def update_api_key(
    key_id: uuid.UUID,
    data: ApiKeyUpdateRequest,
    current_user: User = Depends(get_current_user),
    service: ApiKeyService = Depends(get_api_key_service),
) -> ApiKeyResponse:
    """Update name, scopes, expiration, rate-limit, or active status.
    Permission check (owner/admin) is enforced by the service layer."""
    return await service.update_key(
        organization_id=current_user.organization_id,
        key_id=key_id,
        user=current_user,
        data=data,
    )


# ── Delete ────────────────────────────────────────────────────────────────────
@router.delete(
    "/{key_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete API key",
)
async def delete_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: ApiKeyService = Depends(get_api_key_service),
) -> None:
    """Permanently delete an API key. This action cannot be undone.
    Permission check (owner/admin) is enforced by the service layer."""
    await service.delete_key(
        organization_id=current_user.organization_id,
        key_id=key_id,
        user=current_user,
    )


# ── Validate (public — used by external services) ─────────────────────────────
@router.post("/validate", response_model=ApiKeyValidateResponse, summary="Validate an API key")
async def validate_api_key(
    token: str = Query(..., description="The plain-text API key to validate"),
    service: ApiKeyService = Depends(get_api_key_service),
) -> ApiKeyValidateResponse:
    """
    Validate a plain-text API key. If valid, records usage and returns scopes.
    No authentication required — used by external services calling the platform.
    """
    return await service.validate_key(raw_token=token)
