"""Runtime proxy router for forwarding requests to agent servers.

This module provides a reverse proxy that forwards HTTP and WebSocket requests
from /runtime/{port}/* to localhost:{port}/*. This is essential for deployments
(like Railway) where only a single port is exposed to the outside world, but
V1 conversations require direct communication with agent servers running on
different ports.
"""

import asyncio
import logging

import httpx
from fastapi import APIRouter, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse

_logger = logging.getLogger(__name__)

router = APIRouter(prefix='/runtime', tags=['runtime-proxy'])


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
