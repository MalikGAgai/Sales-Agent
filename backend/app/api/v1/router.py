from fastapi import APIRouter
from app.api.v1 import health
from app.api.v1.endpoints import auth, organizations, projects, api_keys, settings, audit_logs

api_v1_router = APIRouter()

# Include versioned feature routers
api_v1_router.include_router(health.router)
api_v1_router.include_router(auth.router)
api_v1_router.include_router(organizations.router)
api_v1_router.include_router(projects.router)
api_v1_router.include_router(api_keys.router)
api_v1_router.include_router(settings.router)
api_v1_router.include_router(audit_logs.router)
