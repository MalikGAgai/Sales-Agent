import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.setting import Setting
from app.models.session import Session
from app.repositories.base import BaseRepository


class SettingRepository(BaseRepository[Setting]):
    """Repository handling Setting entity and active user authentication Session queries."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Setting, session)

    async def get_by_key(self, organization_id: Optional[uuid.UUID], key: str) -> Optional[Setting]:
        """Fetch a setting by organization_id and key."""
        stmt = (
            select(Setting)
            .where(Setting.organization_id == organization_id)
            .where(Setting.key == key)
            .where(Setting.deleted_at.is_(None))
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def set_key(
        self,
        organization_id: Optional[uuid.UUID],
        key: str,
        value: Any,
        description: Optional[str] = None,
        is_public: bool = False,
    ) -> Setting:
        """Upsert a setting entry."""
        existing = await self.get_by_key(organization_id, key)
        if existing:
            existing.value = value
            if description:
                existing.description = description
            existing.is_public = is_public
            await self.session.flush()
            return existing
        else:
            return await self.create({
                "organization_id": organization_id,
                "key": key,
                "value": value,
                "description": description,
                "is_public": is_public,
            })

    async def get_all_org_settings(self, organization_id: uuid.UUID) -> Dict[str, Any]:
        """Fetch all setting key-value pairs for an organization."""
        stmt = (
            select(Setting)
            .where(Setting.organization_id == organization_id)
            .where(Setting.deleted_at.is_(None))
        )
        result = await self.session.execute(stmt)
        settings_list = result.scalars().all()
        return {s.key: s.value for s in settings_list}

    # ── Sessions management ───────────────────────────────────────────────────

    async def list_user_sessions(self, user_id: uuid.UUID) -> List[Session]:
        """List active unrevoked sessions for a user."""
        stmt = (
            select(Session)
            .where(Session.user_id == user_id)
            .where(Session.is_revoked == False)
            .where(Session.expires_at > datetime.now(timezone.utc))
            .order_by(Session.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def revoke_session_by_id(self, session_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Revoke a specific active session."""
        stmt = (
            update(Session)
            .where(Session.id == session_id)
            .where(Session.user_id == user_id)
            .values(is_revoked=True)
        )
        res = await self.session.execute(stmt)
        await self.session.flush()
        return res.rowcount > 0

    async def revoke_other_sessions(self, user_id: uuid.UUID, current_token_hash: Optional[str] = None) -> int:
        """Revoke all active sessions for a user except the current token hash."""
        stmt = (
            update(Session)
            .where(Session.user_id == user_id)
            .where(Session.is_revoked == False)
        )
        if current_token_hash:
            stmt = stmt.where(Session.token_hash != current_token_hash)
        stmt = stmt.values(is_revoked=True)
        res = await self.session.execute(stmt)
        await self.session.flush()
        return res.rowcount or 0
