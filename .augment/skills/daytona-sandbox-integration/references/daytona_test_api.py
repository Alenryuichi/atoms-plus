"""Daytona Test API - Reference Implementation

This is a reference implementation for Daytona sandbox integration testing.
Copy and modify as needed for your project.

Usage:
    from daytona_test_api import router as daytona_router
    app.include_router(daytona_router)
"""

from __future__ import annotations

import logging
import os
from typing import Optional, Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/daytona-test", tags=["daytona-test"])


class DaytonaConfig(BaseModel):
    """Daytona configuration status."""
    api_key_configured: bool
    api_url: str
    target: str
    runtime_enabled: bool


class SandboxCreateRequest(BaseModel):
    """Request to create a test sandbox."""
    label: str = "test-sandbox"
    auto_stop_minutes: int = 60


class SandboxInfo(BaseModel):
    """Information about a Daytona sandbox."""
    id: str
    state: str
    preview_url: Optional[str] = None


@router.get("/config", response_model=DaytonaConfig)
async def get_daytona_config() -> DaytonaConfig:
    """Get current Daytona configuration status."""
    api_key = os.getenv("DAYTONA_API_KEY", "")
    runtime = os.getenv("RUNTIME", "local")
    return DaytonaConfig(
        api_key_configured=bool(api_key and len(api_key) > 10),
        api_url=os.getenv("DAYTONA_API_URL", "https://app.daytona.io/api"),
        target=os.getenv("DAYTONA_TARGET", "eu"),
        runtime_enabled=runtime == "daytona"
    )


@router.post("/sandbox/create", response_model=SandboxInfo)
async def create_test_sandbox(request: SandboxCreateRequest) -> SandboxInfo:
    """Create a test Daytona sandbox."""
    try:
        from daytona import Daytona, DaytonaConfig as DaytonaSDKConfig, CreateSandboxParams
    except ImportError:
        raise HTTPException(status_code=500, detail="Daytona SDK not installed")
    
    api_key = os.getenv("DAYTONA_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="DAYTONA_API_KEY not set")
    
    try:
        config = DaytonaSDKConfig(
            api_key=api_key,
            server_url=os.getenv("DAYTONA_API_URL", "https://app.daytona.io/api"),
            target=os.getenv("DAYTONA_TARGET", "eu"),
        )
        daytona = Daytona(config)
        sandbox = daytona.create(CreateSandboxParams(
            language="python",
            labels={"test": request.label},
            auto_stop_interval=request.auto_stop_minutes,
        ))
        logger.info(f"Created test sandbox: {sandbox.id}")
        return SandboxInfo(id=sandbox.id, state=sandbox.state)
    except Exception as e:
        logger.exception(f"Failed to create sandbox: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sandbox/{sandbox_id}", response_model=SandboxInfo)
async def get_sandbox_info(sandbox_id: str) -> SandboxInfo:
    """Get information about a specific sandbox."""
    try:
        from daytona import Daytona, DaytonaConfig as DaytonaSDKConfig
    except ImportError:
        raise HTTPException(status_code=500, detail="Daytona SDK not installed")
    
    api_key = os.getenv("DAYTONA_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="DAYTONA_API_KEY not set")
    
    try:
        config = DaytonaSDKConfig(
            api_key=api_key,
            server_url=os.getenv("DAYTONA_API_URL", "https://app.daytona.io/api"),
            target=os.getenv("DAYTONA_TARGET", "eu"),
        )
        daytona = Daytona(config)
        sandboxes = daytona.list({"id": sandbox_id})
        if not sandboxes:
            raise HTTPException(status_code=404, detail="Sandbox not found")
        return SandboxInfo(id=sandboxes[0].id, state=sandboxes[0].state)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/sandbox/{sandbox_id}")
async def delete_sandbox(sandbox_id: str) -> Dict[str, str]:
    """Delete a test sandbox."""
    try:
        from daytona import Daytona, DaytonaConfig as DaytonaSDKConfig
    except ImportError:
        raise HTTPException(status_code=500, detail="Daytona SDK not installed")
    
    api_key = os.getenv("DAYTONA_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="DAYTONA_API_KEY not set")
    
    try:
        config = DaytonaSDKConfig(
            api_key=api_key,
            server_url=os.getenv("DAYTONA_API_URL", "https://app.daytona.io/api"),
            target=os.getenv("DAYTONA_TARGET", "eu"),
        )
        daytona = Daytona(config)
        sandboxes = daytona.list({"id": sandbox_id})
        if sandboxes:
            sandboxes[0].delete()
            logger.info(f"Deleted sandbox: {sandbox_id}")
        return {"status": "deleted", "sandbox_id": sandbox_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

