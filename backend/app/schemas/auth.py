import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    """Registration request payload."""

    email: EmailStr
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    organization_name: Optional[str] = Field(None, max_length=255, description="Organization workspace name")


class UserLoginRequest(BaseModel):
    """Login request payload."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Token pair response payload."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = Field(..., description="Access token lifetime in seconds")


class RefreshTokenRequest(BaseModel):
    """Refresh token request payload."""

    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    """Forgot password request payload."""

    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Reset password request payload."""

    token: str
    new_password: str = Field(..., min_length=8)


class VerifyEmailRequest(BaseModel):
    """Email verification request payload."""

    token: str


class ChangePasswordRequest(BaseModel):
    """Change password request payload for authenticated user."""

    old_password: str
    new_password: str = Field(..., min_length=8)


class UserProfileUpdateRequest(BaseModel):
    """Update profile request payload."""

    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)


class RoleInfo(BaseModel):
    """Role summary info."""

    id: uuid.UUID
    name: str
    code: str

    model_config = {"from_attributes": True}


class UserProfileResponse(BaseModel):
    """User profile response DTO."""

    id: uuid.UUID
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    organization_id: uuid.UUID
    is_active: bool
    is_superuser: bool
    created_at: datetime
    roles: List[RoleInfo] = []

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    """Generic status message response."""

    success: bool = True
    message: str
