import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization
from app.repositories.base import BaseRepository


class OrganizationRepository(BaseRepository[Organization]):
    """Repository handling Organization persistence operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Organization, session)

    async def get_by_slug(self, slug: str) -> Optional[Organization]:
        """Fetch organization by unique slug."""
        stmt = (
            select(Organization)
            .where(Organization.slug == slug.lower())
            .where(Organization.deleted_at.is_(None))
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()
