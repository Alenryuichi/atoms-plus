"""Runtime proxy router for forwarding requests to agent servers.

This module provides a reverse proxy that forwards HTTP and WebSocket requests
from /runtime/{port}/* to localhost:{port}/*. This is essential for deployments
(like Railway) where only a single port is exposed to the outside world, but
V1 conversations require direct communication with agent servers running on
different ports.

It also provides special handling for file operations (list-files, select-file)
that are not directly supported by the agent server but are needed by the frontend.
"""

from __future__ import annotations

import asyncio
import logging
import os

import httpx
from fastapi import (
    APIRouter,
    HTTPException,
    Query,
    Request,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.responses import JSONResponse, StreamingResponse

_logger = logging.getLogger(__name__)

router = APIRouter(prefix='/runtime', tags=['runtime-proxy'])

# Files to ignore when listing workspace files
FILES_TO_IGNORE = {
    '.git',
    '__pycache__',
    '.pytest_cache',
    '.mypy_cache',
    '.ruff_cache',
    'node_modules',
    '.venv',
    'venv',
    '.DS_Store',
    'Thumbs.db',
}


async def _forward_request(request: Request, port: int, path: str) -> StreamingResponse:
    """Forward an HTTP request to the agent server running on the specified port."""
    target_url = f'http://localhost:{port}/{path}'

    # Copy query string
    if request.url.query:
        target_url += f'?{request.url.query}'

    # Get request body
    body = await request.body()

    # Copy headers, excluding hop-by-hop headers
    headers = {}
    for key, value in request.headers.items():
        key_lower = key.lower()
        if key_lower not in (
            'host',
            'connection',
            'keep-alive',
            'proxy-authenticate',
            'proxy-authorization',
            'te',
            'trailers',
            'transfer-encoding',
            'upgrade',
            'content-length',  # Let httpx calculate this
        ):
            headers[key] = value

    async with httpx.AsyncClient() as client:
        try:
            response = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=body,
                timeout=60.0,
            )

            # Stream the response back
            async def generate():
                async for chunk in response.aiter_bytes():
                    yield chunk

            return StreamingResponse(
                generate(),
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.headers.get('content-type'),
            )
        except httpx.ConnectError:
            _logger.error(f'Cannot connect to agent server on port {port}')
            raise HTTPException(
                status_code=502, detail=f'Cannot connect to agent server on port {port}'
            )
        except httpx.TimeoutException:
            _logger.error(f'Timeout connecting to agent server on port {port}')
            raise HTTPException(
                status_code=504,
                detail=f'Timeout connecting to agent server on port {port}',
            )


async def _execute_bash_command(port: int, command: str, headers: dict) -> dict | None:
    """Execute a bash command on the agent server and return the result."""
    target_url = f'http://localhost:{port}/api/bash/execute_bash_command'
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                target_url,
                headers=headers,
                json={'command': command},
                timeout=30.0,
            )
            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            _logger.error(f'Error executing bash command: {e}')
            return None


async def _list_files_via_bash(port: int, path: str | None, headers: dict) -> list[str]:
    """List files using bash command on the agent server.

    Uses `find` command to recursively list files and directories.
    Returns paths relative to the workspace root.
    """
    # Default to current working directory (workspace)
    target_path = path if path else '.'

    # Use find to list files (not directories) up to 5 levels deep
    # Output relative paths from the target directory
    command = f'find {target_path} -maxdepth 5 -type f 2>/dev/null | head -500'

    result = await _execute_bash_command(port, command, headers)
    if not result:
        return []

    stdout = result.get('stdout', '')
    if not stdout:
        return []

    # Parse the output and filter
    files = []
    for line in stdout.strip().split('\n'):
        line = line.strip()
        if not line or line == '.':
            continue

        # Remove leading ./
        if line.startswith('./'):
            line = line[2:]

        # Skip ignored files/directories
        parts = line.split('/')
        should_skip = False
        for part in parts:
            if part in FILES_TO_IGNORE:
                should_skip = True
                break
        if should_skip:
            continue

        files.append(line)

    return files


async def _read_file_via_download(
    port: int, file_path: str, headers: dict
) -> str | None:
    """Read a file using the agent server's download API.

    The agent server expects absolute paths for file download.
    """
    # First, get the current working directory (workspace root)
    pwd_result = await _execute_bash_command(port, 'pwd', headers)
    if not pwd_result:
        return None

    workspace_root = pwd_result.get('stdout', '').strip()
    if not workspace_root:
        return None

    # Build absolute path
    if file_path.startswith('/'):
        abs_path = file_path
    else:
        abs_path = os.path.join(workspace_root, file_path)

    # URL encode the path for the download endpoint
    target_url = f'http://localhost:{port}/api/file/download/{abs_path}'

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                target_url,
                headers=headers,
                timeout=30.0,
            )
            if response.status_code == 200:
                return response.text
            _logger.warning(
                f'Failed to download file {abs_path}: {response.status_code}'
            )
            return None
        except Exception as e:
            _logger.error(f'Error downloading file {abs_path}: {e}')
            return None


def _copy_auth_headers(request: Request) -> dict:
    """Copy authentication headers from the request."""
    headers = {}
    for key, value in request.headers.items():
        key_lower = key.lower()
        if key_lower in ('x-session-api-key', 'authorization'):
            headers[key] = value
    return headers


# Special routes for file operations (must be defined BEFORE the generic proxy route)


@router.get('/{port:int}/api/conversations/{conversation_id}/list-files')
async def list_files(
    request: Request,
    port: int,
    conversation_id: str,
    path: str | None = Query(None),
) -> JSONResponse:
    """List files in the workspace for a V1 conversation.

    This endpoint translates the list-files request into bash commands
    executed on the agent server, since the agent server doesn't have
    a native list-files endpoint.
    """
    _logger.info(f'Listing files for conversation {conversation_id}, path: {path}')

    headers = _copy_auth_headers(request)
    files = await _list_files_via_bash(port, path, headers)

    return JSONResponse(content=files)


@router.get('/{port:int}/api/conversations/{conversation_id}/select-file')
async def select_file(
    request: Request,
    port: int,
    conversation_id: str,
    file: str = Query(...),
) -> JSONResponse:
    """Get the content of a file in the workspace for a V1 conversation.

    This endpoint translates the select-file request into a file download
    request to the agent server.
    """
    _logger.info(f'Selecting file {file} for conversation {conversation_id}')

    headers = _copy_auth_headers(request)
    content = await _read_file_via_download(port, file, headers)

    if content is None:
        return JSONResponse(
            status_code=404,
            content={'error': f'File not found or unable to read: {file}'},
        )

    return JSONResponse(content={'code': content})


@router.get('/{port:int}/api/git/changes/{path:path}')
async def get_git_changes(
    request: Request,
    port: int,
    path: str,
) -> JSONResponse:
    """Get git changes for a V1 conversation.

    This endpoint checks if the specified path is a git repository and returns
    the list of changed files. For newly initialized repos (no commits), returns
    all untracked files as 'added'.
    """
    from urllib.parse import unquote

    # URL decode the path (e.g., %2Fworkspace -> /workspace)
    decoded_path = unquote(path)
    _logger.info(f'Getting git changes for path: {decoded_path}')

    headers = _copy_auth_headers(request)

    # First check if the directory is a git repository
    check_git_cmd = f'cd {decoded_path} 2>/dev/null && git rev-parse --is-inside-work-tree 2>/dev/null'
    result = await _execute_bash_command(port, check_git_cmd, headers)

    if not result or result.get('stdout', '').strip() != 'true':
        _logger.info(f'Path {decoded_path} is not a git repository')
        return JSONResponse(
            status_code=404,
            content={'error': 'Not a git repository'},
        )

    # Get git status - use porcelain v1 format for machine-readable output
    git_status_cmd = f'cd {decoded_path} && git status --porcelain 2>/dev/null'
    result = await _execute_bash_command(port, git_status_cmd, headers)

    if not result:
        return JSONResponse(
            status_code=500,
            content={'error': 'Failed to get git status'},
        )

    stdout = result.get('stdout', '')
    changes = []

    # Parse git status porcelain output
    # Format: XY filename
    # X = index status, Y = work tree status
    # ?? = untracked, A = added, M = modified, D = deleted, R = renamed
    status_map = {
        'A': 'ADDED',
        'M': 'MODIFIED',
        'D': 'DELETED',
        'R': 'RENAMED',
        'C': 'COPIED',
        'U': 'UPDATED',
    }

    for line in stdout.strip().split('\n'):
        if not line or len(line) < 3:
            continue

        status_code = line[:2]
        file_path = line[3:].strip()

        # Handle renamed files (format: "R  old -> new")
        if ' -> ' in file_path:
            file_path = file_path.split(' -> ')[-1]

        # Map status code to V1 status
        v1_status = 'MODIFIED'  # Default
        if status_code == '??':
            v1_status = 'ADDED'  # Untracked files are treated as added
        else:
            # Take the first non-space character as the primary status
            for char in status_code:
                if char in status_map:
                    v1_status = status_map[char]
                    break

        changes.append(
            {
                'path': file_path,
                'status': v1_status,
            }
        )

    _logger.info(f'Found {len(changes)} git changes in {decoded_path}')
    return JSONResponse(content=changes)


@router.api_route(
    '/{port:int}/{path:path}',
    methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
)
async def proxy_http_request(request: Request, port: int, path: str):
    """Proxy HTTP requests to the agent server on the specified port."""
    # Log auth header presence for debugging
    has_auth = 'x-session-api-key' in [k.lower() for k in request.headers.keys()]
    _logger.info(
        f'Proxying {request.method} to port {port}, path: /{path}, has_auth: {has_auth}'
    )
    return await _forward_request(request, port, path)


@router.websocket('/{port:int}/sockets/events/{conversation_id}')
async def proxy_websocket(websocket: WebSocket, port: int, conversation_id: str):
    """Proxy WebSocket connections to the agent server."""
    await websocket.accept()

    # Build target WebSocket URL with query params
    target_url = f'ws://localhost:{port}/sockets/events/{conversation_id}'
    query_string = str(websocket.url.query)
    if query_string:
        target_url += f'?{query_string}'

    _logger.info(f'Proxying WebSocket to {target_url}')

    try:
        async with httpx.AsyncClient():
            # Use websockets library for WebSocket proxying
            import websockets

            async with websockets.connect(target_url) as target_ws:
                # Create tasks for bidirectional forwarding
                async def forward_client_to_server():
                    try:
                        while True:
                            data = await websocket.receive_text()
                            await target_ws.send(data)
                    except WebSocketDisconnect:
                        _logger.debug('Client WebSocket disconnected')
                    except Exception as e:
                        _logger.debug(f'Error forwarding to server: {e}')

                async def forward_server_to_client():
                    try:
                        async for message in target_ws:
                            await websocket.send_text(message)
                    except Exception as e:
                        _logger.debug(f'Error forwarding to client: {e}')

                # Run both tasks
                await asyncio.gather(
                    forward_client_to_server(),
                    forward_server_to_client(),
                    return_exceptions=True,
                )
    except Exception as e:
        _logger.error(f'WebSocket proxy error: {e}')
        await websocket.close(code=1011, reason=str(e))
