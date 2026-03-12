from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field

from openhands.agent_server.utils import utc_now


class SandboxStatus(Enum):
    STARTING = 'STARTING'
    RUNNING = 'RUNNING'
    PAUSED = 'PAUSED'
    ERROR = 'ERROR'
    MISSING = 'MISSING'
    """Missing - possibly deleted"""


class ExposedUrl(BaseModel):
    """URL to access some named service within the container."""

    name: str
    url: str
    port: int


# Standard names
AGENT_SERVER = 'AGENT_SERVER'
VSCODE = 'VSCODE'
WORKER_1 = 'WORKER_1'
WORKER_2 = 'WORKER_2'
# Additional worker ports for common dev server defaults (Vite, Next.js, etc.)
WORKER_3 = 'WORKER_3'
WORKER_4 = 'WORKER_4'
WORKER_5 = 'WORKER_5'
# Extended worker ports for Vite port drift (5175-5180) and Next.js fallback
WORKER_6 = 'WORKER_6'
WORKER_7 = 'WORKER_7'
WORKER_8 = 'WORKER_8'
WORKER_9 = 'WORKER_9'
WORKER_10 = 'WORKER_10'
WORKER_11 = 'WORKER_11'
WORKER_12 = 'WORKER_12'
# Additional common ports (3002-3010, 4000, 4173, 8000, 8080, etc.)
WORKER_13 = 'WORKER_13'
WORKER_14 = 'WORKER_14'
WORKER_15 = 'WORKER_15'
WORKER_16 = 'WORKER_16'
WORKER_17 = 'WORKER_17'
WORKER_18 = 'WORKER_18'
WORKER_19 = 'WORKER_19'
WORKER_20 = 'WORKER_20'


class SandboxInfo(BaseModel):
    """Information about a sandbox."""

    id: str
    created_by_user_id: str | None
    sandbox_spec_id: str
    status: SandboxStatus
    session_api_key: str | None = Field(
        default=None,
        description=(
            'Key to access sandbox, to be added as an `X-Session-API-Key` header '
            'in each request. In cases where the sandbox statues is STARTING or '
            'PAUSED, or the current user does not have full access '
            'the session_api_key will be None.'
        ),
    )
    exposed_urls: list[ExposedUrl] | None = Field(
        default_factory=lambda: [],
        description=(
            'URLs exposed by the sandbox (App server, Vscode, etc...)'
            'Sandboxes with a status STARTING / PAUSED / ERROR may '
            'not return urls.'
        ),
    )
    primary_preview_url: str | None = Field(
        default=None,
        description=(
            'Best-effort primary preview URL selected from healthy worker ports. '
            'Frontends should prefer this URL over heuristic port detection when present.'
        ),
    )
    working_dir: str | None = Field(
        default=None,
        description=(
            'Working directory for agent operations and tool execution. '
            'This is the per-sandbox directory where files should be created. '
            'For ProcessSandbox, this is /tmp/openhands-sandboxes/{sandbox_id}/'
        ),
    )
    created_at: datetime = Field(default_factory=utc_now)


class SandboxPage(BaseModel):
    items: list[SandboxInfo]
    next_page_id: str | None = None
