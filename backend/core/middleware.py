"""Phase 10 ASGI middlewares: request_id + access logging + rate limiting."""
import logging
import time
import uuid
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from .rate_limiter import RateLimiter, RateLimitDecision

logger = logging.getLogger("aurora.access")

_X_REQ_ID = "X-Request-ID"


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Generate or propagate X-Request-ID and time the request.
    Attaches request_id to request.state and to every log record via contextvars.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        rid = request.headers.get(_X_REQ_ID) or str(uuid.uuid4())
        request.state.request_id = rid
        request.state.start_ns = time.perf_counter_ns()
        try:
            response = await call_next(request)
        except Exception:
            duration_ms = (time.perf_counter_ns() - request.state.start_ns) / 1e6
            logger.exception(
                "unhandled_exception",
                extra={
                    "request_id": rid,
                    "route": request.url.path,
                    "method": request.method,
                    "duration_ms": round(duration_ms, 2),
                    "status_code": 500,
                },
            )
            raise
        duration_ms = (time.perf_counter_ns() - request.state.start_ns) / 1e6
        response.headers[_X_REQ_ID] = rid
        # Access log line
        try:
            client_ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (
                request.client.host if request.client else "-"
            )
            user_id = getattr(request.state, "user_id", None)
            level = logging.INFO if response.status_code < 500 else logging.ERROR
            logger.log(
                level,
                f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms:.1f}ms)",
                extra={
                    "request_id": rid,
                    "route": request.url.path,
                    "method": request.method,
                    "status_code": response.status_code,
                    "duration_ms": round(duration_ms, 2),
                    "client_ip": client_ip,
                    "user_id": user_id,
                },
            )
            # Track in metrics (lightweight, in-memory)
            from services import metrics_service
            metrics_service.record_request(
                route=request.url.path,
                method=request.method,
                status_code=response.status_code,
                duration_ms=duration_ms,
            )
        except Exception:  # noqa: BLE001
            pass
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Token-bucket rate limiter applied to /api/* routes.

    Buckets:
      - login: 10 req/min per (email-or-ip)  (auth router uses extra strict 5/15min lockout in service)
      - ai:    20 req/min per user_id        (heavy LLM calls)
      - api:   120 req/min per user_id       (general)
    Excluded routes: /api/health, /api/, OPTIONS preflight.
    """

    EXCLUDED = ("/api/health", "/api/", "/api/telegram/webhook")

    def __init__(self, app, limiter: RateLimiter):
        super().__init__(app)
        self.limiter = limiter

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        if request.method == "OPTIONS" or not path.startswith("/api/") or path in self.EXCLUDED:
            return await call_next(request)

        bucket, key = self._classify(request)
        decision: RateLimitDecision = await self.limiter.check(bucket, key)
        if not decision.allowed:
            from core.exceptions import error_envelope
            resp = JSONResponse(
                status_code=429,
                content=error_envelope(
                    "RATE_LIMIT_EXCEEDED",
                    f"Terlalu banyak request. Coba lagi dalam {decision.retry_after_sec} detik.",
                ),
            )
            self._apply_headers(resp, decision)
            return resp
        response = await call_next(request)
        self._apply_headers(response, decision)
        return response

    def _classify(self, request: Request) -> tuple[str, str]:
        path = request.url.path
        if path.startswith("/api/auth/login"):
            # Use client IP as best-effort key (we don't have email until body parsed)
            ip = (request.headers.get("x-forwarded-for", "").split(",")[0].strip()
                  or (request.client.host if request.client else "unknown"))
            return "login", ip
        if path.startswith("/api/ai/"):
            uid = self._user_key(request)
            return "ai", uid
        return "api", self._user_key(request)

    @staticmethod
    def _user_key(request: Request) -> str:
        auth = request.headers.get("authorization", "")
        if auth.lower().startswith("bearer "):
            # Use last 16 chars of token as opaque user key (avoids parsing full JWT)
            return f"tok:{auth.strip()[-16:]}"
        ip = (request.headers.get("x-forwarded-for", "").split(",")[0].strip()
              or (request.client.host if request.client else "unknown"))
        return f"ip:{ip}"

    @staticmethod
    def _apply_headers(response: Response, decision: RateLimitDecision) -> None:
        response.headers["X-RateLimit-Limit"] = str(decision.limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, decision.remaining))
        response.headers["X-RateLimit-Reset"] = str(decision.reset_unix)
        if not decision.allowed:
            response.headers["Retry-After"] = str(decision.retry_after_sec)
