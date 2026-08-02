import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestException, NotFoundException, PermissionDeniedException
from app.core.security import verify_password
from app.models.user import User
from app.repositories.setting_repository import SettingRepository
from app.repositories.user_repository import UserRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.schemas.settings import (
    ActiveSessionResponse,
    OrganizationSettingsResponse,
    OrganizationSettingsUpdateRequest,
    RevokeSessionResponse,
    TwoFactorStatusResponse,
    UserSettingsResponse,
    UserSettingsUpdateRequest,
)


class SettingsService:
    """Service handling User Preferences, Appearance, Notifications, Security, Sessions, and 2FA."""

    def __init__(
        self,
        setting_repo: SettingRepository,
        user_repo: UserRepository,
        audit_repo: AuditLogRepository,
        db_session: AsyncSession,
    ) -> None:
        self.repo = setting_repo
        self.user_repo = user_repo
        self.audit = audit_repo
        self.db = db_session

    # ──────────────────────────────────────────────
    # User Preferences (General, Appearance, Notifications, Timezone, Language)
    # ──────────────────────────────────────────────

    async def get_user_settings(self, user: User) -> UserSettingsResponse:
        """Fetch current user preferences and settings."""
        stored = await self.repo.get_by_key(user.organization_id, f"user_pref_{user.id}")
        pref: Dict[str, Any] = stored.value if stored and isinstance(stored.value, dict) else {}

        return UserSettingsResponse(
            user_id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            language=pref.get("language", "en"),
            timezone=pref.get("timezone", "UTC"),
            theme=pref.get("theme", "dark"),
            accent_color=pref.get("accent_color", "blue"),
            email_notifications=pref.get("email_notifications", True),
            security_alerts=pref.get("security_alerts", True),
            product_updates=pref.get("product_updates", False),
            digest_frequency=pref.get("digest_frequency", "daily"),
            session_timeout_minutes=pref.get("session_timeout_minutes", 60),
            two_factor_enabled=pref.get("two_factor_enabled", False),
        )

    async def update_user_settings(
        self, user: User, data: UserSettingsUpdateRequest
    ) -> UserSettingsResponse:
        """Update user preferences and profile details."""
        # Update user profile fields if provided
        user_updates = {}
        if data.first_name is not None:
            user_updates["first_name"] = data.first_name
        if data.last_name is not None:
            user_updates["last_name"] = data.last_name

        if user_updates:
            await self.user_repo.update(user, user_updates)

        # Update JSON preferences blob
        current_settings = await self.get_user_settings(user)
        pref_dict = current_settings.model_dump()

        update_fields = data.model_dump(exclude_unset=True)
        for key, val in update_fields.items():
            if key not in ("first_name", "last_name") and val is not None:
                pref_dict[key] = val

        await self.repo.set_key(
            organization_id=user.organization_id,
            key=f"user_pref_{user.id}",
            value=pref_dict,
            description=f"Preferences for user {user.email}",
        )

        await self.audit.log_action(
            organization_id=user.organization_id,
            actor_id=user.id,
            action="user.settings_updated",
            resource_type="user",
            resource_id=str(user.id),
            details=update_fields,
        )
        await self.db.commit()

        return await self.get_user_settings(user)

    # ──────────────────────────────────────────────
    # Sessions Management
    # ──────────────────────────────────────────────

    async def list_user_sessions(
        self, user: User, current_token_hash: Optional[str] = None
    ) -> List[ActiveSessionResponse]:
        """Fetch active sessions for current user."""
        sessions = await self.repo.list_user_sessions(user.id)
        res = []
        for s in sessions:
            dto = ActiveSessionResponse.model_validate(s)
            if current_token_hash and s.token_hash == current_token_hash:
                dto.is_current = True
            res.append(dto)
        return res

    async def revoke_session(self, user: User, session_id: uuid.UUID) -> RevokeSessionResponse:
        """Revoke a specific user login session."""
        success = await self.repo.revoke_session_by_id(session_id, user.id)
        if not success:
            raise NotFoundException("Session not found or already revoked.")

        await self.audit.log_action(
            organization_id=user.organization_id,
            actor_id=user.id,
            action="session.revoked",
            resource_type="session",
            resource_id=str(session_id),
        )
        await self.db.commit()
        return RevokeSessionResponse(message="Session revoked successfully.", revoked_count=1)

    async def revoke_all_other_sessions(
        self, user: User, current_token_hash: Optional[str] = None
    ) -> RevokeSessionResponse:
        """Revoke all active sessions for the user except current session."""
        count = await self.repo.revoke_other_sessions(user.id, current_token_hash)
        await self.audit.log_action(
            organization_id=user.organization_id,
            actor_id=user.id,
            action="sessions.all_other_revoked",
            resource_type="session",
            details={"revoked_count": count},
        )
        await self.db.commit()
        return RevokeSessionResponse(
            message=f"Revoked {count} other active session(s).", revoked_count=count
        )

    # ──────────────────────────────────────────────
    # 2FA Placeholder (Two-Factor Authentication)
    # ──────────────────────────────────────────────

    async def get_2fa_details(self, user: User) -> TwoFactorStatusResponse:
        """Get 2FA configuration status and TOTP setup details (Placeholder)."""
        stored = await self.repo.get_by_key(user.organization_id, f"user_pref_{user.id}")
        pref: Dict[str, Any] = stored.value if stored and isinstance(stored.value, dict) else {}
        enabled = pref.get("two_factor_enabled", False)

        # Placeholder secret and QR code for TOTP setup demonstration
        secret = "JBSWY3DPEHPK3PXP"  # Base32 TOTP secret placeholder
        qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/SalesAI:{user.email}?secret={secret}%26issuer=SalesAI"
        backup_codes = ["8492-1029", "4729-9102", "3819-2048", "9102-4821", "5819-3012"]

        return TwoFactorStatusResponse(
            enabled=enabled,
            qr_code_url=qr_url if not enabled else None,
            secret_key=secret if not enabled else None,
            backup_codes=backup_codes,
            message="2FA enabled" if enabled else "2FA is disabled. Scan QR code to set up TOTP.",
        )

    async def enable_2fa(self, user: User, totp_code: str) -> TwoFactorStatusResponse:
        """Verify code and enable 2FA."""
        # For demonstration placeholder, accept any 6-digit numeric code
        if not totp_code.isdigit() or len(totp_code) != 6:
            raise BadRequestException("Invalid 6-digit TOTP code.")

        stored = await self.repo.get_by_key(user.organization_id, f"user_pref_{user.id}")
        pref: Dict[str, Any] = stored.value if stored and isinstance(stored.value, dict) else {}
        pref["two_factor_enabled"] = True

        await self.repo.set_key(
            organization_id=user.organization_id,
            key=f"user_pref_{user.id}",
            value=pref,
            description=f"Preferences for user {user.email}",
        )

        await self.audit.log_action(
            organization_id=user.organization_id,
            actor_id=user.id,
            action="user.2fa_enabled",
            resource_type="user",
            resource_id=str(user.id),
        )
        await self.db.commit()

        return await self.get_2fa_details(user)

    async def disable_2fa(self, user: User, current_password: str) -> TwoFactorStatusResponse:
        """Disable 2FA after verifying current password."""
        if not verify_password(current_password, user.hashed_password):
            raise BadRequestException("Incorrect current password.")

        stored = await self.repo.get_by_key(user.organization_id, f"user_pref_{user.id}")
        pref: Dict[str, Any] = stored.value if stored and isinstance(stored.value, dict) else {}
        pref["two_factor_enabled"] = False

        await self.repo.set_key(
            organization_id=user.organization_id,
            key=f"user_pref_{user.id}",
            value=pref,
            description=f"Preferences for user {user.email}",
        )

        await self.audit.log_action(
            organization_id=user.organization_id,
            actor_id=user.id,
            action="user.2fa_disabled",
            resource_type="user",
            resource_id=str(user.id),
        )
        await self.db.commit()

        return await self.get_2fa_details(user)

    # ──────────────────────────────────────────────
    # Organization System Settings
    # ──────────────────────────────────────────────

    async def get_org_settings(self, organization_id: uuid.UUID) -> OrganizationSettingsResponse:
        """Fetch organization-wide system settings."""
        stored = await self.repo.get_by_key(organization_id, "org_sys_settings")
        d: Dict[str, Any] = stored.value if stored and isinstance(stored.value, dict) else {}

        return OrganizationSettingsResponse(
            organization_id=organization_id,
            site_name=d.get("site_name", "SalesAI Workspace"),
            support_email=d.get("support_email", "support@salesai.io"),
            default_language=d.get("default_language", "en"),
            default_timezone=d.get("default_timezone", "UTC"),
            allowed_ip_ranges=d.get("allowed_ip_ranges"),
            enforce_2fa=d.get("enforce_2fa", False),
            require_password_change_days=d.get("require_password_change_days"),
            updated_at=stored.updated_at if stored else user_now(),
        )

    async def update_org_settings(
        self, user: User, organization_id: uuid.UUID, data: OrganizationSettingsUpdateRequest
    ) -> OrganizationSettingsResponse:
        """Update organization-wide settings (Requires Owner/Admin)."""
        role_codes = {r.code for r in user.roles}
        if not user.is_superuser and role_codes and not role_codes.intersection({"owner", "admin"}):
            raise PermissionDeniedException("Only organization Owners or Admins can modify workspace settings.")

        current = await self.get_org_settings(organization_id)
        d = current.model_dump()

        updates = data.model_dump(exclude_unset=True)
        for k, v in updates.items():
            if v is not None:
                d[k] = v

        await self.repo.set_key(
            organization_id=organization_id,
            key="org_sys_settings",
            value=d,
            description="Organization-wide system settings",
        )

        await self.audit.log_action(
            organization_id=organization_id,
            actor_id=user.id,
            action="org.settings_updated",
            resource_type="organization",
            resource_id=str(organization_id),
            details=updates,
        )
        await self.db.commit()

        return await self.get_org_settings(organization_id)


def user_now():
    from datetime import datetime, timezone
    return datetime.now(timezone.utc)
