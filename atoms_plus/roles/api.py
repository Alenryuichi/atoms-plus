# Atoms Plus Role System - API Endpoints
"""
FastAPI router for role management.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from atoms_plus.roles.base import AgentRole
from atoms_plus.roles.registry import RoleRegistry


router = APIRouter(prefix="/api/v1/roles", tags=["roles"])


class RoleResponse(BaseModel):
    """Response model for a single role."""

    id: str
    name: str
    role: str
    avatar: str
    goal: str
    backstory: str
    capabilities: list[str]
    recommended_model: str


class RoleListResponse(BaseModel):
    """Response model for listing roles."""

    roles: list[RoleResponse]
    count: int


class SystemPromptResponse(BaseModel):
    """Response model for system prompt."""

    role_id: str
    role_name: str
    system_prompt: str


@router.get("/", response_model=RoleListResponse)
async def list_roles():
    """
    List all available agent roles.

    Returns a list of all configured roles with their metadata.
    """
    roles = RoleRegistry.list_roles()
    return RoleListResponse(
        roles=[RoleResponse(**r) for r in roles],
        count=len(roles),
    )


@router.get("/{role_id}", response_model=RoleResponse)
async def get_role(role_id: str):
    """
    Get details for a specific role.

    Args:
        role_id: The role identifier (e.g., "engineer", "architect")

    Returns:
        Role configuration and metadata
    """
    try:
        config = RoleRegistry.get_role(role_id)
        return RoleResponse(**config.to_dict())
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{role_id}/prompt", response_model=SystemPromptResponse)
async def get_role_prompt(role_id: str):
    """
    Get the system prompt for a specific role.

    Args:
        role_id: The role identifier

    Returns:
        The rendered system prompt for the role
    """
    try:
        config = RoleRegistry.get_role(role_id)
        prompt = RoleRegistry.get_system_prompt(role_id)
        return SystemPromptResponse(
            role_id=role_id,
            role_name=config.name,
            system_prompt=prompt,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{role_id}/tools")
async def get_role_tools(role_id: str):
    """
    Get the tool configuration for a specific role.

    Args:
        role_id: The role identifier

    Returns:
        Dictionary of enabled/disabled tools for the role
    """
    try:
        config = RoleRegistry.get_role(role_id)
        return {
            "role_id": role_id,
            "tools": config.get_tool_config(),
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

