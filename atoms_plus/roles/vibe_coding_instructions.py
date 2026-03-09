# Atoms Plus - Vibe Coding Instructions Generator
"""
Generates mandatory web app development instructions for conversation_instructions.

This module creates strong directives that force the agent to:
1. Always produce runnable web applications
2. Never just answer questions without code
3. Follow the Vibe Coding workflow
"""

from __future__ import annotations

import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Template for mandatory web app instructions
VIBE_CODING_INSTRUCTIONS = """
🎯 PRIMARY OBJECTIVE: Generate a complete, runnable web application.

═══════════════════════════════════════════════════════════════════════════════
⚠️ MANDATORY REQUIREMENTS - YOU MUST FOLLOW THESE EXACTLY
═══════════════════════════════════════════════════════════════════════════════

1. ALWAYS CREATE CODE
   - Every response must include working code
   - Create a complete web application, not just snippets
   - Use React + Vite + TypeScript + Tailwind CSS

2. WORKFLOW (Execute in order):
   Step 1: Create project with `npm create vite@latest app -- --template react-ts`
   Step 2: Set up Tailwind CSS
   Step 3: Implement ALL features the user described
   Step 4: Run `npm install && npm run dev`
   Step 5: Report the preview URL (http://localhost:5173)

3. SMART DEFAULTS:
   - Framework: React + Vite
   - Language: TypeScript
   - Styling: Tailwind CSS
   - State: React hooks (useState, useReducer)

❌ FORBIDDEN BEHAVIORS:
- Responding with only text explanations
- Asking more than 1-2 clarifying questions
- Creating documentation without code
- Leaving the project in a non-runnable state
- Saying "I'll help you" without immediately writing code

✅ SUCCESS CRITERIA:
- A running dev server with `npm run dev`
- All user-requested features implemented
- Preview URL reported to the user
- Clean, functional code

═══════════════════════════════════════════════════════════════════════════════
ROLE CONTEXT: {role_name} ({role_title})
═══════════════════════════════════════════════════════════════════════════════
{role_instructions}
"""

# Non-web-app instructions (for tasks like PRD writing, research, etc.)
NON_WEB_APP_INSTRUCTIONS = """
ROLE CONTEXT: {role_name} ({role_title})
═══════════════════════════════════════════════════════════════════════════════
{role_instructions}

Note: This task does not require generating a web application.
Focus on providing high-quality output specific to your role.
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
) -> str:
    """
    Generate mandatory instructions for a conversation.

    Args:
        role_id: The detected role (e.g., "role-engineer")
        is_web_app_task: Whether this is a web app development task

    Returns:
        Formatted instructions string for conversation_instructions
    """
    role_name, role_title, role_instructions = load_role_content(role_id)

    if is_web_app_task:
        template = VIBE_CODING_INSTRUCTIONS
    else:
        template = NON_WEB_APP_INSTRUCTIONS

    instructions = template.format(
        role_name=role_name,
        role_title=role_title,
        role_instructions=role_instructions[:2000],  # Limit size
    )

    logger.info(
        f'[VibeCoding] Generated instructions: '
        f'role={role_id}, web_app={is_web_app_task}, '
        f'length={len(instructions)}'
    )

    return instructions.strip()
