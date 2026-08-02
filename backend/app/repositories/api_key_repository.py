import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy import String, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.api_key import ApiKey
from app.repositories.base import BaseRepository


class ApiKeyRepository(BaseRepository[ApiKey]):
    """Repository handling ApiKey persistence, listing, and usage tracking."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(ApiKey, session)

    async def get_by_key_hash(self, key_hash: str) -> Optional[ApiKey]:
        """Look up an active API key by its SHA-256 hash."""
        stmt = (
            select(ApiKey)
            .where(ApiKey.key_hash == key_hash)
            .where(ApiKey.deleted_at.is_(None))
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

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
    ) -> Tuple[List[ApiKey], int]:
        """Search, filter, sort, and paginate organization API keys."""
        query = (
            select(ApiKey)
            .where(ApiKey.organization_id == organization_id)
            .where(ApiKey.deleted_at.is_(None))
        )

        # Search
        if search:
            pattern = f"%{search.strip().lower()}%"
            query = query.where(func.lower(ApiKey.name).like(pattern))

        # Active filter
        if is_active is not None:
            query = query.where(ApiKey.is_active == is_active)

        # Scope filter
        if scope:
            query = query.where(func.cast(ApiKey.scopes, String).contains(scope))

        # Expiration range filters
        if expires_before:
            query = query.where(ApiKey.expires_at <= expires_before)
        if expires_after:
            query = query.where(ApiKey.expires_at >= expires_after)

        # Total count (before pagination)
        count_stmt = select(func.count()).select_from(query.subquery())
        count_res = await self.session.execute(count_stmt)
        total = count_res.scalar() or 0

        # Sorting
        sort_column = getattr(ApiKey, sort_by, ApiKey.created_at)
        if sort_order.lower() == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())

        # Pagination
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)

        result = await self.session.execute(query)
        items = list(result.scalars().all())

        return items, total

    async def increment_usage(self, key_id: uuid.UUID) -> None:
        """Atomically increment usage_count and update last_used_at."""
        stmt = (
            update(ApiKey)
            .where(ApiKey.id == key_id)
            .values(
                usage_count=ApiKey.usage_count + 1,
                last_used_at=datetime.now(timezone.utc),
            )
        )
        await self.session.execute(stmt)
        await self.session.flush()
