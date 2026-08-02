import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.role import Permission, Role
from app.repositories.base import BaseRepository


class RoleRepository(BaseRepository[Role]):
    """Repository handling Role & Permission lookup operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Role, session)

    async def get_by_code(
        self, code: str, organization_id: Optional[uuid.UUID] = None
    ) -> Optional[Role]:
        """Fetch role by code (e.g. 'owner', 'admin', 'manager', 'developer', 'viewer')."""
        stmt = (
            select(Role)
            .options(selectinload(Role.permissions))
            .where(Role.code == code.lower())
            .where(Role.deleted_at.is_(None))
        )
        if organization_id:
            stmt = stmt.where((Role.organization_id == organization_id) | (Role.organization_id.is_(None)))
        else:
            stmt = stmt.where(Role.organization_id.is_(None))

        result = await self.session.execute(stmt)
        role = result.scalars().first()

        # If system role wasn't found in DB, auto-seed default role dynamically
        if not role and code.lower() in {"owner", "admin", "manager", "developer", "viewer"}:
            role = await self.create({
                "name": code.capitalize(),
                "code": code.lower(),
                "description": f"Default system {code.capitalize()} role",
                "is_system": True,
                "organization_id": None,
            })

        return role

    async def list_available_roles(self, organization_id: uuid.UUID) -> List[Role]:
        """List all system and organization roles."""
        stmt = (
            select(Role)
            .options(selectinload(Role.permissions))
            .where((Role.organization_id == organization_id) | (Role.organization_id.is_(None)))
            .where(Role.deleted_at.is_(None))
        )
        result = await self.session.execute(stmt)
        roles = list(result.scalars().all())

        # Ensure all 5 core roles exist
        existing_codes = {r.code for r in roles}
        for default_code in ["owner", "admin", "manager", "developer", "viewer"]:
            if default_code not in existing_codes:
                new_role = await self.create({
                    "name": default_code.capitalize(),
                    "code": default_code,
                    "description": f"Default {default_code.capitalize()} role",
                    "is_system": True,
                    "organization_id": None,
                })
                roles.append(new_role)

        return roles
