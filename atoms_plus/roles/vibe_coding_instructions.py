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
   Step 1: Scaffold the project with a starter that matches the requested framework. Use React + Vite only as the default when no other framework is specified
   Step 2: Run `npm install` and align the file structure with the canonical layout for the selected framework
   Step 3: If styling is needed, keep the CSS tooling consistent with the installed version and framework conventions
   Step 4: Implement ALL entities and features from the PROJECT GRAPH
   Step 5: Run `npm run build` and fix every build error before claiming success
   Step 6: Start the app with the provided worker port environment variables, bind to `0.0.0.0`, and verify the preview
   Step 7: Report the actual preview URL that matches the running port

3. SMART DEFAULTS (override with project graph if provided):
   - Framework: React + Vite
   - Language: TypeScript
   - Styling: Tailwind CSS
   - State: React hooks (useState, useReducer)

4. STACK-SPECIFIC IMPLEMENTATION RULES:
{stack_guidance}

5. PORT AND PREVIEW RULES:
   - Use `PORT` as the default primary preview port for the main web app
   - Use the provided worker port environment variables (`$WORKER_2`, etc.) only when you intentionally need additional services beyond the main preview app
   - `PORT` already points to the primary isolated preview port. Do not probe unrelated ports and do not hard-code `5173`, `3000`, or `8080`
   - Bind dev servers to `0.0.0.0`
   - The reported preview URL must use the same port that the app is actually listening on

6. TERMINAL EXECUTION RULES:
   - Never rely on the previous command's working directory. If a command must run inside the project folder, include `cd project-dir && ...` in that same command or use absolute paths
   - Avoid interactive scaffolding flows. Use non-interactive commands and explicit flags whenever possible
   - If a scaffold command prompts unexpectedly, cancel it and rerun with a non-interactive command instead of continuing with a half-created project

7. DONE MEANS VERIFIED:
   - Do not finish after only seeing `npm run dev` logs
   - Do not finish if Vite/Next.js shows import errors, CSS errors, module resolution errors, or 500 responses
   - Verify the requested headline/content is actually rendered in the preview, not just present in source files

❌ FORBIDDEN BEHAVIORS:
- Responding with only text explanations
- Asking more than 1-2 clarifying questions
- Creating documentation without code
- Leaving the project in a non-runnable state
- Ignoring the project graph structure
- Reporting a preview URL that does not match the actual running server
- Declaring success before `npm run build` passes

✅ SUCCESS CRITERIA:
- A running dev server bound to the provided isolated worker port
- `npm run build` passes without errors
- All entities from project graph implemented
- All features listed in project graph working
- Preview URL reported to the user
- Preview loads without module/CSS/runtime import failures

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


def _build_stack_guidance(project_graph: 'ProjectGraph | None') -> str:
    framework = 'react'
    styling = 'tailwind css'

    if project_graph is not None:
        framework = project_graph.tech_stack.framework.lower()
        styling = project_graph.tech_stack.styling.lower()

    lines = [
        '   - Respect the framework selected by the project graph when one is provided. Do not force React/Vite if the project graph asks for Vue, Next.js, or Nuxt.',
        '   - Keep the CSS/tooling setup internally consistent with the installed package versions. Do not mix incompatible Tailwind/PostCSS/plugin patterns.',
    ]

    if 'next' in framework:
        lines.extend(
            [
                '   - For Next.js projects, use Next.js file conventions and start the app with a Next-compatible dev command rather than creating a Vite app.',
                '   - Keep routing/layout files consistent with the selected Next.js structure and verify the requested page renders without module or CSS errors.',
            ]
        )
    elif 'nuxt' in framework:
        lines.extend(
            [
                '   - For Nuxt projects, use Nuxt file conventions, routing, and startup commands. Do not fall back to a plain Vue or Vite scaffold.',
                '   - Keep pages, layouts, components, and CSS configuration consistent with the selected Nuxt structure.',
            ]
        )
    elif 'vue' in framework:
        lines.extend(
            [
                '   - For Vue projects, use Vue file conventions and imports. Do not generate React-only files like `src/main.tsx` or `src/App.tsx` unless the project graph explicitly calls for React.',
                '   - Keep component imports, router setup, and CSS conventions aligned with the selected Vue-based framework.',
            ]
        )
    else:
        lines.extend(
            [
                '   - For React + Vite projects, follow the canonical file shape: `src/main.tsx`, `src/App.tsx`, `src/pages/HomePage.tsx`, `src/components/*`, `src/index.css`.',
                '   - `src/main.tsx` must import `./index.css` and render `<App />`.',
                '   - `src/App.tsx` should import pages with paths like `./pages/HomePage`.',
                '   - Files inside `src/pages/` must import shared components via `../components/...`, not `./components/...`.',
                '   - If you use Vite scaffolding, run it with the real non-interactive flag, for example `npm create vite@latest app -- --template react-ts --no-interactive`. Do not rely on `--yes` for create-vite.',
            ]
        )

    if 'tailwind' in styling:
        lines.append(
            '   - If you use Tailwind CSS, keep the setup coherent for the installed major version and verify the preview has no CSS build/runtime errors before finishing.'
        )

    return '\n'.join(lines)


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
    stack_guidance = _build_stack_guidance(project_graph if is_web_app_task else None)

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
        stack_guidance=stack_guidance,
    )

    logger.info(
        f'[VibeCoding] Generated instructions: '
        f'role={role_id}, web_app={is_web_app_task}, '
        f'graph={project_graph is not None}, '
        f'length={len(instructions)}'
    )

    return instructions.strip()
