import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class OrganizationCreateRequest(BaseModel):
    """Organization creation request DTO."""

    name: str = Field(..., min_length=2, max_length=255)
    domain: Optional[str] = Field(None, max_length=255)


class OrganizationUpdateRequest(BaseModel):
    """Organization settings update request DTO."""

    name: Optional[str] = Field(None, min_length=2, max_length=255)
    domain: Optional[str] = Field(None, max_length=255)


class OrganizationResponse(BaseModel):
    """Organization workspace details response DTO."""

    id: uuid.UUID
    name: str
    slug: str
    domain: Optional[str] = None
    is_active: bool
    created_at: datetime
    member_count: int = 1

    model_config = {"from_attributes": True}


class RoleDetail(BaseModel):
    """Role information model."""

    id: uuid.UUID
    name: str
    code: str
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class OrganizationMemberResponse(BaseModel):
    """Organization team member detail response DTO."""

    id: uuid.UUID
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool
    is_superuser: bool
    roles: List[RoleDetail] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class InviteUserRequest(BaseModel):
    """Invite user request DTO."""

    email: EmailStr
    role_code: str = Field("developer", description="Role code: owner, admin, manager, developer, viewer")


class InvitationResponse(BaseModel):
    """Invitation details response DTO."""

    id: uuid.UUID
    email: EmailStr
    role_name: str
    role_code: str
    expires_at: datetime
    created_at: datetime
    invite_url: Optional[str] = None

    model_config = {"from_attributes": True}


class AcceptInvitationRequest(BaseModel):
    """Accept invitation request DTO."""

    token: str
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    password: str = Field(..., min_length=8)


class UpdateMemberRoleRequest(BaseModel):
    """Update team member role request DTO."""

    role_code: str = Field(..., description="Target role code: admin, manager, developer, viewer")


class TransferOwnershipRequest(BaseModel):
    """Transfer organization ownership request DTO."""

    new_owner_user_id: uuid.UUID
