"""Daytona-specific sandbox spec service.

Provides sandbox specifications optimized for Daytona cloud sandboxes.
"""

from typing import AsyncGenerator

from fastapi import Request
from pydantic import Field

from openhands.app_server.sandbox.preset_sandbox_spec_service import (
    PresetSandboxSpecService,
)
from openhands.app_server.sandbox.sandbox_spec_models import (
    SandboxSpecInfo,
)
from openhands.app_server.sandbox.sandbox_spec_service import (
    SandboxSpecService,
    SandboxSpecServiceInjector,
    get_agent_server_env,
    get_agent_server_image,
)
from openhands.app_server.services.injector import InjectorState


def get_default_daytona_sandbox_specs():
    """Return default sandbox specs for Daytona cloud sandboxes.

    Daytona sandboxes run in cloud VMs with full isolation.
    The agent server runs inside the Daytona sandbox environment.
    """
    return [
        SandboxSpecInfo(
            id=get_agent_server_image(),
            # Daytona uses its own command execution, we just need the module
            command=['python', '-m', 'openhands.agent_server', '--port', '4444'],
            initial_env={
                'PYTHONUNBUFFERED': '1',
                'OH_ENABLE_VS_CODE': '1',
                'OH_VSCODE_PORT': '4445',
                'OH_CONVERSATIONS_PATH': '/workspace/conversations',
                'OH_BASH_EVENTS_DIR': '/workspace/bash_events',
                **get_agent_server_env(),
            },
            working_dir='/workspace/project',
        )
    ]


class DaytonaSandboxSpecServiceInjector(SandboxSpecServiceInjector):
    """Injector for Daytona-specific sandbox specs."""

    specs: list[SandboxSpecInfo] = Field(
        default_factory=get_default_daytona_sandbox_specs,
        description='Preset list of Daytona sandbox specs',
    )

    async def inject(
        self, state: InjectorState, request: Request | None = None
    ) -> AsyncGenerator[SandboxSpecService, None]:
        yield PresetSandboxSpecService(specs=self.specs)
