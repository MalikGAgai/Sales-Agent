import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.invitation import OrganizationInvitation
from app.repositories.base import BaseRepository


class InvitationRepository(BaseRepository[OrganizationInvitation]):
    """Repository handling OrganizationInvitation persistence operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(OrganizationInvitation, session)

    async def get_by_token_hash(self, token_hash: str) -> Optional[OrganizationInvitation]:
        """Fetch pending unexpired invitation by token hash."""
        stmt = (
            select(OrganizationInvitation)
            .options(
                selectinload(OrganizationInvitation.organization),
                selectinload(OrganizationInvitation.role),
            )
            .where(OrganizationInvitation.token_hash == token_hash)
            .where(OrganizationInvitation.is_accepted.is_(False))
            .where(OrganizationInvitation.expires_at > datetime.now(timezone.utc))
            .where(OrganizationInvitation.deleted_at.is_(None))
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_pending_by_org(self, organization_id: uuid.UUID) -> List[OrganizationInvitation]:
        """Fetch all active pending invitations for an organization."""
        stmt = (
            select(OrganizationInvitation)
            .options(selectinload(OrganizationInvitation.role))
            .where(OrganizationInvitation.organization_id == organization_id)
            .where(OrganizationInvitation.is_accepted.is_(False))
            .where(OrganizationInvitation.expires_at > datetime.now(timezone.utc))
            .where(OrganizationInvitation.deleted_at.is_(None))
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
