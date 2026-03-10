"""Runtime proxy router for forwarding requests to agent servers.

This module provides a reverse proxy that forwards HTTP and WebSocket requests
from /runtime/{port}/* to localhost:{port}/*. This is essential for deployments
(like Railway) where only a single port is exposed to the outside world, but
V1 conversations require direct communication with agent servers running on
different ports.

It also provides special handling for file operations (list-files, select-file)
that are not directly supported by the agent server but are needed by the frontend.

Additionally, it rewrites HTML responses to fix absolute paths. Dev servers like
Vite generate HTML with absolute paths (e.g., src="/@vite/client"), which break
when accessed through the /runtime/{port}/ proxy. This module rewrites these
paths to include the correct proxy prefix.
"""

from __future__ import annotations

import asyncio
import logging
import os
import re

import httpx
from fastapi import (
    APIRouter,
    HTTPException,
    Query,
    Request,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.responses import JSONResponse, Response, StreamingResponse

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


def _rewrite_html_paths(html_content: str, port: int) -> str:
    """Rewrite absolute paths in HTML to include the runtime proxy prefix.

    Dev servers like Vite, Webpack, and Next.js generate HTML with absolute paths
    (e.g., src="/@vite/client", href="/styles.css"). When accessed through the
    /runtime/{port}/ proxy, these paths break because the browser requests them
    from the root domain instead of the proxied path.

    This function rewrites:
      src="/"  -> src="/runtime/{port}/"
      href="/" -> href="/runtime/{port}/"
      url(/)   -> url(/runtime/{port}/)  (for inline CSS)

    Note: We only rewrite paths that start with "/" but not "//" (protocol-relative URLs).
    """
    prefix = f'/runtime/{port}'

    # Pattern to match src="/" or src='/' (but not src="//")
    # Captures: attribute name, quote char, path
    html_content = re.sub(
        r'(src|href)=(["\'])(/(?!/))([^"\']*)',
        rf'\1=\2{prefix}\3\4',
        html_content,
    )

    # Also handle inline scripts that set base URLs (common in Vite HMR)
    # e.g., __VITE_BASE__ = "/" -> __VITE_BASE__ = "/runtime/{port}/"
    html_content = re.sub(
        r'(["\'])(/(?!/))(["\'])',
        rf'\1{prefix}\2\3',
        html_content,
    )

    return html_content


def _rewrite_js_paths(js_content: str, port: int) -> str:
    """Rewrite absolute paths in JavaScript modules to include the runtime proxy prefix.

    Vite and other bundlers generate JavaScript modules with absolute import paths like:
      import foo from "/node_modules/.vite/deps/react.js"
      import "/src/index.css"

    When the HTML is loaded from /runtime/{port}/, these absolute paths break because
    the browser requests them from the root domain. This function rewrites:
      from "/..."  -> from "/runtime/{port}/..."
      import "/..." -> import "/runtime/{port}/..."

    Note: We only rewrite paths that start with "/" but not "//" (protocol-relative URLs).
    """
    prefix = f'/runtime/{port}'

    # Rewrite ES module imports: from "/path" or from '/path'
    # Matches: from "/node_modules/..." or from '/src/...'
    js_content = re.sub(
        r'from\s+(["\'])(/(?!/))([^"\']*)\1',
        rf'from \1{prefix}\2\3\1',
        js_content,
    )

    # Rewrite dynamic imports: import("/path") or import('/path')
    js_content = re.sub(
        r'import\s*\(\s*(["\'])(/(?!/))([^"\']*)\1\s*\)',
        rf'import(\1{prefix}\2\3\1)',
        js_content,
    )

    # Rewrite bare string imports (Vite uses these for CSS):
    # import "/src/index.css"
    js_content = re.sub(
        r'import\s+(["\'])(/(?!/))([^"\']*)\1',
        rf'import \1{prefix}\2\3\1',
        js_content,
    )

    return js_content


def _is_html_response(content_type: str | None) -> bool:
    """Check if the response content type indicates HTML."""
    if not content_type:
        return False
    return 'text/html' in content_type.lower()


def _is_js_response(content_type: str | None) -> bool:
    """Check if the response content type indicates JavaScript."""
    if not content_type:
        return False
    ct_lower = content_type.lower()
    return any(
        t in ct_lower
        for t in (
            'text/javascript',
            'application/javascript',
            'application/x-javascript',
            'text/ecmascript',
            'application/ecmascript',
        )
    )


async def _forward_request(
    request: Request, port: int, path: str
) -> StreamingResponse | Response:
    """Forward an HTTP request to the agent server running on the specified port.

    For HTML and JavaScript responses, this function rewrites absolute paths to
    include the /runtime/{port}/ prefix, allowing dev servers like Vite to work
    correctly through the proxy.
    """
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

    # Use longer timeout for LLM operations that may take 2+ minutes
    async with httpx.AsyncClient() as client:
        try:
            response = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=body,
                timeout=180.0,  # 3 minutes for long LLM operations
            )

            content_type = response.headers.get('content-type')

            # For HTML responses, rewrite absolute paths to include proxy prefix
            if _is_html_response(content_type):
                html_content = response.text
                rewritten_html = _rewrite_html_paths(html_content, port)

                # Build response headers, excluding content-length (will be recalculated)
                response_headers = {
                    k: v
                    for k, v in response.headers.items()
                    if k.lower() != 'content-length'
                }

                return Response(
                    content=rewritten_html,
                    status_code=response.status_code,
                    headers=response_headers,
                    media_type=content_type,
                )

            # For JavaScript responses, rewrite import paths to include proxy prefix
            if _is_js_response(content_type):
                js_content = response.text
                rewritten_js = _rewrite_js_paths(js_content, port)

                # Build response headers, excluding content-length (will be recalculated)
                response_headers = {
                    k: v
                    for k, v in response.headers.items()
                    if k.lower() != 'content-length'
                }

                return Response(
                    content=rewritten_js,
                    status_code=response.status_code,
                    headers=response_headers,
                    media_type=content_type,
                )

            # For non-HTML/JS responses, stream as-is
            async def generate():
                async for chunk in response.aiter_bytes():
                    yield chunk

            return StreamingResponse(
                generate(),
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=content_type,
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
            # Explicitly disable proxy to avoid SOCKS proxy issues on localhost
            import websockets

            # Increase timeouts for slow Agent Server startup during LLM operations
            # Default open_timeout=10s is too short when LLM is processing
            async with websockets.connect(
                target_url,
                proxy=None,
                open_timeout=60,  # 60s for WebSocket handshake (LLM can be slow)
                ping_timeout=60,  # 60s for ping/pong
                close_timeout=10,  # 10s for graceful close
            ) as target_ws:
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
