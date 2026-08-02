import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response, status

from app.api.deps import get_audit_log_service, get_current_user
from app.models.user import User
from app.schemas.audit_log import AuditLogListResponse, AuditLogResponse
from app.services.audit_log_service import AuditLogService

router = APIRouter(prefix="/audit-logs", tags=["Audit Logging"])


@router.get(
    "",
    response_model=AuditLogListResponse,
    status_code=status.HTTP_200_OK,
    summary="List, search, filter, and paginate audit logs",
    description="Retrieve activity and security audit logs with full-text search, action/resource filters, date range filters, dynamic sorting, and pagination.",
)
async def list_audit_logs(
    search: Optional[str] = Query(None, description="Search by action name, resource type, or IP address"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type: user, project, api_key, role, settings, organization"),
    action: Optional[str] = Query(None, description="Filter by exact action name (e.g. user.login, project.created)"),
    from_date: Optional[datetime] = Query(None, description="Filter events created on or after this UTC timestamp"),
    to_date: Optional[datetime] = Query(None, description="Filter events created on or before this UTC timestamp"),
    sort_by: str = Query("created_at", description="Sort field: created_at, action, resource_type"),
    sort_order: str = Query("desc", description="Sort direction: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    service: AuditLogService = Depends(get_audit_log_service),
) -> AuditLogListResponse:
    return await service.list_logs(
        user=current_user,
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


@router.get(
    "/export",
    status_code=status.HTTP_200_OK,
    summary="Export audit logs as CSV file",
    description="Download organization activity and security audit history formatted as a CSV spreadsheet file.",
)
async def export_audit_logs_csv(
    resource_type: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    service: AuditLogService = Depends(get_audit_log_service),
) -> Response:
    csv_data = await service.export_logs_csv(
        user=current_user, resource_type=resource_type, action=action
    )
    filename = f"audit_logs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get(
    "/{log_id}",
    response_model=AuditLogResponse,
    status_code=status.HTTP_200_OK,
    summary="Get audit log entry detail",
    description="Fetch single activity audit log entry by ID.",
)
async def get_audit_log_detail(
    log_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: AuditLogService = Depends(get_audit_log_service),
) -> AuditLogResponse:
    return await service.get_log_by_id(current_user, log_id)
