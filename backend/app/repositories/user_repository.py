import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository handling User persistence operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(User, session)

    async def get_by_email(self, email: str, include_deleted: bool = False) -> Optional[User]:
        """Fetch user by unique email address with eager loaded roles."""
        stmt = (
            select(User)
            .options(selectinload(User.roles))
            .where(User.email == email.lower())
        )
        if not include_deleted:
            stmt = stmt.where(User.deleted_at.is_(None))
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_by_id_with_roles(self, user_id: uuid.UUID, include_deleted: bool = False) -> Optional[User]:
        """Fetch user by ID with loaded roles."""
        stmt = (
            select(User)
            .options(selectinload(User.roles))
            .where(User.id == user_id)
        )
        if not include_deleted:
            stmt = stmt.where(User.deleted_at.is_(None))
        result = await self.session.execute(stmt)
        return result.scalars().first()
