from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_v1_router
from app.config.settings import settings
from app.core.exceptions import AppException
from app.core.logging import logger
from app.database.redis import close_redis
from app.middlewares.logging_middleware import LoggingMiddleware
from app.middlewares.request_id import RequestIDMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifespan events management."""
    logger.info(f"Starting {settings.PROJECT_NAME} backend service...")
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME} backend service...")
    await close_redis()


def create_application() -> FastAPI:
    """FastAPI Application Factory function."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version="0.1.0",
        description="SalesAI Enterprise SaaS Backend API Service",
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
        redoc_url=f"{settings.API_V1_STR}/redoc",
        lifespan=lifespan,
    )

    # Register Middlewares
    app.add_middleware(LoggingMiddleware)
    app.add_middleware(RequestIDMiddleware)

    # Configure CORS
    if settings.BACKEND_CORS_ORIGINS:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    # Register Custom Exception Handler
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "message": exc.detail},
        )

    # Include Root Router
    app.include_router(api_v1_router, prefix=settings.API_V1_STR)

    return app


app = create_application()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
