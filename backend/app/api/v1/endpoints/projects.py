import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_user, get_project_service
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.schemas.project import (
    ProjectCreateRequest,
    ProjectDetailResponse,
    ProjectListResponse,
    ProjectResponse,
    ProjectUpdateRequest,
)
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["Projects Management (Client Websites)"])


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create client website project",
    description="Provision a new client website project within the current user's organization workspace.",
)
async def create_project(
    data: ProjectCreateRequest,
    current_user: User = Depends(get_current_user),
    project_service: ProjectService = Depends(get_project_service),
) -> ProjectResponse:
    return await project_service.create_project(current_user.organization_id, current_user, data)


@router.get(
    "",
    response_model=ProjectListResponse,
    status_code=status.HTTP_200_OK,
    summary="List, search, filter, and paginate projects",
    description="Retrieve client website projects with full text search, multi-attribute filtering (status, industry, country), dynamic sorting, and pagination.",
)
async def list_projects(
    search: Optional[str] = Query(None, description="Search term for name, website URL, or description"),
    status: Optional[str] = Query(None, description="Filter by status: active, onboarding, maintenance, archived, all"),
    industry: Optional[str] = Query(None, description="Filter by industry: SaaS, E-commerce, Healthcare, Finance, etc."),
    country: Optional[str] = Query(None, description="Filter by client operating country"),
    sort_by: str = Query("created_at", description="Sort field: created_at, name, status, industry, country"),
    sort_order: str = Query("desc", description="Sort direction: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    project_service: ProjectService = Depends(get_project_service),
) -> ProjectListResponse:
    return await project_service.list_projects(
        organization_id=current_user.organization_id,
        search=search,
        status=status,
        industry=industry,
        country=country,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit,
    )


@router.get(
    "/{project_id}",
    response_model=ProjectDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get project details and audit timeline",
    description="Retrieve project details along with immutable activity audit logs.",
)
async def get_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    project_service: ProjectService = Depends(get_project_service),
) -> ProjectDetailResponse:
    return await project_service.get_project_detail(current_user.organization_id, project_id)


@router.patch(
    "/{project_id}",
    response_model=ProjectResponse,
    status_code=status.HTTP_200_OK,
    summary="Update project details",
    description="Update client website attributes (URL, country, timezone, industry, status, logo).",
)
async def update_project(
    project_id: uuid.UUID,
    data: ProjectUpdateRequest,
    current_user: User = Depends(get_current_user),
    project_service: ProjectService = Depends(get_project_service),
) -> ProjectResponse:
    return await project_service.update_project(
        current_user.organization_id, project_id, current_user, data
    )


@router.delete(
    "/{project_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Soft delete project",
    description="Soft delete a client website project and log audit entry.",
)
async def delete_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    project_service: ProjectService = Depends(get_project_service),
) -> MessageResponse:
    await project_service.delete_project(current_user.organization_id, project_id, current_user)
    return MessageResponse(message="Project deleted successfully.")
