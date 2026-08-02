import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


# ── User Preferences Settings Schema ──────────────────────────────────────────

class UserSettingsResponse(BaseModel):
    """Response DTO for user profile settings & preferences."""

    user_id: uuid.UUID
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    language: str = Field("en", description="Preferred interface language (e.g. en, es, fr, de)")
    timezone: str = Field("UTC", description="Preferred timezone (e.g. UTC, America/New_York, Europe/London)")
    theme: str = Field("dark", description="Appearance theme: dark | light | system")
    accent_color: str = Field("blue", description="Primary UI accent color")
    email_notifications: bool = True
    security_alerts: bool = True
    product_updates: bool = False
    digest_frequency: str = Field("daily", description="Email digest frequency: instant | daily | weekly | never")
    session_timeout_minutes: int = Field(60, ge=15, le=1440)
    two_factor_enabled: bool = False

    model_config = {"from_attributes": True}


class UserSettingsUpdateRequest(BaseModel):
    """Request DTO for updating user profile settings & preferences."""

    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    language: Optional[str] = Field(None, min_length=2, max_length=10)
    timezone: Optional[str] = Field(None, min_length=2, max_length=100)
    theme: Optional[str] = Field(None, pattern="^(dark|light|system)$")
    accent_color: Optional[str] = Field(None, pattern="^(blue|indigo|purple|emerald|amber)$")
    email_notifications: Optional[bool] = None
    security_alerts: Optional[bool] = None
    product_updates: Optional[bool] = None
    digest_frequency: Optional[str] = Field(None, pattern="^(instant|daily|weekly|never)$")
    session_timeout_minutes: Optional[int] = Field(None, ge=15, le=1440)


# ── Sessions Schema ────────────────────────────────────────────────────────────

class ActiveSessionResponse(BaseModel):
    """DTO representing an active user login session."""

    id: uuid.UUID
    user_id: uuid.UUID
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    expires_at: datetime
    is_revoked: bool
    is_current: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class RevokeSessionResponse(BaseModel):
    """Response DTO when revoking a session."""

    message: str = "Session revoked successfully."
    revoked_count: int = 1


# ── Two-Factor Authentication (2FA) Placeholder Schema ────────────────────────

class TwoFactorStatusResponse(BaseModel):
    """Response DTO for 2FA configuration status & TOTP setup placeholder."""

    enabled: bool
    qr_code_url: Optional[str] = Field(
        None, description="Data URI / URL for TOTP QR Code scanner (placeholder)"
    )
    secret_key: Optional[str] = Field(
        None, description="Base32 TOTP Secret key for manual entry (placeholder)"
    )
    backup_codes: List[str] = Field(
        default_factory=list, description="List of single-use emergency backup recovery codes"
    )
    message: str = "2FA status retrieved."


class TwoFactorEnableRequest(BaseModel):
    """Request DTO to verify code and enable 2FA."""

    totp_code: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")


class TwoFactorDisableRequest(BaseModel):
    """Request DTO to disable 2FA with password confirmation."""

    current_password: str = Field(..., min_length=1, description="Current account password")


# ── Organization-Wide System Settings Schema ────────────────────────────────

class OrganizationSettingsResponse(BaseModel):
    """Response DTO for workspace system settings."""

    organization_id: uuid.UUID
    site_name: str = "SalesAI Workspace"
    support_email: EmailStr = "support@salesai.io"
    default_language: str = "en"
    default_timezone: str = "UTC"
    allowed_ip_ranges: Optional[str] = None
    enforce_2fa: bool = False
    require_password_change_days: Optional[int] = None
    updated_at: datetime


class OrganizationSettingsUpdateRequest(BaseModel):
    """Request DTO for updating organization-wide settings."""

    site_name: Optional[str] = Field(None, min_length=2, max_length=100)
    support_email: Optional[EmailStr] = None
    default_language: Optional[str] = None
    default_timezone: Optional[str] = None
    allowed_ip_ranges: Optional[str] = None
    enforce_2fa: Optional[bool] = None
    require_password_change_days: Optional[int] = Field(None, ge=30, le=365)
