"""Daytona-based sandbox service implementation.

This service creates sandboxes using Daytona's cloud sandbox API.
"""

import logging
import os
from dataclasses import dataclass
from datetime import datetime
from typing import AsyncGenerator

import base62
import httpx
from fastapi import Request
from pydantic import Field

from openhands.agent_server.utils import utc_now
from openhands.app_server.errors import SandboxError
from openhands.app_server.sandbox.sandbox_models import (
    AGENT_SERVER,
    ExposedUrl,
    SandboxInfo,
    SandboxPage,
    SandboxStatus,
)
from openhands.app_server.sandbox.sandbox_service import (
    SandboxService,
    SandboxServiceInjector,
)
from openhands.app_server.sandbox.sandbox_spec_models import SandboxSpecInfo
from openhands.app_server.sandbox.sandbox_spec_service import SandboxSpecService
from openhands.app_server.services.injector import InjectorState

_logger = logging.getLogger(__name__)

# Store sandbox info in memory
_daytona_sandboxes: dict[str, dict] = {}


@dataclass
class DaytonaSandboxService(SandboxService):
    """Sandbox service that uses Daytona's cloud sandbox API."""

    user_id: str | None
    sandbox_spec_service: SandboxSpecService
    api_key: str
    api_url: str
    target: str
    httpx_client: httpx.AsyncClient

    async def search_sandboxes(
        self,
        page_id: str | None = None,
        limit: int = 100,
    ) -> SandboxPage:
        """Search for sandboxes."""
        sandboxes = []
        for sandbox_id, info in _daytona_sandboxes.items():
            if self.user_id and info.get('user_id') != self.user_id:
                continue
            sandboxes.append(SandboxInfo(
                id=sandbox_id,
                created_by_user_id=info.get('user_id'),
                sandbox_spec_id=info.get('sandbox_spec_id', 'default'),
                status=SandboxStatus.RUNNING,
                session_api_key=info.get('session_api_key'),
                exposed_urls=info.get('exposed_urls', []),
                created_at=info.get('created_at', utc_now()),
            ))
        return SandboxPage(items=sandboxes[:limit], next_page_id=None)

    async def get_sandbox(self, sandbox_id: str) -> SandboxInfo | None:
        """Get sandbox by ID."""
        info = _daytona_sandboxes.get(sandbox_id)
        if not info:
            return None
        return SandboxInfo(
            id=sandbox_id,
            created_by_user_id=info.get('user_id'),
            sandbox_spec_id=info.get('sandbox_spec_id', 'default'),
            status=SandboxStatus.RUNNING,
            session_api_key=info.get('session_api_key'),
            exposed_urls=info.get('exposed_urls', []),
            created_at=info.get('created_at', utc_now()),
        )

    async def get_sandbox_by_session_api_key(
        self, session_api_key: str
    ) -> SandboxInfo | None:
        """Get a single sandbox by session API key."""
        for sandbox_id, info in _daytona_sandboxes.items():
            if info.get('session_api_key') == session_api_key:
                return SandboxInfo(
                    id=sandbox_id,
                    created_by_user_id=info.get('user_id'),
                    sandbox_spec_id=info.get('sandbox_spec_id', 'default'),
                    status=SandboxStatus.RUNNING,
                    session_api_key=info.get('session_api_key'),
                    exposed_urls=info.get('exposed_urls', []),
                    created_at=info.get('created_at', utc_now()),
                )
        return None

    async def start_sandbox(
        self, sandbox_spec_id: str | None = None, sandbox_id: str | None = None
    ) -> SandboxInfo:
        """Start a new Daytona sandbox."""
        try:
            from daytona import (
                CreateSandboxFromSnapshotParams,
                Daytona,
                DaytonaConfig,
            )
        except ImportError:
            raise SandboxError('Daytona package not installed. Install with: pip install daytona')

        if sandbox_id is None:
            sandbox_id = base62.encodebytes(os.urandom(16))

        _logger.info(f'Creating Daytona sandbox: {sandbox_id}')

        try:
            config = DaytonaConfig(
                api_key=self.api_key,
                server_url=self.api_url,
                target=self.target,
            )
            daytona = Daytona(config)

            # Create sandbox with OpenHands label using proper params
            sandbox_params = CreateSandboxFromSnapshotParams(
                language="python",
                snapshot="nikolaik/python-nodejs:python3.12-nodejs22",
                public=True,
                labels={"OpenHands_SID": sandbox_id},
                auto_stop_interval=60,
            )
            sandbox = daytona.create(sandbox_params)
            
            _logger.info(f'Daytona sandbox created: {sandbox.id}')
            
            # Generate session API key
            session_api_key = base62.encodebytes(os.urandom(32))

            # Store sandbox info
            _daytona_sandboxes[sandbox_id] = {
                'daytona_id': sandbox.id,
                'user_id': self.user_id,
                'sandbox_spec_id': sandbox_spec_id or 'default',
                'session_api_key': session_api_key,
                'created_at': utc_now(),
                'exposed_urls': [],
            }

            return SandboxInfo(
                id=sandbox_id,
                created_by_user_id=self.user_id,
                sandbox_spec_id=sandbox_spec_id or 'default',
                status=SandboxStatus.RUNNING,
                session_api_key=session_api_key,
                exposed_urls=[],
                created_at=utc_now(),
            )
        except Exception as e:
            _logger.exception(f'Failed to create Daytona sandbox: {e}')
            raise SandboxError(f'Failed to create Daytona sandbox: {e}')

    async def resume_sandbox(self, sandbox_id: str) -> bool:
        return sandbox_id in _daytona_sandboxes

    async def pause_sandbox(self, sandbox_id: str) -> bool:
        return sandbox_id in _daytona_sandboxes

    async def delete_sandbox(self, sandbox_id: str) -> bool:
        if sandbox_id in _daytona_sandboxes:
            del _daytona_sandboxes[sandbox_id]
            return True
        return False


class DaytonaSandboxServiceInjector(SandboxServiceInjector):
    """Injector for DaytonaSandboxService."""

    api_key: str = Field(
        default_factory=lambda: os.getenv('DAYTONA_API_KEY', ''),
        description='Daytona API key'
    )
    api_url: str = Field(
        default='https://app.daytona.io/api',
        description='Daytona API URL'
    )
    target: str = Field(
        default='eu',
        description='Daytona target region'
    )

    async def inject(
        self, state: InjectorState, request: Request | None = None
    ) -> AsyncGenerator[DaytonaSandboxService, None]:
        from openhands.app_server.config import (
            get_sandbox_spec_service,
            get_user_context,
        )

        async with (
            get_sandbox_spec_service(state, request) as sandbox_spec_service,
            get_user_context(state, request) as user_context,
        ):
            user_id = await user_context.get_user_id()
            async with httpx.AsyncClient() as client:
                yield DaytonaSandboxService(
                    user_id=user_id,
                    sandbox_spec_service=sandbox_spec_service,
                    api_key=self.api_key,
                    api_url=self.api_url,
                    target=self.target,
                    httpx_client=client,
                )

