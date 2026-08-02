import uuid
import math
import re
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException, PermissionDeniedException
from app.models.user import User
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.project_repository import ProjectRepository
from app.schemas.project import (
    AuditLogResponse,
    ProjectCreateRequest,
    ProjectDetailResponse,
    ProjectListResponse,
    ProjectResponse,
    ProjectUpdateRequest,
)


class ProjectService:
    """Service encapsulating Client Website Project workflows and audit logging."""

    def __init__(
        self,
        project_repo: ProjectRepository,
        audit_repo: AuditLogRepository,
        db_session: AsyncSession,
    ) -> None:
        self.project_repo = project_repo
        self.audit_repo = audit_repo
        self.db = db_session

    async def create_project(
        self, organization_id: uuid.UUID, creator: User, data: ProjectCreateRequest
    ) -> ProjectResponse:
        """Create a new client website project and log audit entry."""
        slug = re.sub(r"[^\w-]", "", data.name.lower().replace(" ", "-")) + "-" + str(uuid.uuid4())[:6]

        project = await self.project_repo.create({
            "organization_id": organization_id,
            "creator_id": creator.id,
            "name": data.name,
            "slug": slug,
            "website_url": data.website_url,
            "country": data.country,
            "timezone": data.timezone,
            "industry": data.industry,
            "currency": data.currency,
            "status": data.status,
            "logo_url": data.logo_url,
            "description": data.description,
        })

        # Record Audit Log
        await self.audit_repo.log_action(
            organization_id=organization_id,
            actor_id=creator.id,
            action="project.created",
            resource_type="project",
            resource_id=str(project.id),
            details={"name": project.name, "website_url": project.website_url},
        )

        await self.db.commit()
        return ProjectResponse.model_validate(project)

    async def get_project_detail(
        self, organization_id: uuid.UUID, project_id: uuid.UUID
    ) -> ProjectDetailResponse:
        """Fetch project details along with audit activity logs."""
        project = await self.project_repo.get_by_id(project_id)
        if not project or project.organization_id != organization_id:
            raise NotFoundException("Project not found.")

        audit_logs = await self.audit_repo.get_by_resource("project", str(project_id))

        response = ProjectDetailResponse.model_validate(project)
        response.audit_logs = [AuditLogResponse.model_validate(log) for log in audit_logs]
        return response

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
    ) -> ProjectListResponse:
        """Search, filter, sort, and paginate client website projects."""
        items, total = await self.project_repo.list_projects(
            organization_id=organization_id,
            search=search,
            status=status,
            industry=industry,
            country=country,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            limit=limit,
        )

        total_pages = math.ceil(total / limit) if total > 0 else 1

        return ProjectListResponse(
            items=[ProjectResponse.model_validate(p) for p in items],
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    async def update_project(
        self,
        organization_id: uuid.UUID,
        project_id: uuid.UUID,
        user: User,
        data: ProjectUpdateRequest,
    ) -> ProjectResponse:
        """Update client website project details and log audit entry."""
        project = await self.project_repo.get_by_id(project_id)
        if not project or project.organization_id != organization_id:
            raise NotFoundException("Project not found.")

        update_dict = data.model_dump(exclude_unset=True)
        if update_dict:
            await self.project_repo.update(project, update_dict)

            await self.audit_repo.log_action(
                organization_id=organization_id,
                actor_id=user.id,
                action="project.updated",
                resource_type="project",
                resource_id=str(project.id),
                details=update_dict,
            )
            await self.db.commit()

        return ProjectResponse.model_validate(project)

    async def delete_project(
        self, organization_id: uuid.UUID, project_id: uuid.UUID, user: User
    ) -> None:
        """Soft delete client website project and log audit entry."""
        project = await self.project_repo.get_by_id(project_id)
        if not project or project.organization_id != organization_id:
            raise NotFoundException("Project not found.")

        await self.project_repo.soft_delete(project_id)

        await self.audit_repo.log_action(
            organization_id=organization_id,
            actor_id=user.id,
            action="project.deleted",
            resource_type="project",
            resource_id=str(project_id),
            details={"name": project.name},
        )
        await self.db.commit()
