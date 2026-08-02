import uuid
from typing import List
from fastapi import APIRouter, Depends, status

from app.api.deps import get_current_user, get_org_service
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.organization import (
    AcceptInvitationRequest,
    InvitationResponse,
    InviteUserRequest,
    OrganizationCreateRequest,
    OrganizationMemberResponse,
    OrganizationResponse,
    OrganizationUpdateRequest,
    RoleDetail,
    TransferOwnershipRequest,
    UpdateMemberRoleRequest,
)
from app.services.organization_service import OrganizationService

router = APIRouter(prefix="/organizations", tags=["Organizations & Team Management"])


@router.post(
    "",
    response_model=OrganizationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create organization workspace",
    description="Provision a new multi-tenant organization workspace and set the creator as Owner.",
)
async def create_organization(
    data: OrganizationCreateRequest,
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
) -> OrganizationResponse:
    return await org_service.create_organization(current_user.id, data)


@router.get(
    "/me",
    response_model=OrganizationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current organization details",
    description="Retrieve workspace details and active member counts for the current user's organization.",
)
async def get_current_organization(
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
) -> OrganizationResponse:
    return await org_service.get_organization(current_user.organization_id)


@router.patch(
    "/me",
    response_model=OrganizationResponse,
    status_code=status.HTTP_200_OK,
    summary="Update organization settings",
    description="Update organization name or custom domain (Requires Owner or Admin role).",
)
async def update_organization_settings(
    data: OrganizationUpdateRequest,
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
) -> OrganizationResponse:
    return await org_service.update_organization(current_user.organization_id, current_user, data)


@router.get(
    "/me/members",
    response_model=List[OrganizationMemberResponse],
    status_code=status.HTTP_200_OK,
    summary="List organization team members",
    description="Fetch a list of all active team members in the current organization.",
)
async def list_members(
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
) -> List[OrganizationMemberResponse]:
    return await org_service.list_members(current_user.organization_id)


@router.post(
    "/me/invitations",
    response_model=InvitationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Invite new team member",
    description="Dispatch an invitation token to a user for joining the organization with a specified role (Owner, Admin, Manager, Developer, Viewer).",
)
async def invite_user(
    data: InviteUserRequest,
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
) -> InvitationResponse:
    return await org_service.invite_user(current_user.organization_id, current_user, data)


@router.post(
    "/invitations/accept",
    response_model=OrganizationMemberResponse,
    status_code=status.HTTP_200_OK,
    summary="Accept organization invitation token",
    description="Verify an invitation token, create or update user account, and attach to organization.",
)
async def accept_invitation(
    data: AcceptInvitationRequest,
    org_service: OrganizationService = Depends(get_org_service),
) -> OrganizationMemberResponse:
    return await org_service.accept_invitation(data)


@router.delete(
    "/me/members/{user_id}",
    status_code=status.HTTP_200_OK,
    response_model=MessageResponse,
    summary="Remove team member",
    description="Remove a member from the organization (Requires Owner or Admin role).",
)
async def remove_member(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
) -> MessageResponse:
    await org_service.remove_member(current_user.organization_id, user_id, current_user)
    return MessageResponse(message="Team member removed successfully.")


@router.patch(
    "/me/members/{user_id}/role",
    response_model=OrganizationMemberResponse,
    status_code=status.HTTP_200_OK,
    summary="Change member role",
    description="Update role assigned to a team member (Requires Owner or Admin role).",
)
async def update_member_role(
    user_id: uuid.UUID,
    data: UpdateMemberRoleRequest,
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
) -> OrganizationMemberResponse:
    return await org_service.update_member_role(
        current_user.organization_id, user_id, data.role_code, current_user
    )


@router.post(
    "/me/transfer-ownership",
    response_model=OrganizationMemberResponse,
    status_code=status.HTTP_200_OK,
    summary="Transfer organization ownership",
    description="Transfer Organization Owner status to another team member (Requires current Owner role).",
)
async def transfer_ownership(
    data: TransferOwnershipRequest,
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
) -> OrganizationMemberResponse:
    return await org_service.transfer_ownership(
        current_user.organization_id, current_user, data.new_owner_user_id
    )


@router.get(
    "/me/roles",
    response_model=List[RoleDetail],
    status_code=status.HTTP_200_OK,
    summary="List available workspace roles",
    description="Fetch a list of all available system and organization roles (Owner, Admin, Manager, Developer, Viewer).",
)
async def list_roles(
    current_user: User = Depends(get_current_user),
    org_service: OrganizationService = Depends(get_org_service),
) -> List[RoleDetail]:
    return await org_service.list_roles(current_user.organization_id)
