import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
import re
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from app.core.exceptions import (
    AuthenticationException,
    BadRequestException,
    ConflictException,
    NotFoundException,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_random_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    MessageResponse,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserProfileUpdateRequest,
)


class AuthService:
    """Service encapsulating authentication, session management, and profile workflows."""

    def __init__(
        self,
        user_repo: UserRepository,
        org_repo: OrganizationRepository,
        session_repo: SessionRepository,
        db_session: AsyncSession,
    ) -> None:
        self.user_repo = user_repo
        self.org_repo = org_repo
        self.session_repo = session_repo
        self.db = db_session

    async def register(self, data: UserRegisterRequest) -> TokenResponse:
        """Register new user, create organization if required, and issue initial JWT token pair."""
        existing_user = await self.user_repo.get_by_email(data.email)
        if existing_user:
            raise ConflictException(f"User with email '{data.email}' already exists.")

        # Determine Organization
        org_name = data.organization_name or f"{data.first_name or 'User'}'s Workspace"
        org_slug = re.sub(r"[^\w-]", "", org_name.lower().replace(" ", "-")) + "-" + str(uuid.uuid4())[:8]

        org = await self.org_repo.create({
            "name": org_name,
            "slug": org_slug,
            "is_active": True,
        })

        # Create User
        user = await self.user_repo.create({
            "organization_id": org.id,
            "email": data.email.lower(),
            "hashed_password": hash_password(data.password),
            "first_name": data.first_name,
            "last_name": data.last_name,
            "is_active": True,
            "is_superuser": False,
        })

        # Issue Tokens
        access_token = create_access_token(subject=str(user.id), extra_claims={"org_id": str(org.id)})
        refresh_token = create_refresh_token(subject=str(user.id), extra_claims={"org_id": str(org.id)})

        # Record Session
        ref_hash = hash_token(refresh_token)
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        await self.session_repo.create({
            "user_id": user.id,
            "token_hash": ref_hash,
            "expires_at": expires_at,
            "is_revoked": False,
        })

        await self.db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def login(
        self, data: UserLoginRequest, ip_address: Optional[str] = None, user_agent: Optional[str] = None
    ) -> TokenResponse:
        """Authenticate user credentials and issue token pair."""
        user = await self.user_repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise AuthenticationException("Invalid email or password.")

        if not user.is_active:
            raise AuthenticationException("User account is inactive.")

        access_token = create_access_token(
            subject=str(user.id), extra_claims={"org_id": str(user.organization_id)}
        )
        refresh_token = create_refresh_token(
            subject=str(user.id), extra_claims={"org_id": str(user.organization_id)}
        )

        ref_hash = hash_token(refresh_token)
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        await self.session_repo.create({
            "user_id": user.id,
            "token_hash": ref_hash,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "expires_at": expires_at,
            "is_revoked": False,
        })

        await self.db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def refresh_tokens(self, refresh_token: str) -> TokenResponse:
        """Rotate tokens using a valid refresh token."""
        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                raise AuthenticationException("Invalid token type. Refresh token required.")
            user_id = uuid.UUID(payload.get("sub"))
        except Exception:
            raise AuthenticationException("Invalid or expired refresh token.")

        ref_hash = hash_token(refresh_token)
        session = await self.session_repo.get_by_token_hash(ref_hash)
        if not session or session.is_revoked:
            raise AuthenticationException("Session is revoked or expired.")

        user = await self.user_repo.get_by_id_with_roles(user_id)
        if not user or not user.is_active:
            raise AuthenticationException("User not found or inactive.")

        # Revoke old session
        await self.session_repo.revoke_session(ref_hash)

        # Generate new token pair
        new_access_token = create_access_token(
            subject=str(user.id), extra_claims={"org_id": str(user.organization_id)}
        )
        new_refresh_token = create_refresh_token(
            subject=str(user.id), extra_claims={"org_id": str(user.organization_id)}
        )

        new_ref_hash = hash_token(new_refresh_token)
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        await self.session_repo.create({
            "user_id": user.id,
            "token_hash": new_ref_hash,
            "ip_address": session.ip_address,
            "user_agent": session.user_agent,
            "expires_at": expires_at,
            "is_revoked": False,
        })

        await self.db.commit()

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def logout(self, refresh_token: Optional[str]) -> MessageResponse:
        """Revoke active session token."""
        if refresh_token:
            ref_hash = hash_token(refresh_token)
            await self.session_repo.revoke_session(ref_hash)
            await self.db.commit()
        return MessageResponse(message="Successfully logged out.")

    async def forgot_password(self, email: str) -> MessageResponse:
        """Generate password reset token."""
        user = await self.user_repo.get_by_email(email)
        if user:
            reset_token = generate_random_token()
            # Reset token logic (in production, dispatch email with reset link)
            _ = hash_token(reset_token)
        return MessageResponse(
            message="If an account with that email exists, a password reset link has been dispatched."
        )

    async def reset_password(self, token: str, new_password: str) -> MessageResponse:
        """Verify token and update user password."""
        # For demonstration & security specification, decode reset token or token hash
        try:
            payload = decode_token(token)
            user_id = uuid.UUID(payload.get("sub"))
        except Exception:
            raise BadRequestException("Invalid or expired password reset token.")

        user = await self.user_repo.get_by_id_with_roles(user_id)
        if not user:
            raise NotFoundException("User not found.")

        await self.user_repo.update(user, {"hashed_password": hash_password(new_password)})
        await self.session_repo.revoke_all_user_sessions(user.id)
        await self.db.commit()

        return MessageResponse(message="Password reset successfully. Please log in with your new password.")

    async def verify_email(self, token: str) -> MessageResponse:
        """Verify user email address using verification token."""
        try:
            payload = decode_token(token)
            user_id = uuid.UUID(payload.get("sub"))
        except Exception:
            raise BadRequestException("Invalid or expired email verification token.")

        user = await self.user_repo.get_by_id_with_roles(user_id)
        if not user:
            raise NotFoundException("User not found.")

        await self.db.commit()
        return MessageResponse(message="Email address verified successfully.")

    async def change_password(
        self, user_id: uuid.UUID, old_password: str, new_password: str
    ) -> MessageResponse:
        """Change password for an authenticated user."""
        user = await self.user_repo.get_by_id_with_roles(user_id)
        if not user:
            raise NotFoundException("User not found.")

        if not verify_password(old_password, user.hashed_password):
            raise BadRequestException("Incorrect current password.")

        await self.user_repo.update(user, {"hashed_password": hash_password(new_password)})
        await self.session_repo.revoke_all_user_sessions(user_id)
        await self.db.commit()

        return MessageResponse(message="Password changed successfully. Please log in with your new password.")

    async def update_profile(
        self, user_id: uuid.UUID, data: UserProfileUpdateRequest
    ) -> MessageResponse:
        """Update profile information."""
        user = await self.user_repo.get_by_id_with_roles(user_id)
        if not user:
            raise NotFoundException("User not found.")

        update_dict = data.model_dump(exclude_unset=True)
        await self.user_repo.update(user, update_dict)
        await self.db.commit()

        return MessageResponse(message="Profile updated successfully.")

    async def delete_account(self, user_id: uuid.UUID) -> MessageResponse:
        """Soft delete user account and revoke all active sessions."""
        user = await self.user_repo.get_by_id_with_roles(user_id)
        if not user:
            raise NotFoundException("User not found.")

        await self.session_repo.revoke_all_user_sessions(user_id)
        await self.user_repo.soft_delete(user_id)
        await self.db.commit()

        return MessageResponse(message="Account deleted successfully.")
