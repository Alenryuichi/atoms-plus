# Atoms Plus Role System - API Endpoints
"""
FastAPI router for role management with AUTO-ROUTING support.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from atoms_plus.roles.registry import RoleRegistry
from atoms_plus.roles.router import RoleRouter

router = APIRouter(prefix='/api/v1/roles', tags=['roles'])


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


@router.get('/', response_model=RoleListResponse)
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


@router.get('/{role_id}', response_model=RoleResponse)
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


@router.get('/{role_id}/prompt', response_model=SystemPromptResponse)
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


@router.get('/{role_id}/tools')
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
            'role_id': role_id,
            'tools': config.get_tool_config(),
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# =============================================================================
# AUTO-ROUTING ENDPOINTS
# =============================================================================


class AutoRouteRequest(BaseModel):
    """Request model for auto-routing."""

    user_input: str


class AutoRouteResponse(BaseModel):
    """Response model for auto-routing."""

    role_id: str
    role_name: str
    role_title: str
    avatar: str
    confidence: float
    matched_keywords: list[str]
    reason: str
    system_prompt: str


@router.post('/auto-detect', response_model=AutoRouteResponse)
async def auto_detect_role(request: AutoRouteRequest):
    """
    Automatically detect the best role for a given user input.

    This is the main endpoint for the auto-routing system.
    The system analyzes the user's input and returns the best matching role.

    Args:
        request: Contains the user's input text

    Returns:
        The detected role with confidence score and system prompt

    Example:
        POST /api/v1/roles/auto-detect
        {"user_input": "设计一个电商平台的微服务架构"}

        Response:
        {
            "role_id": "architect",
            "role_name": "Alex",
            "role_title": "Software Architect",
            "avatar": "🏗️",
            "confidence": 0.85,
            "matched_keywords": ["架构", "设计", "微服务"],
            "reason": "System architecture and design tasks",
            "system_prompt": "..."
        }
    """
    # Detect the best role
    route_result = RoleRouter.detect_role(request.user_input)

    # Get role configuration
    config = RoleRegistry.get_role(route_result.role)

    # Get system prompt
    system_prompt = RoleRegistry.get_system_prompt(route_result.role)

    return AutoRouteResponse(
        role_id=route_result.role.value,
        role_name=config.name,
        role_title=config.role,
        avatar=config.avatar,
        confidence=route_result.confidence,
        matched_keywords=route_result.matched_keywords,
        reason=route_result.reason,
        system_prompt=system_prompt,
    )
