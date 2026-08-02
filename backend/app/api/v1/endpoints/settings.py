import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Header, status

from app.api.deps import get_current_user, get_settings_service
from app.models.user import User
from app.schemas.settings import (
    ActiveSessionResponse,
    OrganizationSettingsResponse,
    OrganizationSettingsUpdateRequest,
    RevokeSessionResponse,
    TwoFactorDisableRequest,
    TwoFactorEnableRequest,
    TwoFactorStatusResponse,
    UserSettingsResponse,
    UserSettingsUpdateRequest,
)
from app.services.settings_service import SettingsService

router = APIRouter(prefix="/settings", tags=["Settings Module"])


# ── User Settings & Preferences ───────────────────────────────────────────────

@router.get(
    "/user",
    response_model=UserSettingsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user profile preferences",
    description="Retrieve preferences for language, timezone, appearance theme, notification toggles, and security settings.",
)
async def get_user_settings(
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(get_settings_service),
) -> UserSettingsResponse:
    return await service.get_user_settings(current_user)


@router.patch(
    "/user",
    response_model=UserSettingsResponse,
    status_code=status.HTTP_200_OK,
    summary="Update user preferences",
    description="Update language, timezone, theme, notification channels, or session timeout preferences.",
)
async def update_user_settings(
    data: UserSettingsUpdateRequest,
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(get_settings_service),
) -> UserSettingsResponse:
    return await service.update_user_settings(current_user, data)


# ── Sessions Management ────────────────────────────────────────────────────────

@router.get(
    "/sessions",
    response_model=List[ActiveSessionResponse],
    status_code=status.HTTP_200_OK,
    summary="List active login sessions",
    description="Retrieve all active authentication sessions associated with the user account.",
)
async def list_sessions(
    current_user: User = Depends(get_current_user),
    authorization: Optional[str] = Header(None),
    service: SettingsService = Depends(get_settings_service),
) -> List[ActiveSessionResponse]:
    token_hash = None
    if authorization and authorization.startswith("Bearer "):
        raw_token = authorization.split(" ")[1]
        from app.core.security import hash_token
        token_hash = hash_token(raw_token)

    return await service.list_user_sessions(current_user, current_token_hash=token_hash)


@router.delete(
    "/sessions/{session_id}",
    response_model=RevokeSessionResponse,
    status_code=status.HTTP_200_OK,
    summary="Revoke active login session",
    description="Revoke a specific login session by ID.",
)
async def revoke_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(get_settings_service),
) -> RevokeSessionResponse:
    return await service.revoke_session(current_user, session_id)


@router.delete(
    "/sessions",
    response_model=RevokeSessionResponse,
    status_code=status.HTTP_200_OK,
    summary="Revoke all other active sessions",
    description="Revoke all active authentication sessions except the current request session.",
)
async def revoke_all_other_sessions(
    current_user: User = Depends(get_current_user),
    authorization: Optional[str] = Header(None),
    service: SettingsService = Depends(get_settings_service),
) -> RevokeSessionResponse:
    token_hash = None
    if authorization and authorization.startswith("Bearer "):
        raw_token = authorization.split(" ")[1]
        from app.core.security import hash_token
        token_hash = hash_token(raw_token)

    return await service.revoke_all_other_sessions(current_user, current_token_hash=token_hash)


# ── Two-Factor Authentication (2FA) ───────────────────────────────────────────

@router.get(
    "/2fa",
    response_model=TwoFactorStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Get 2FA status & setup details",
    description="Retrieve 2FA status, TOTP QR code setup URL, secret key, and backup codes placeholder.",
)
async def get_2fa_status(
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(get_settings_service),
) -> TwoFactorStatusResponse:
    return await service.get_2fa_details(current_user)


@router.post(
    "/2fa/enable",
    response_model=TwoFactorStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Enable 2FA authentication",
    description="Verify TOTP code and enable Two-Factor Authentication.",
)
async def enable_2fa(
    data: TwoFactorEnableRequest,
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(get_settings_service),
) -> TwoFactorStatusResponse:
    return await service.enable_2fa(current_user, data.totp_code)


@router.post(
    "/2fa/disable",
    response_model=TwoFactorStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Disable 2FA authentication",
    description="Verify account password and disable Two-Factor Authentication.",
)
async def disable_2fa(
    data: TwoFactorDisableRequest,
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(get_settings_service),
) -> TwoFactorStatusResponse:
    return await service.disable_2fa(current_user, data.current_password)


# ── Organization System Settings ───────────────────────────────────────────────

@router.get(
    "/organization",
    response_model=OrganizationSettingsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get organization system settings",
    description="Fetch organization-wide default settings, language, timezone, and security policies.",
)
async def get_organization_settings(
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(get_settings_service),
) -> OrganizationSettingsResponse:
    return await service.get_org_settings(current_user.organization_id)


@router.patch(
    "/organization",
    response_model=OrganizationSettingsResponse,
    status_code=status.HTTP_200_OK,
    summary="Update organization system settings",
    description="Update organization-wide settings (Requires Owner or Admin role).",
)
async def update_organization_settings(
    data: OrganizationSettingsUpdateRequest,
    current_user: User = Depends(get_current_user),
    service: SettingsService = Depends(get_settings_service),
) -> OrganizationSettingsResponse:
    return await service.update_org_settings(current_user, current_user.organization_id, data)
