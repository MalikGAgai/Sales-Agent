import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.session import Session
from app.repositories.base import BaseRepository


class SessionRepository(BaseRepository[Session]):
    """Repository handling Session persistence & revocation operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Session, session)

    async def get_by_token_hash(self, token_hash: str) -> Optional[Session]:
        """Fetch active session by token hash."""
        stmt = (
            select(Session)
            .where(Session.token_hash == token_hash)
            .where(Session.is_revoked.is_(False))
            .where(Session.expires_at > datetime.now(timezone.utc))
            .where(Session.deleted_at.is_(None))
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def revoke_session(self, token_hash: str) -> bool:
        """Revoke session by token hash."""
        db_session = await self.get_by_token_hash(token_hash)
        if db_session:
            db_session.is_revoked = True
            self.session.add(db_session)
            await self.session.flush()
            return True
        return False

    async def revoke_all_user_sessions(self, user_id: uuid.UUID) -> int:
        """Revoke all active sessions for a user."""
        stmt = (
            update(Session)
            .where(Session.user_id == user_id)
            .where(Session.is_revoked.is_(False))
            .values(is_revoked=True)
        )
        result = await self.session.execute(stmt)
        await self.session.flush()
        return result.rowcount
