import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional
import re
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from app.core.exceptions import (
    AuthenticationException,
    BadRequestException,
    ConflictException,
    NotFoundException,
    PermissionDeniedException,
)
from app.core.security import generate_random_token, hash_password, hash_token
from app.models.organization import Organization
from app.models.role import Role, user_roles
from app.models.user import User
from app.repositories.invitation_repository import InvitationRepository
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.schemas.organization import (
    AcceptInvitationRequest,
    InvitationResponse,
    InviteUserRequest,
    OrganizationCreateRequest,
    OrganizationMemberResponse,
    OrganizationResponse,
    OrganizationUpdateRequest,
    RoleDetail,
    UpdateMemberRoleRequest,
)


class OrganizationService:
    """Service handling multi-tenant organization, member roles, and invitation workflows."""

    def __init__(
        self,
        org_repo: OrganizationRepository,
        user_repo: UserRepository,
        invitation_repo: InvitationRepository,
        role_repo: RoleRepository,
        db_session: AsyncSession,
    ) -> None:
        self.org_repo = org_repo
        self.user_repo = user_repo
        self.invitation_repo = invitation_repo
        self.role_repo = role_repo
        self.db = db_session

    async def get_user_highest_role(self, user: User) -> str:
        """Helper to get user's highest role code."""
        role_codes = {r.code for r in user.roles}
        if "owner" in role_codes or user.is_superuser:
            return "owner"
        if "admin" in role_codes:
            return "admin"
        if "manager" in role_codes:
            return "manager"
        if "developer" in role_codes:
            return "developer"
        return "viewer"

    async def create_organization(
        self, creator_id: uuid.UUID, data: OrganizationCreateRequest
    ) -> OrganizationResponse:
        """Create new organization and assign creator as Owner."""
        creator = await self.user_repo.get_by_id_with_roles(creator_id)
        if not creator:
            raise NotFoundException("User not found.")

        slug = re.sub(r"[^\w-]", "", data.name.lower().replace(" ", "-")) + "-" + str(uuid.uuid4())[:8]

        org = await self.org_repo.create({
            "name": data.name,
            "slug": slug,
            "domain": data.domain,
            "is_active": True,
        })

        owner_role = await self.role_repo.get_by_code("owner", org.id)
        if owner_role and owner_role not in creator.roles:
            creator.roles.append(owner_role)
            self.db.add(creator)

        creator.organization_id = org.id
        await self.db.commit()

        return OrganizationResponse(
            id=org.id,
            name=org.name,
            slug=org.slug,
            domain=org.domain,
            is_active=org.is_active,
            created_at=org.created_at,
            member_count=1,
        )

    async def get_organization(self, org_id: uuid.UUID) -> OrganizationResponse:
        """Get organization details and count active members."""
        org = await self.org_repo.get_by_id(org_id)
        if not org:
            raise NotFoundException("Organization not found.")

        stmt = (
            select(func.count(User.id))
            .where(User.organization_id == org_id)
            .where(User.deleted_at.is_(None))
        )
        count_res = await self.db.execute(stmt)
        member_count = count_res.scalar() or 1

        return OrganizationResponse(
            id=org.id,
            name=org.name,
            slug=org.slug,
            domain=org.domain,
            is_active=org.is_active,
            created_at=org.created_at,
            member_count=member_count,
        )

    async def update_organization(
        self, org_id: uuid.UUID, current_user: User, data: OrganizationUpdateRequest
    ) -> OrganizationResponse:
        """Update organization details (requires Owner or Admin role)."""
        role_code = await self.get_user_highest_role(current_user)
        if role_code not in {"owner", "admin"}:
            raise PermissionDeniedException("Only Organization Owners or Admins can modify settings.")

        org = await self.org_repo.get_by_id(org_id)
        if not org:
            raise NotFoundException("Organization not found.")

        update_dict = data.model_dump(exclude_unset=True)
        if update_dict:
            await self.org_repo.update(org, update_dict)
            await self.db.commit()

        return await self.get_organization(org_id)

    async def list_members(self, org_id: uuid.UUID) -> List[OrganizationMemberResponse]:
        """List all active team members in organization."""
        stmt = (
            select(User)
            .options(selectinload(User.roles))
            .where(User.organization_id == org_id)
            .where(User.deleted_at.is_(None))
            .order_by(User.created_at.asc())
        )
        result = await self.db.execute(stmt)
        users = list(result.scalars().all())

        return [
            OrganizationMemberResponse(
                id=u.id,
                email=u.email,
                first_name=u.first_name,
                last_name=u.last_name,
                is_active=u.is_active,
                is_superuser=u.is_superuser,
                roles=[RoleDetail.model_validate(r) for r in u.roles],
                created_at=u.created_at,
            )
            for u in users
        ]

    async def invite_user(
        self, org_id: uuid.UUID, inviter: User, data: InviteUserRequest
    ) -> InvitationResponse:
        """Invite new user to organization with specified role."""
        inviter_role = await self.get_user_highest_role(inviter)
        if inviter_role not in {"owner", "admin", "manager"}:
            raise PermissionDeniedException("You do not have permission to invite team members.")

        if data.role_code.lower() == "owner" and inviter_role != "owner":
            raise PermissionDeniedException("Only Organization Owners can invite another Owner.")

        role = await self.role_repo.get_by_code(data.role_code, org_id)
        if not role:
            raise NotFoundException(f"Role '{data.role_code}' not found.")

        raw_token = generate_random_token()
        token_hash = hash_token(raw_token)
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)

        invitation = await self.invitation_repo.create({
            "organization_id": org_id,
            "email": data.email.lower(),
            "role_id": role.id,
            "token_hash": token_hash,
            "invited_by_id": inviter.id,
            "expires_at": expires_at,
            "is_accepted": False,
        })
        await self.db.commit()

        return InvitationResponse(
            id=invitation.id,
            email=invitation.email,
            role_name=role.name,
            role_code=role.code,
            expires_at=invitation.expires_at,
            created_at=invitation.created_at,
            invite_url=f"/accept-invite?token={raw_token}",
        )

    async def accept_invitation(self, data: AcceptInvitationRequest) -> OrganizationMemberResponse:
        """Accept team invitation and register/attach user."""
        t_hash = hash_token(data.token)
        invitation = await self.invitation_repo.get_by_token_hash(t_hash)
        if not invitation:
            raise BadRequestException("Invalid, accepted, or expired invitation token.")

        user = await self.user_repo.get_by_email(invitation.email)
        if not user:
            # Create user account
            user = await self.user_repo.create({
                "organization_id": invitation.organization_id,
                "email": invitation.email.lower(),
                "hashed_password": hash_password(data.password),
                "first_name": data.first_name,
                "last_name": data.last_name,
                "is_active": True,
            })

        user.organization_id = invitation.organization_id
        if invitation.role not in user.roles:
            user.roles.append(invitation.role)

        invitation.is_accepted = True
        invitation.accepted_at = datetime.now(timezone.utc)
        self.db.add(invitation)
        self.db.add(user)
        await self.db.commit()

        return OrganizationMemberResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            is_active=user.is_active,
            is_superuser=user.is_superuser,
            roles=[RoleDetail.model_validate(r) for r in user.roles],
            created_at=user.created_at,
        )

    async def update_member_role(
        self, org_id: uuid.UUID, target_user_id: uuid.UUID, role_code: str, current_user: User
    ) -> OrganizationMemberResponse:
        """Update role assigned to a team member."""
        current_role = await self.get_user_highest_role(current_user)
        if current_role not in {"owner", "admin"}:
            raise PermissionDeniedException("Only Owners or Admins can modify member roles.")

        target_user = await self.user_repo.get_by_id_with_roles(target_user_id)
        if not target_user or target_user.organization_id != org_id:
            raise NotFoundException("Team member not found in organization.")

        target_role = await self.get_user_highest_role(target_user)
        if target_role == "owner" and current_role != "owner":
            raise PermissionDeniedException("Only the Owner can change an Owner's role.")

        new_role = await self.role_repo.get_by_code(role_code, org_id)
        if not new_role:
            raise NotFoundException(f"Role '{role_code}' not found.")

        target_user.roles = [new_role]
        self.db.add(target_user)
        await self.db.commit()

        return OrganizationMemberResponse(
            id=target_user.id,
            email=target_user.email,
            first_name=target_user.first_name,
            last_name=target_user.last_name,
            is_active=target_user.is_active,
            is_superuser=target_user.is_superuser,
            roles=[RoleDetail.model_validate(r) for r in target_user.roles],
            created_at=target_user.created_at,
        )

    async def remove_member(
        self, org_id: uuid.UUID, target_user_id: uuid.UUID, current_user: User
    ) -> None:
        """Remove a user from organization."""
        current_role = await self.get_user_highest_role(current_user)
        if current_role not in {"owner", "admin"}:
            raise PermissionDeniedException("Only Owners or Admins can remove team members.")

        target_user = await self.user_repo.get_by_id_with_roles(target_user_id)
        if not target_user or target_user.organization_id != org_id:
            raise NotFoundException("Team member not found in organization.")

        target_role = await self.get_user_highest_role(target_user)
        if target_role == "owner":
            raise PermissionDeniedException("Cannot remove the Organization Owner. Transfer ownership first.")

        await self.user_repo.soft_delete(target_user_id)
        await self.db.commit()

    async def transfer_ownership(
        self, org_id: uuid.UUID, current_owner: User, new_owner_id: uuid.UUID
    ) -> OrganizationMemberResponse:
        """Transfer Organization Ownership to another team member."""
        current_role = await self.get_user_highest_role(current_owner)
        if current_role != "owner" and not current_owner.is_superuser:
            raise PermissionDeniedException("Only the current Organization Owner can transfer ownership.")

        new_owner = await self.user_repo.get_by_id_with_roles(new_owner_id)
        if not new_owner or new_owner.organization_id != org_id:
            raise NotFoundException("Target user is not a member of this organization.")

        owner_role = await self.role_repo.get_by_code("owner", org_id)
        admin_role = await self.role_repo.get_by_code("admin", org_id)

        # Grant Owner role to new owner
        new_owner.roles = [owner_role]
        # Demote current owner to Admin
        current_owner.roles = [admin_role]

        self.db.add(new_owner)
        self.db.add(current_owner)
        await self.db.commit()

        return OrganizationMemberResponse(
            id=new_owner.id,
            email=new_owner.email,
            first_name=new_owner.first_name,
            last_name=new_owner.last_name,
            is_active=new_owner.is_active,
            is_superuser=new_owner.is_superuser,
            roles=[RoleDetail.model_validate(r) for r in new_owner.roles],
            created_at=new_owner.created_at,
        )

    async def list_roles(self, org_id: uuid.UUID) -> List[RoleDetail]:
        """List all available system and organization roles."""
        roles = await self.role_repo.list_available_roles(org_id)
        return [RoleDetail.model_validate(r) for r in roles]
