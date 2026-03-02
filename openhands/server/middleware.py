# IMPORTANT: LEGACY V0 CODE - Deprecated since version 1.0.0, scheduled for removal April 1, 2026
# This file is part of the legacy (V0) implementation of OpenHands and will be removed soon as we complete the migration to V1.
# OpenHands V1 uses the Software Agent SDK for the agentic core and runs a new application server. Please refer to:
#   - V1 agentic core (SDK): https://github.com/OpenHands/software-agent-sdk
#   - V1 application server (in this repo): openhands/app_server/
# Unless you are working on deprecation, please avoid extending this legacy file and consult the V1 codepaths above.
# Tag: Legacy-V0
# This module belongs to the old V0 web server. The V1 application server lives under openhands/app_server/.
import asyncio
import os
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Callable
from urllib.parse import urlparse

from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request as StarletteRequest
from starlette.responses import Response
from starlette.types import ASGIApp


class LocalhostCORSMiddleware(CORSMiddleware):
    """Custom CORS middleware that allows any request from localhost/127.0.0.1 domains,
    while using standard CORS rules for other origins.

    This middleware explicitly handles OPTIONS preflight requests to ensure CORS works
    correctly even when wrapped by socketio or other ASGI middleware.
    """

    def __init__(self, app: ASGIApp) -> None:
        allow_origins_str = os.getenv('PERMITTED_CORS_ORIGINS')
        if allow_origins_str:
            allow_origins = tuple(
                origin.strip() for origin in allow_origins_str.split(',')
            )
        else:
            allow_origins = ()
        self._allowed_origins_set = set(allow_origins)
        super().__init__(
            app,
            allow_origins=allow_origins,
            allow_credentials=True,
            allow_methods=['*'],
            allow_headers=['*'],
        )

    def is_allowed_origin(self, origin: str) -> bool:
        if not origin:
            return False

        parsed = urlparse(origin)
        hostname = parsed.hostname or ''

        # Allow any localhost/127.0.0.1 origin regardless of port
        if hostname in ['localhost', '127.0.0.1']:
            return True

        # Check if origin is in the allowed origins list
        if origin in self._allowed_origins_set:
            return True

        # Fall back to parent class's logic (for regex patterns, etc.)
        result: bool = super().is_allowed_origin(origin)
        return result

    async def __call__(self, scope: dict, receive: Callable, send: Callable) -> None:
        if scope['type'] != 'http':
            await self.app(scope, receive, send)
            return

        method = scope.get('method', '')
        headers = dict(scope.get('headers', []))
        origin = headers.get(b'origin', b'').decode('utf-8')

        # Handle preflight OPTIONS requests explicitly
        if method == 'OPTIONS' and origin and self.is_allowed_origin(origin):
            # Check for Access-Control-Request-Method header (indicates preflight)
            if b'access-control-request-method' in headers:
                response_headers = [
                    (b'access-control-allow-origin', origin.encode()),
                    (b'access-control-allow-methods', b'GET, POST, PUT, DELETE, OPTIONS, PATCH'),
                    (b'access-control-allow-headers', b'*'),
                    (b'access-control-allow-credentials', b'true'),
                    (b'access-control-max-age', b'600'),
                    (b'content-length', b'0'),
                ]
                await send({
                    'type': 'http.response.start',
                    'status': 200,
                    'headers': response_headers,
                })
                await send({
                    'type': 'http.response.body',
                    'body': b'',
                })
                return

        # For non-preflight requests, use the parent's logic
        await super().__call__(scope, receive, send)


class CacheControlMiddleware(BaseHTTPMiddleware):
    """Middleware to disable caching for all routes by adding appropriate headers"""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        response = await call_next(request)
        if request.url.path.startswith('/assets'):
            # The content of the assets directory has fingerprinted file names so we cache aggressively
            response.headers['Cache-Control'] = 'public, max-age=2592000, immutable'
        else:
            response.headers['Cache-Control'] = (
                'no-cache, no-store, must-revalidate, max-age=0'
            )
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '0'
        return response


class InMemoryRateLimiter:
    history: dict[str, list[datetime]]
    requests: int
    seconds: int
    sleep_seconds: int

    def __init__(self, requests: int = 2, seconds: int = 1, sleep_seconds: int = 1):
        self.requests = requests
        self.seconds = seconds
        self.sleep_seconds = sleep_seconds
        self.history = defaultdict(list)
        self.sleep_seconds = sleep_seconds

    def _clean_old_requests(self, key: str) -> None:
        now = datetime.now()
        cutoff = now - timedelta(seconds=self.seconds)
        self.history[key] = [ts for ts in self.history[key] if ts > cutoff]

    async def __call__(self, request: Request) -> bool:
        key = request.client.host
        now = datetime.now()

        self._clean_old_requests(key)

        self.history[key].append(now)

        if len(self.history[key]) > self.requests * 2:
            return False
        elif len(self.history[key]) > self.requests:
            if self.sleep_seconds > 0:
                await asyncio.sleep(self.sleep_seconds)
                return True
            else:
                return False

        return True


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, rate_limiter: InMemoryRateLimiter):
        super().__init__(app)
        self.rate_limiter = rate_limiter

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        if not self.is_rate_limited_request(request):
            return await call_next(request)
        ok = await self.rate_limiter(request)
        if not ok:
            return JSONResponse(
                status_code=429,
                content={'message': 'Too many requests'},
                headers={'Retry-After': '1'},
            )
        return await call_next(request)

    def is_rate_limited_request(self, request: StarletteRequest) -> bool:
        if request.url.path.startswith('/assets'):
            return False
        # Put Other non rate limited checks here
        return True
