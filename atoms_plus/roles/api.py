# Atoms Plus Role System - API Endpoints
"""
FastAPI router for role management with AUTO-ROUTING support.

This module uses OpenHands microagents as the single source of truth for role detection.
Role microagents are located in .openhands/microagents/role-*.md and contain triggers
that determine when each role should be activated.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from openhands.core.logger import openhands_logger as logger
from openhands.microagent import load_microagents_from_dir

router = APIRouter(prefix='/api/v1/roles', tags=['roles'])

# =============================================================================
# ROLE MICROAGENT CACHE
# =============================================================================

# Role metadata extracted from microagent files
ROLE_METADATA: dict[str, dict] = {
    'role-architect': {
        'name': 'Alex',
        'title': 'Software Architect',
        'avatar': '🏗️',
    },
    'role-engineer': {
        'name': 'Bob',
        'title': 'Senior Software Engineer',
        'avatar': '💻',
    },
    'role-product-manager': {
        'name': 'Emma',
        'title': 'Product Manager',
        'avatar': '📋',
    },
    'role-data-analyst': {
        'name': 'Diana',
        'title': 'Data Analyst',
        'avatar': '📈',
    },
    'role-researcher': {
        'name': 'Ryan',
        'title': 'Deep Researcher',
        'avatar': '🔬',
    },
    'role-project-manager': {
        'name': 'Sarah',
        'title': 'Project Manager',
        'avatar': '📊',
    },
    'role-seo-specialist': {
        'name': 'Sophie',
        'title': 'SEO Specialist',
        'avatar': '🔍',
    },
    'role-team-leader': {
        'name': 'Mike',
        'title': 'Team Leader',
        'avatar': '👔',
    },
}


@dataclass
class RoleMicroagent:
    """Cached role microagent data."""

    name: str
    triggers: list[str]
    content: str


# Cache for role microagents (loaded once at startup)
_role_cache: dict[str, RoleMicroagent] = {}
_cache_initialized: bool = False


def _init_role_cache() -> None:
    """Load role microagents from .openhands/microagents/ and cache them."""
    global _role_cache, _cache_initialized

    if _cache_initialized:
        return

    microagents_dir = Path('.openhands/microagents')
    if not microagents_dir.exists():
        logger.warning(f'Microagents directory not found: {microagents_dir}')
        _cache_initialized = True
        return

    try:
        _, knowledge_agents = load_microagents_from_dir(microagents_dir)

        for agent_name, agent in knowledge_agents.items():
            if agent_name.startswith('role-'):
                _role_cache[agent_name] = RoleMicroagent(
                    name=agent_name,
                    triggers=agent.metadata.triggers,
                    content=agent.content,
                )
                logger.info(
                    f'Loaded role microagent: {agent_name} '
                    f'with {len(agent.metadata.triggers)} triggers'
                )

        logger.info(f'Initialized role cache with {len(_role_cache)} roles')
    except Exception as e:
        logger.error(f'Failed to load role microagents: {e}')

    _cache_initialized = True


def _get_role_cache() -> dict[str, RoleMicroagent]:
    """Get the role cache, initializing if needed."""
    if not _cache_initialized:
        _init_role_cache()
    return _role_cache


# =============================================================================
# PYDANTIC MODELS
# =============================================================================


class RoleInfo(BaseModel):
    """Brief role information."""

    id: str
    name: str
    title: str
    avatar: str
    triggers: list[str]


class RoleListResponse(BaseModel):
    """Response model for listing roles."""

    roles: list[RoleInfo]
    count: int


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


# =============================================================================
# API ENDPOINTS
# =============================================================================


@router.get('/list', response_model=RoleListResponse)
async def list_roles():
    """
    List all available agent roles loaded from microagents.

    Returns a list of all role microagents with their metadata and triggers.
    """
    roles = []
    cache = _get_role_cache()

    for role_id, role_agent in cache.items():
        metadata = ROLE_METADATA.get(role_id, {})
        roles.append(
            RoleInfo(
                id=role_id,
                name=metadata.get('name', role_id),
                title=metadata.get('title', 'Agent'),
                avatar=metadata.get('avatar', '🤖'),
                triggers=role_agent.triggers,
            )
        )

    return RoleListResponse(roles=roles, count=len(roles))


@router.post('/auto-detect', response_model=AutoRouteResponse)
async def auto_detect_role(request: AutoRouteRequest):
    """
    Automatically detect the best role based on user input.

    This endpoint uses the same triggers as OpenHands microagents to ensure
    consistency between UI display and actual agent behavior.

    The detection is for UI display purposes only - the actual prompt injection
    is handled by OpenHands microagents in the agent loop.

    Args:
        request: Contains the user's input text

    Returns:
        The detected role with confidence score

    Example:
        POST /api/v1/roles/auto-detect
        {"user_input": "设计一个电商平台的微服务架构"}

        Response:
        {
            "role_id": "role-architect",
            "role_name": "Alex",
            "role_title": "Software Architect",
            "avatar": "🏗️",
            "confidence": 0.85,
            "matched_keywords": ["架构", "设计", "微服务"],
            "reason": "Matched role-architect triggers"
        }
    """
    cache = _get_role_cache()
    user_input_lower = request.user_input.lower()

    best_match: tuple[str, list[str], float] | None = None
    best_score = 0.0

    for role_id, role_agent in cache.items():
        matched_triggers = []
        score = 0.0

        for trigger in role_agent.triggers:
            trigger_lower = trigger.lower()
            if trigger_lower in user_input_lower:
                matched_triggers.append(trigger)
                score += 0.15  # Each trigger match adds 0.15

        if score > best_score:
            best_score = score
            best_match = (role_id, matched_triggers, min(score, 1.0))

    # Default to engineer if no match
    if best_match is None or best_score < 0.1:
        metadata = ROLE_METADATA.get('role-engineer', {})
        return AutoRouteResponse(
            role_id='role-engineer',
            role_name=metadata.get('name', 'Bob'),
            role_title=metadata.get('title', 'Senior Software Engineer'),
            avatar=metadata.get('avatar', '💻'),
            confidence=0.5,
            matched_keywords=[],
            reason='Default role for general development tasks',
        )

    role_id, matched_keywords, confidence = best_match
    metadata = ROLE_METADATA.get(role_id, {})

    return AutoRouteResponse(
        role_id=role_id,
        role_name=metadata.get('name', role_id),
        role_title=metadata.get('title', 'Agent'),
        avatar=metadata.get('avatar', '🤖'),
        confidence=confidence,
        matched_keywords=matched_keywords,
        reason=f'Matched {role_id} triggers',
    )


@router.get('/{role_id}')
async def get_role(role_id: str):
    """
    Get details for a specific role.

    Args:
        role_id: The role identifier (e.g., "role-architect", "role-engineer")

    Returns:
        Role metadata and triggers
    """
    cache = _get_role_cache()

    if role_id not in cache:
        raise HTTPException(status_code=404, detail=f'Role not found: {role_id}')

    role_agent = cache[role_id]
    metadata = ROLE_METADATA.get(role_id, {})

    return {
        'id': role_id,
        'name': metadata.get('name', role_id),
        'title': metadata.get('title', 'Agent'),
        'avatar': metadata.get('avatar', '🤖'),
        'triggers': role_agent.triggers,
        'content_preview': role_agent.content[:500] + '...'
        if len(role_agent.content) > 500
        else role_agent.content,
    }
