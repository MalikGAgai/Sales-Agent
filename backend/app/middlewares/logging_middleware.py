import time
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.logging import logger


class LoggingMiddleware(BaseHTTPMiddleware):
    """ASGI Middleware to log inbound HTTP request execution metrics."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        start_time = time.time()
        request_id = getattr(request.state, "request_id", "N/A")

        logger.info(
            f"--> [REQ {request_id}] {request.method} {request.url.path}"
        )

        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000

        logger.info(
            f"<-- [RES {request_id}] Status: {response.status_code} | Duration: {process_time:.2f}ms"
        )

        return response
