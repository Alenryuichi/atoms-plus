# Atoms Plus - Vibe Coding Instructions Generator
"""
Generates mandatory web app development instructions for conversation_instructions.

This module creates strong directives that force the agent to:
1. Always produce runnable web applications
2. Never just answer questions without code
3. Follow the Vibe Coding workflow
4. Use project graph for structured code generation (inspired by MiroFish)
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from atoms_plus.project_graph.models import ProjectGraph

logger = logging.getLogger(__name__)

# Template for mandatory web app instructions (with project graph)
VIBE_CODING_INSTRUCTIONS = """
🎯 PRIMARY OBJECTIVE: Generate a complete, runnable web application.

═══════════════════════════════════════════════════════════════════════════════
⚠️ MANDATORY REQUIREMENTS - YOU MUST FOLLOW THESE EXACTLY
═══════════════════════════════════════════════════════════════════════════════

1. ALWAYS CREATE CODE
   - Every response must include working code
   - Create a complete web application, not just snippets
   - Follow the project structure defined below

2. WORKFLOW (Execute in order):
   Step 1: Create project with `npm create vite@latest app -- --template react-ts --no-interactive`
   Step 2: Set up Tailwind CSS
   Step 3: Implement ALL entities and features from the PROJECT GRAPH
   Step 4: Run `npm install && npm run dev`
   Step 5: Report the preview URL (http://localhost:5173)

3. SMART DEFAULTS (override with project graph if provided):
   - Framework: React + Vite
   - Language: TypeScript
   - Styling: Tailwind CSS
   - State: React hooks (useState, useReducer)

❌ FORBIDDEN BEHAVIORS:
- Responding with only text explanations
- Asking more than 1-2 clarifying questions
- Creating documentation without code
- Leaving the project in a non-runnable state
- Ignoring the project graph structure

✅ SUCCESS CRITERIA:
- A running dev server with `npm run dev`
- All entities from project graph implemented
- All features listed in project graph working
- Preview URL reported to the user

═══════════════════════════════════════════════════════════════════════════════
ROLE CONTEXT: {role_name} ({role_title})
═══════════════════════════════════════════════════════════════════════════════
{role_instructions}
{project_graph_context}
"""

# Non-web-app instructions (for tasks like PRD writing, research, etc.)
NON_WEB_APP_INSTRUCTIONS = """
ROLE CONTEXT: {role_name} ({role_title})
═══════════════════════════════════════════════════════════════════════════════
{role_instructions}

Note: This task does not require generating a web application.
Focus on providing high-quality output specific to your role.
{project_graph_context}
"""


def load_role_content(role_id: str) -> tuple[str, str, str]:
    """
    Load role content from microagent file.

    Args:
        role_id: Role identifier (e.g., "role-engineer")

    Returns:
        Tuple of (role_name, role_title, role_instructions)
    """
    # Role metadata
    role_metadata = {
        'role-architect': ('Alex', 'Software Architect'),
        'role-engineer': ('Bob', 'Senior Software Engineer'),
        'role-product-manager': ('Emma', 'Product Manager'),
        'role-data-analyst': ('Diana', 'Data Analyst'),
        'role-researcher': ('Ryan', 'Deep Researcher'),
        'role-project-manager': ('Sarah', 'Project Manager'),
        'role-seo-specialist': ('Sophie', 'SEO Specialist'),
        'role-team-leader': ('Mike', 'Team Leader'),
    }

    name, title = role_metadata.get(role_id, ('Bob', 'Senior Software Engineer'))

    # Try to load role content from microagent file
    microagent_path = Path(f'.openhands/microagents/{role_id}.md')
    role_instructions = ''

    if microagent_path.exists():
        try:
            content = microagent_path.read_text(encoding='utf-8')
            # Skip frontmatter
            if content.startswith('---'):
                parts = content.split('---', 2)
                if len(parts) >= 3:
                    role_instructions = parts[2].strip()
                else:
                    role_instructions = content
            else:
                role_instructions = content
        except Exception as e:
            logger.warning(f'[VibeCoding] Failed to load {role_id}: {e}')

    return name, title, role_instructions


def generate_vibe_coding_instructions(
    role_id: str,
    is_web_app_task: bool = True,
    project_graph: 'ProjectGraph | None' = None,
) -> str:
    """
    Generate mandatory instructions for a conversation.

    Args:
        role_id: The detected role (e.g., "role-engineer")
        is_web_app_task: Whether this is a web app development task
        project_graph: Optional project graph for structured generation

    Returns:
        Formatted instructions string for conversation_instructions
    """
    role_name, role_title, role_instructions = load_role_content(role_id)

    # Generate project graph context if available
    project_graph_context = ''
    if project_graph and is_web_app_task:
        project_graph_context = (
            '\n═══════════════════════════════════════════════════════════════════════════════\n'
            '📊 PROJECT GRAPH (Follow this structure)\n'
            '═══════════════════════════════════════════════════════════════════════════════\n'
            f'{project_graph.to_prompt_context()}'
        )
        logger.info(
            f'[VibeCoding] Including project graph: {project_graph.name}, '
            f'{len(project_graph.entities)} entities'
        )

    if is_web_app_task:
        template = VIBE_CODING_INSTRUCTIONS
    else:
        template = NON_WEB_APP_INSTRUCTIONS

    instructions = template.format(
        role_name=role_name,
        role_title=role_title,
        role_instructions=role_instructions[:2000],  # Limit size
        project_graph_context=project_graph_context,
    )

    logger.info(
        f'[VibeCoding] Generated instructions: '
        f'role={role_id}, web_app={is_web_app_task}, '
        f'graph={project_graph is not None}, '
        f'length={len(instructions)}'
    )

    return instructions.strip()
