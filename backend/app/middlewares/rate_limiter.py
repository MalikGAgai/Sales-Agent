import time
from typing import Dict
from fastapi import HTTPException, Request, status

from app.config.settings import settings


class RateLimiter:
    """In-memory sliding window rate limiter per client IP."""

    def __init__(self, requests_per_minute: int = 60) -> None:
        self.requests_per_minute = requests_per_minute
        self.history: Dict[str, list] = {}

    async def __call__(self, request: Request) -> None:
        # Skip rate limiting during automated tests
        if settings.TESTING:
            return

        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        window_start = now - 60.0

        timestamps = self.history.get(client_ip, [])
        # Keep timestamps within sliding 60 second window
        valid_timestamps = [t for t in timestamps if t > window_start]

        if len(valid_timestamps) >= self.requests_per_minute:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum {self.requests_per_minute} requests per minute.",
                headers={"Retry-After": "60"},
            )

        valid_timestamps.append(now)
        self.history[client_ip] = valid_timestamps


rate_limiter_strict = RateLimiter(requests_per_minute=10)
rate_limiter_standard = RateLimiter(requests_per_minute=60)

