# Atoms Plus - Project Graph Generator
"""
LLM-based project graph generation.

Inspired by MiroFish's ontology_generator.py, this module uses LLM
to extract structured project understanding from user descriptions.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from litellm import acompletion

from atoms_plus.project_graph.models import (
    Entity,
    EntityType,
    ProjectGraph,
    Relation,
    RelationType,
    TechStack,
)
from atoms_plus.team_mode.nodes.base import get_llm_config

logger = logging.getLogger(__name__)

# Prompt for project graph extraction
PROJECT_GRAPH_PROMPT = """You are a project architect analyzing a user's app idea.
Extract a structured project graph that will guide code generation.

User's request: "{user_input}"

Analyze and return a JSON object with this exact structure:
{{
  "name": "project-name-in-kebab-case",
  "description": "One sentence describing the app",
  "tech_stack": {{
    "framework": "React" | "Vue" | "Next.js",
    "language": "TypeScript",
    "styling": "Tailwind CSS",
    "state_management": "React hooks" | "Zustand" | "Pinia",
    "backend": null | "Supabase" | "Firebase",
    "ui_library": null | "shadcn/ui" | "Radix"
  }},
  "features": ["feature 1", "feature 2", ...],
  "entities": [
    {{
      "name": "EntityName",
      "type": "page" | "component" | "api" | "model" | "hook" | "store",
      "description": "What this entity does",
      "properties": ["prop1", "prop2"],  // For models
      "methods": ["method1"]  // For services/APIs
    }}
  ],
  "relations": [
    {{
      "source": "EntityName1",
      "target": "EntityName2",
      "type": "contains" | "uses" | "calls" | "manages",
      "label": "optional action verb"
    }}
  ]
}}

RULES:
1. Keep it minimal - only essential entities (3-8 entities)
2. Focus on UI components and data flow
3. Default to React + TypeScript + Tailwind unless user specifies otherwise
4. Include at least: 1 page, 2-3 components, 1 model (if data involved)
5. Relations should show data flow and composition

Return ONLY valid JSON, no markdown or explanation."""


async def generate_project_graph(
    user_input: str,
    model: str | None = None,
) -> ProjectGraph | None:
    """
    Generate a project graph from user input using LLM.

    Args:
        user_input: The user's project description
        model: Optional model override

    Returns:
        ProjectGraph if successful, None otherwise
    """
    if not user_input or not user_input.strip():
        logger.warning('[ProjectGraph] Empty user input')
        return None

    llm_config = get_llm_config()

    try:
        logger.info(f'[ProjectGraph] Generating graph for: {user_input[:50]}...')

        response = await acompletion(
            model=model or llm_config['model'],
            messages=[
                {
                    'role': 'user',
                    'content': PROJECT_GRAPH_PROMPT.format(user_input=user_input),
                }
            ],
            api_base=llm_config['api_base'],
            api_key=llm_config['api_key'],
            temperature=0.3,
            max_tokens=1024,
        )

        content = response.choices[0].message.content

        # Clean up markdown if present
        if content and content.strip().startswith('```'):
            lines = content.strip().split('\n')
            content = '\n'.join(
                line for line in lines if not line.strip().startswith('```')
            )

        data = json.loads(content)
        graph = _parse_graph_data(data)

        logger.info(
            f'[ProjectGraph] Generated: {graph.name}, '
            f'{len(graph.entities)} entities, {len(graph.relations)} relations'
        )

        return graph

    except json.JSONDecodeError as e:
        logger.warning(f'[ProjectGraph] Failed to parse JSON: {e}')
        return None
    except Exception as e:
        logger.error(f'[ProjectGraph] LLM call failed: {e}')
        return None


def _parse_graph_data(data: dict[str, Any]) -> ProjectGraph:
    """Parse raw JSON data into ProjectGraph model."""
    # Parse tech stack
    ts_data = data.get('tech_stack', {})
    tech_stack = TechStack(
        framework=ts_data.get('framework', 'React'),
        language=ts_data.get('language', 'TypeScript'),
        styling=ts_data.get('styling', 'Tailwind CSS'),
        state_management=ts_data.get('state_management', 'React hooks'),
        backend=ts_data.get('backend'),
        database=ts_data.get('database'),
        ui_library=ts_data.get('ui_library'),
    )

    # Parse entities
    entities = []
    for e_data in data.get('entities', []):
        try:
            entity = Entity(
                name=e_data['name'],
                type=EntityType(e_data.get('type', 'component')),
                description=e_data.get('description', ''),
                properties=e_data.get('properties', []),
                methods=e_data.get('methods', []),
            )
            entities.append(entity)
        except (KeyError, ValueError) as e:
            logger.warning(f'[ProjectGraph] Skipping invalid entity: {e}')

    # Parse relations
    relations = []
    for r_data in data.get('relations', []):
        try:
            relation = Relation(
                source=r_data['source'],
                target=r_data['target'],
                type=RelationType(r_data.get('type', 'uses')),
                label=r_data.get('label', ''),
            )
            relations.append(relation)
        except (KeyError, ValueError) as e:
            logger.warning(f'[ProjectGraph] Skipping invalid relation: {e}')

    return ProjectGraph(
        name=data.get('name', 'unnamed-project'),
        description=data.get('description', ''),
        entities=entities,
        relations=relations,
        tech_stack=tech_stack,
        features=data.get('features', []),
    )
