import csv
import io
import math
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException, PermissionDeniedException
from app.models.user import User
from app.repositories.audit_log_repository import AuditLogRepository
from app.schemas.audit_log import AuditLogListResponse, AuditLogResponse


class AuditLogService:
    """Service handling audit log queries, filtering, pagination, and CSV export."""

    def __init__(
        self,
        audit_repo: AuditLogRepository,
        db_session: AsyncSession,
    ) -> None:
        self.repo = audit_repo
        self.db = db_session

    async def list_logs(
        self,
        user: User,
        search: Optional[str] = None,
        resource_type: Optional[str] = None,
        action: Optional[str] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        limit: int = 20,
    ) -> AuditLogListResponse:
        """List organization audit logs with search, filtering, and pagination."""
        items, total = await self.repo.list_logs(
            organization_id=user.organization_id,
            search=search,
            resource_type=resource_type,
            action=action,
            from_date=from_date,
            to_date=to_date,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            limit=limit,
        )

        total_pages = math.ceil(total / limit) if total > 0 else 1
        return AuditLogListResponse(
            items=[AuditLogResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    async def export_logs_csv(
        self,
        user: User,
        resource_type: Optional[str] = None,
        action: Optional[str] = None,
    ) -> str:
        """Generate a CSV string of audit log events for export."""
        items, _ = await self.repo.list_logs(
            organization_id=user.organization_id,
            resource_type=resource_type,
            action=action,
            limit=1000,
        )

        output = io.StringIO()
        writer = csv.writer(output)

        # Write CSV Header
        writer.writerow([
            "Timestamp",
            "Action",
            "Resource Type",
            "Resource ID",
            "Actor Email",
            "IP Address",
            "User Agent",
            "Details",
        ])

        # Write Rows
        for item in items:
            actor_email = item.actor.email if item.actor else "System"
            details_str = str(item.details) if item.details else ""
            writer.writerow([
                item.created_at.isoformat(),
                item.action,
                item.resource_type,
                item.resource_id or "",
                actor_email,
                item.ip_address or "",
                item.user_agent or "",
                details_str,
            ])

        return output.getvalue()

    async def get_log_by_id(self, user: User, log_id: uuid.UUID) -> AuditLogResponse:
        """Fetch details of a single audit log event."""
        log = await self.repo.get_by_id(log_id)
        if not log or log.organization_id != user.organization_id:
            raise NotFoundException("Audit log entry not found.")
        return AuditLogResponse.model_validate(log)
