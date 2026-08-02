import uuid
from typing import AsyncGenerator, Callable, List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthenticationException, PermissionDeniedException
from app.core.security import decode_token
from app.database.session import get_db_session
from app.models.user import User
from app.repositories.organization_repository import OrganizationRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency providing AsyncSession from pool."""
    async for session in get_db_session():
        yield session


def get_user_repository(session: AsyncSession = Depends(get_db)) -> UserRepository:
    """Dependency injection for UserRepository."""
    return UserRepository(session)


def get_org_repository(session: AsyncSession = Depends(get_db)) -> OrganizationRepository:
    """Dependency injection for OrganizationRepository."""
    return OrganizationRepository(session)


def get_session_repository(session: AsyncSession = Depends(get_db)) -> SessionRepository:
    """Dependency injection for SessionRepository."""
    return SessionRepository(session)


from app.repositories.invitation_repository import InvitationRepository
from app.repositories.role_repository import RoleRepository
from app.services.organization_service import OrganizationService


def get_invitation_repository(session: AsyncSession = Depends(get_db)) -> InvitationRepository:
    """Dependency injection for InvitationRepository."""
    return InvitationRepository(session)


def get_role_repository(session: AsyncSession = Depends(get_db)) -> RoleRepository:
    """Dependency injection for RoleRepository."""
    return RoleRepository(session)


def get_auth_service(
    user_repo: UserRepository = Depends(get_user_repository),
    org_repo: OrganizationRepository = Depends(get_org_repository),
    session_repo: SessionRepository = Depends(get_session_repository),
    db: AsyncSession = Depends(get_db),
) -> AuthService:
    """Dependency injection for AuthService."""
    return AuthService(user_repo=user_repo, org_repo=org_repo, session_repo=session_repo, db_session=db)


def get_org_service(
    org_repo: OrganizationRepository = Depends(get_org_repository),
    user_repo: UserRepository = Depends(get_user_repository),
    invitation_repo: InvitationRepository = Depends(get_invitation_repository),
    role_repo: RoleRepository = Depends(get_role_repository),
    db: AsyncSession = Depends(get_db),
) -> OrganizationService:
    """Dependency injection for OrganizationService."""
    return OrganizationService(
        org_repo=org_repo,
        user_repo=user_repo,
        invitation_repo=invitation_repo,
        role_repo=role_repo,
        db_session=db,
    )


from app.repositories.project_repository import ProjectRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.services.project_service import ProjectService


def get_project_repository(session: AsyncSession = Depends(get_db)) -> ProjectRepository:
    """Dependency injection for ProjectRepository."""
    return ProjectRepository(session)


def get_audit_log_repository(session: AsyncSession = Depends(get_db)) -> AuditLogRepository:
    """Dependency injection for AuditLogRepository."""
    return AuditLogRepository(session)


from app.services.audit_log_service import AuditLogService


def get_audit_log_service(
    audit_repo: AuditLogRepository = Depends(get_audit_log_repository),
    db: AsyncSession = Depends(get_db),
) -> AuditLogService:
    """Dependency injection for AuditLogService."""
    return AuditLogService(audit_repo=audit_repo, db_session=db)


def get_project_service(
    project_repo: ProjectRepository = Depends(get_project_repository),
    audit_repo: AuditLogRepository = Depends(get_audit_log_repository),
    db: AsyncSession = Depends(get_db),
) -> ProjectService:
    """Dependency injection for ProjectService."""
    return ProjectService(project_repo=project_repo, audit_repo=audit_repo, db_session=db)


from app.repositories.api_key_repository import ApiKeyRepository
from app.services.api_key_service import ApiKeyService


def get_api_key_repository(session: AsyncSession = Depends(get_db)) -> ApiKeyRepository:
    """Dependency injection for ApiKeyRepository."""
    return ApiKeyRepository(session)


def get_api_key_service(
    api_key_repo: ApiKeyRepository = Depends(get_api_key_repository),
    audit_repo: AuditLogRepository = Depends(get_audit_log_repository),
    db: AsyncSession = Depends(get_db),
) -> ApiKeyService:
    """Dependency injection for ApiKeyService."""
    return ApiKeyService(api_key_repo=api_key_repo, audit_repo=audit_repo, db_session=db)


from app.repositories.setting_repository import SettingRepository
from app.services.settings_service import SettingsService


def get_setting_repository(session: AsyncSession = Depends(get_db)) -> SettingRepository:
    """Dependency injection for SettingRepository."""
    return SettingRepository(session)


def get_settings_service(
    setting_repo: SettingRepository = Depends(get_setting_repository),
    user_repo: UserRepository = Depends(get_user_repository),
    audit_repo: AuditLogRepository = Depends(get_audit_log_repository),
    db: AsyncSession = Depends(get_db),
) -> SettingsService:
    """Dependency injection for SettingsService."""
    return SettingsService(
        setting_repo=setting_repo,
        user_repo=user_repo,
        audit_repo=audit_repo,
        db_session=db,
    )


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    user_repo: UserRepository = Depends(get_user_repository),
) -> User:
    """Validate Bearer JWT access token and return current authenticated User."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise AuthenticationException("Invalid token type. Access token required.")
        user_id_str: str = payload.get("sub")
        if not user_id_str:
            raise AuthenticationException("Could not validate credentials.")
        user_id = uuid.UUID(user_id_str)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await user_repo.get_by_id_with_roles(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token no longer exists.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is inactive.",
        )
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency ensuring user is active."""
    return current_user


async def get_current_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency requiring superuser privileges."""
    if not current_user.is_superuser:
        raise PermissionDeniedException("Superuser privileges required for this action.")
    return current_user


def require_roles(required_roles: List[str]) -> Callable:
    """Dependency factory checking user roles against required roles list."""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.is_superuser:
            return current_user
        user_role_codes = {role.code for role in current_user.roles}
        if not any(role in user_role_codes for role in required_roles):
            raise PermissionDeniedException(
                f"User does not possess required role(s): {', '.join(required_roles)}"
            )
        return current_user
    return role_checker


def require_permissions(required_permissions: List[str]) -> Callable:
    """Dependency factory checking user permissions."""
    async def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.is_superuser:
            return current_user
        user_permissions = set()
        for role in current_user.roles:
            for perm in getattr(role, "permissions", []):
                user_permissions.add(perm.code)
        if not any(perm in user_permissions for perm in required_permissions):
            raise PermissionDeniedException(
                f"User does not possess required permission(s): {', '.join(required_permissions)}"
            )
        return current_user
    return permission_checker
