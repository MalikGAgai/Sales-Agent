import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.audit_log import AuditLog
from app.repositories.base import BaseRepository


class AuditLogRepository(BaseRepository[AuditLog]):
    """Repository handling AuditLog persistence and query operations."""

    def __init__(self, session: AsyncSession) -> None:
        super().__init__(AuditLog, session)

    async def log_action(
        self,
        organization_id: Optional[uuid.UUID],
        actor_id: Optional[uuid.UUID],
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """Create an immutable audit log entry."""
        audit_entry = await self.create({
            "organization_id": organization_id,
            "actor_id": actor_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": str(resource_id) if resource_id else None,
            "details": details,
            "ip_address": ip_address,
            "user_agent": user_agent,
        })
        return audit_entry

    async def get_by_resource(
        self, resource_type: str, resource_id: str, limit: int = 50
    ) -> List[AuditLog]:
        """Fetch audit timeline for a specific resource."""
        stmt = (
            select(AuditLog)
            .options(selectinload(AuditLog.actor))
            .where(AuditLog.resource_type == resource_type)
            .where(AuditLog.resource_id == str(resource_id))
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_logs(
        self,
        organization_id: Optional[uuid.UUID] = None,
        search: Optional[str] = None,
        resource_type: Optional[str] = None,
        action: Optional[str] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[AuditLog], int]:
        """Filter, search, sort, and paginate organization audit logs."""
        query = select(AuditLog).options(selectinload(AuditLog.actor))

        if organization_id:
            query = query.where(AuditLog.organization_id == organization_id)

        if resource_type:
            query = query.where(AuditLog.resource_type == resource_type)

        if action:
            query = query.where(AuditLog.action == action)

        if from_date:
            query = query.where(AuditLog.created_at >= from_date)

        if to_date:
            query = query.where(AuditLog.created_at <= to_date)

        if search:
            pattern = f"%{search.strip().lower()}%"
            query = query.where(
                func.lower(AuditLog.action).like(pattern)
                | func.lower(AuditLog.resource_type).like(pattern)
                | func.lower(AuditLog.ip_address).like(pattern)
            )

        # Count total
        count_stmt = select(func.count()).select_from(query.subquery())
        count_res = await self.session.execute(count_stmt)
        total = count_res.scalar() or 0

        # Sorting
        sort_col = getattr(AuditLog, sort_by, AuditLog.created_at)
        if sort_order.lower() == "asc":
            query = query.order_by(sort_col.asc())
        else:
            query = query.order_by(sort_col.desc())

        # Pagination
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)

        res = await self.session.execute(query)
        return list(res.scalars().all()), total
