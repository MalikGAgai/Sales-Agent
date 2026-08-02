import uuid
from typing import List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.repositories.base import BaseRepository


class ProjectRepository(BaseRepository[Project]):
    """Repository handling Project persistence, search, filtering, and pagination."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Project, session)

    async def list_projects(
        self,
        organization_id: uuid.UUID,
        search: Optional[str] = None,
        status: Optional[str] = None,
        industry: Optional[str] = None,
        country: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        limit: int = 10,
    ) -> Tuple[List[Project], int]:
        """Search, filter, sort, and paginate organization client website projects."""
        query = (
            select(Project)
            .where(Project.organization_id == organization_id)
            .where(Project.deleted_at.is_(None))
        )

        # Filters
        if search:
            search_pattern = f"%{search.strip().lower()}%"
            query = query.where(
                (func.lower(Project.name).like(search_pattern))
                | (func.lower(Project.website_url).like(search_pattern))
                | (func.lower(Project.description).like(search_pattern))
            )

        if status and status.lower() != "all":
            query = query.where(func.lower(Project.status) == status.lower())

        if industry and industry.lower() != "all":
            query = query.where(func.lower(Project.industry) == industry.lower())

        if country and country.lower() != "all":
            query = query.where(func.lower(Project.country) == country.lower())

        # Total Count
        count_stmt = select(func.count()).select_from(query.subquery())
        count_res = await self.session.execute(count_stmt)
        total = count_res.scalar() or 0

        # Sorting
        sort_column = getattr(Project, sort_by, Project.created_at)
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

    async def get_by_slug(self, organization_id: uuid.UUID, slug: str) -> Optional[Project]:
        """Fetch project by slug within organization."""
        stmt = (
            select(Project)
            .where(Project.organization_id == organization_id)
            .where(Project.slug == slug.lower())
            .where(Project.deleted_at.is_(None))
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()
