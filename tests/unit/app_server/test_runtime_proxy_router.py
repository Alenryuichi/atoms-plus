import httpx
from fastapi import FastAPI
from fastapi.testclient import TestClient

from openhands.app_server.runtime_proxy.runtime_proxy_router import (
    _build_rewritten_response_headers,
    router,
)


def test_build_rewritten_response_headers_strips_body_dependent_headers():
    headers = httpx.Headers(
        {
            'content-type': 'text/html; charset=utf-8',
            'content-encoding': 'gzip',
            'content-length': '1234',
            'transfer-encoding': 'chunked',
            'etag': 'W/"abc"',
            'cache-control': 'no-cache',
            'vary': 'Accept-Encoding',
        }
    )

    rewritten = _build_rewritten_response_headers(headers)

    assert 'content-encoding' not in rewritten
    assert 'content-length' not in rewritten
    assert 'transfer-encoding' not in rewritten
    assert 'etag' not in rewritten
    assert rewritten['content-type'] == 'text/html; charset=utf-8'
    assert rewritten['cache-control'] == 'no-cache'
    assert rewritten['vary'] == 'Accept-Encoding'


def test_runtime_root_redirects_to_trailing_slash():
    app = FastAPI()
    app.include_router(router)
    client = TestClient(app)

    response = client.get('/runtime/4000?foo=bar', follow_redirects=False)

    assert response.status_code == 307
    assert response.headers['location'] == '/runtime/4000/?foo=bar'
