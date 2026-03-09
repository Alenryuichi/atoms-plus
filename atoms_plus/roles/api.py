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


def _get_project_root() -> Path:
    """Get the project root directory based on this file's location."""
    # atoms_plus/roles/api.py -> project root is 2 levels up
    return Path(__file__).parent.parent.parent


def _init_role_cache() -> None:
    """Load role microagents from .openhands/microagents/ and cache them."""
    global _role_cache, _cache_initialized

    if _cache_initialized:
        return

    # Use absolute path based on project root to work on Railway
    project_root = _get_project_root()
    microagents_dir = project_root / '.openhands' / 'microagents'

    logger.info(f'Looking for microagents in: {microagents_dir}')

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
    use_llm: bool = True  # Default to LLM-based detection


class AutoRouteResponse(BaseModel):
    """Response model for auto-routing."""

    role_id: str
    role_name: str
    role_title: str
    avatar: str
    confidence: float
    matched_keywords: list[str]
    reason: str
    is_web_app_task: bool = True  # New field for Vibe Coding
    vibe_coding_instructions: str | None = None  # Mandatory instructions


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

    When use_llm=True (default), uses LLM for intelligent role detection.
    When use_llm=False, falls back to keyword-based matching.

    Also returns vibe_coding_instructions for mandatory web app generation.

    Args:
        request: Contains the user's input text and use_llm flag

    Returns:
        The detected role with confidence score and vibe coding instructions

    Example:
        POST /api/v1/roles/auto-detect
        {"user_input": "做一个番茄钟应用", "use_llm": true}

        Response:
        {
            "role_id": "role-engineer",
            "role_name": "Bob",
            "role_title": "Senior Software Engineer",
            "avatar": "💻",
            "confidence": 0.95,
            "matched_keywords": [],
            "reason": "LLM detected: web app development task",
            "is_web_app_task": true,
            "vibe_coding_instructions": "..."
        }
    """
    from atoms_plus.roles.llm_router import detect_role_with_llm
    from atoms_plus.roles.vibe_coding_instructions import (
        generate_vibe_coding_instructions,
    )

    # Try LLM-based detection first (if enabled)
    if request.use_llm:
        try:
            detection = await detect_role_with_llm(request.user_input)
            metadata = ROLE_METADATA.get(detection.role_id, {})

            # Generate vibe coding instructions
            instructions = generate_vibe_coding_instructions(
                role_id=detection.role_id,
                is_web_app_task=detection.is_web_app_task,
            )

            return AutoRouteResponse(
                role_id=detection.role_id,
                role_name=metadata.get('name', 'Bob'),
                role_title=metadata.get('title', 'Senior Software Engineer'),
                avatar=metadata.get('avatar', '💻'),
                confidence=detection.confidence,
                matched_keywords=[],
                reason=f'LLM detected: {detection.reasoning}',
                is_web_app_task=detection.is_web_app_task,
                vibe_coding_instructions=instructions,
            )
        except Exception as e:
            logger.warning(f'LLM detection failed, falling back to keywords: {e}')

    # Fallback to keyword-based detection
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
                score += 0.15

        if score > best_score:
            best_score = score
            best_match = (role_id, matched_triggers, min(score, 1.0))

    # Default to engineer if no match
    if best_match is None or best_score < 0.1:
        role_id = 'role-engineer'
        matched_keywords = []
        confidence = 0.5
        reason = 'Default role for general development tasks'
    else:
        role_id, matched_keywords, confidence = best_match
        reason = f'Matched {role_id} triggers'

    metadata = ROLE_METADATA.get(role_id, {})

    # Generate vibe coding instructions (assume web app task for keyword fallback)
    instructions = generate_vibe_coding_instructions(
        role_id=role_id,
        is_web_app_task=True,
    )

    return AutoRouteResponse(
        role_id=role_id,
        role_name=metadata.get('name', role_id),
        role_title=metadata.get('title', 'Agent'),
        avatar=metadata.get('avatar', '🤖'),
        confidence=confidence,
        matched_keywords=matched_keywords,
        reason=reason,
        is_web_app_task=True,
        vibe_coding_instructions=instructions,
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
