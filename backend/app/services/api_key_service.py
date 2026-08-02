import math
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestException, NotFoundException, PermissionDeniedException
from app.core.security import generate_random_token, hash_token
from app.models.user import User
from app.repositories.api_key_repository import ApiKeyRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.schemas.api_key import (
    ApiKeyCreateRequest,
    ApiKeyGenerateResponse,
    ApiKeyListResponse,
    ApiKeyResponse,
    ApiKeyUpdateRequest,
    ApiKeyValidateResponse,
)

# Predefined scope catalogue (returned in metadata endpoint)
AVAILABLE_SCOPES: List[str] = [
    "read:projects",
    "write:projects",
    "read:api_keys",
    "write:api_keys",
    "read:organization",
    "write:organization",
    "read:audit_logs",
    "admin:all",
]

# Roles allowed to manage API keys
MANAGE_KEY_ROLES = {"owner", "admin"}


class ApiKeyService:
    """Service encapsulating all API Key lifecycle operations."""

    def __init__(
        self,
        api_key_repo: ApiKeyRepository,
        audit_repo: AuditLogRepository,
        db_session: AsyncSession,
    ) -> None:
        self.repo = api_key_repo
        self.audit = audit_repo
        self.db = db_session

    # ──────────────────────────────────────────────
    # Helpers
    # ──────────────────────────────────────────────

    def _assert_can_manage(self, user: User) -> None:
        """Raise PermissionDeniedException if user lacks admin/owner role.

        Logic:
          1. Superusers always pass.
          2. Users with no roles are treated as org owners (the first/registering user).
          3. Users with roles must have 'owner' or 'admin'.
        """
        if user.is_superuser:
            return
        role_codes = {r.code for r in user.roles}
        # First registered user has no roles yet — treat as owner
        if not role_codes:
            return
        if not role_codes.intersection(MANAGE_KEY_ROLES):
            raise PermissionDeniedException(
                "Only organization Owners or Admins can manage API keys."
            )

    def _make_prefix(self, raw_token: str) -> str:
        """Return the first 8 chars of the token as a human-readable prefix."""
        return raw_token[:8]

    # ──────────────────────────────────────────────
    # Generate
    # ──────────────────────────────────────────────

    async def generate_key(
        self,
        organization_id: uuid.UUID,
        user: User,
        data: ApiKeyCreateRequest,
    ) -> ApiKeyGenerateResponse:
        """Create a new API key. Returns the plain token once."""
        self._assert_can_manage(user)

        # Validate scopes
        if data.scopes:
            invalid = set(data.scopes) - set(AVAILABLE_SCOPES)
            if invalid:
                raise BadRequestException(f"Invalid scope(s): {', '.join(sorted(invalid))}")

        raw_token = generate_random_token(32)
        prefix = self._make_prefix(raw_token)
        key_hash = hash_token(raw_token)

        key = await self.repo.create({
            "organization_id": organization_id,
            "user_id": user.id,
            "name": data.name,
            "prefix": prefix,
            "key_hash": key_hash,
            "scopes": data.scopes or [],
            "expires_at": data.expires_at,
            "is_active": True,
            "usage_count": 0,
            "rate_limit_per_minute": data.rate_limit_per_minute,
        })

        await self.audit.log_action(
            organization_id=organization_id,
            actor_id=user.id,
            action="api_key.created",
            resource_type="api_key",
            resource_id=str(key.id),
            details={"name": key.name, "prefix": prefix, "scopes": key.scopes},
        )
        await self.db.commit()

        return ApiKeyGenerateResponse(
            key=raw_token,
            api_key=ApiKeyResponse.model_validate(key),
        )

    # ──────────────────────────────────────────────
    # Regenerate
    # ──────────────────────────────────────────────

    async def regenerate_key(
        self,
        organization_id: uuid.UUID,
        key_id: uuid.UUID,
        user: User,
    ) -> ApiKeyGenerateResponse:
        """Invalidate the current key hash and issue a new token."""
        self._assert_can_manage(user)

        key = await self.repo.get_by_id(key_id)
        if not key or key.organization_id != organization_id:
            raise NotFoundException("API key not found.")

        raw_token = generate_random_token(32)
        prefix = self._make_prefix(raw_token)
        key_hash = hash_token(raw_token)

        await self.repo.update(key, {
            "prefix": prefix,
            "key_hash": key_hash,
            "usage_count": 0,
            "last_used_at": None,
            "is_active": True,
        })

        await self.audit.log_action(
            organization_id=organization_id,
            actor_id=user.id,
            action="api_key.regenerated",
            resource_type="api_key",
            resource_id=str(key.id),
            details={"name": key.name, "new_prefix": prefix},
        )
        await self.db.commit()

        return ApiKeyGenerateResponse(
            key=raw_token,
            api_key=ApiKeyResponse.model_validate(key),
        )

    # ──────────────────────────────────────────────
    # Update (name / scopes / expiry / active / rate-limit)
    # ──────────────────────────────────────────────

    async def update_key(
        self,
        organization_id: uuid.UUID,
        key_id: uuid.UUID,
        user: User,
        data: ApiKeyUpdateRequest,
    ) -> ApiKeyResponse:
        """Partial update of key metadata."""
        self._assert_can_manage(user)

        key = await self.repo.get_by_id(key_id)
        if not key or key.organization_id != organization_id:
            raise NotFoundException("API key not found.")

        # Validate updated scopes
        if data.scopes is not None:
            invalid = set(data.scopes) - set(AVAILABLE_SCOPES)
            if invalid:
                raise BadRequestException(f"Invalid scope(s): {', '.join(sorted(invalid))}")

        update_dict = data.model_dump(exclude_unset=True)
        if update_dict:
            await self.repo.update(key, update_dict)
            await self.audit.log_action(
                organization_id=organization_id,
                actor_id=user.id,
                action="api_key.updated",
                resource_type="api_key",
                resource_id=str(key.id),
                details=update_dict,
            )
            await self.db.commit()

        return ApiKeyResponse.model_validate(key)

    # ──────────────────────────────────────────────
    # Delete (hard)
    # ──────────────────────────────────────────────

    async def delete_key(
        self,
        organization_id: uuid.UUID,
        key_id: uuid.UUID,
        user: User,
    ) -> None:
        """Permanently remove an API key."""
        self._assert_can_manage(user)

        key = await self.repo.get_by_id(key_id)
        if not key or key.organization_id != organization_id:
            raise NotFoundException("API key not found.")

        name = key.name
        await self.repo.delete(key_id)

        await self.audit.log_action(
            organization_id=organization_id,
            actor_id=user.id,
            action="api_key.deleted",
            resource_type="api_key",
            resource_id=str(key_id),
            details={"name": name},
        )
        await self.db.commit()

    # ──────────────────────────────────────────────
    # List
    # ──────────────────────────────────────────────

    async def list_keys(
        self,
        organization_id: uuid.UUID,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        scope: Optional[str] = None,
        expires_before: Optional[datetime] = None,
        expires_after: Optional[datetime] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        limit: int = 20,
    ) -> ApiKeyListResponse:
        """Return paginated, filtered, sorted API key list."""
        items, total = await self.repo.list_keys(
            organization_id=organization_id,
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
        total_pages = math.ceil(total / limit) if total > 0 else 1
        return ApiKeyListResponse(
            items=[ApiKeyResponse.model_validate(k) for k in items],
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    # ──────────────────────────────────────────────
    # Get single
    # ──────────────────────────────────────────────

    async def get_key(
        self,
        organization_id: uuid.UUID,
        key_id: uuid.UUID,
    ) -> ApiKeyResponse:
        """Fetch a single key detail."""
        key = await self.repo.get_by_id(key_id)
        if not key or key.organization_id != organization_id:
            raise NotFoundException("API key not found.")
        return ApiKeyResponse.model_validate(key)

    # ──────────────────────────────────────────────
    # Validate (used by middleware / external callers)
    # ──────────────────────────────────────────────

    async def validate_key(self, raw_token: str) -> ApiKeyValidateResponse:
        """Hash the token, look up key, check active + expiry, increment usage."""
        key_hash = hash_token(raw_token)
        key = await self.repo.get_by_key_hash(key_hash)

        if not key:
            return ApiKeyValidateResponse(valid=False, message="Invalid API key.")

        if not key.is_active:
            return ApiKeyValidateResponse(valid=False, message="API key is inactive.")

        if key.expires_at:
            # Normalise to timezone-aware for comparison (SQLite returns naive datetimes)
            expires = key.expires_at
            if expires.tzinfo is None:
                expires = expires.replace(tzinfo=timezone.utc)
            if expires < datetime.now(timezone.utc):
                return ApiKeyValidateResponse(valid=False, message="API key has expired.")

        # Record usage (fire-and-forget atomically)
        await self.repo.increment_usage(key.id)
        await self.db.commit()

        return ApiKeyValidateResponse(
            valid=True,
            key_id=key.id,
            scopes=key.scopes,
            message="OK",
        )

    # ──────────────────────────────────────────────
    # Available scopes catalogue
    # ──────────────────────────────────────────────

    def get_available_scopes(self) -> List[str]:
        return AVAILABLE_SCOPES
