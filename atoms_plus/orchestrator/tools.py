# Atoms Plus - delegate_to_role 工具定义
"""
Tool definition for delegating tasks to specific roles.
This allows Team Leader to dispatch subtasks to other role-based agents.

Note: Roles are now defined as microagents in .openhands/microagents/role-*.md
"""

from __future__ import annotations

from litellm import ChatCompletionToolParam, ChatCompletionToolParamFunctionChunk

# Available roles (matching microagent names in .openhands/microagents/role-*.md)
AVAILABLE_ROLES = [
    'team_leader',
    'product_manager',
    'architect',
    'project_manager',
    'engineer',
    'data_analyst',
    'researcher',
    'seo_specialist',
]

_DELEGATE_DESCRIPTION = """Delegate a subtask to a specialized role agent.

Use this when you (as Team Leader) need to assign work to a team member with specific expertise.
Each role has specialized knowledge and capabilities:

- team_leader: Coordinates team, breaks down tasks, reviews deliverables
- product_manager: Defines requirements, user stories, acceptance criteria
- architect: Designs system architecture, technical decisions, patterns
- project_manager: Plans timelines, tracks progress, manages risks
- engineer: Implements code, writes tests, fixes bugs
- data_analyst: Analyzes data, creates visualizations, writes queries
- deep_researcher: Conducts research, gathers information, writes reports
- seo_specialist: Optimizes content, analyzes keywords, improves visibility

The delegated agent will work on the subtask and return results.
"""

DelegateToRoleTool = ChatCompletionToolParam(
    type='function',
    function=ChatCompletionToolParamFunctionChunk(
        name='delegate_to_role',
        description=_DELEGATE_DESCRIPTION,
        parameters={
            'type': 'object',
            'properties': {
                'role': {
                    'type': 'string',
                    'description': 'The role to delegate the task to.',
                    'enum': AVAILABLE_ROLES,
                },
                'task': {
                    'type': 'string',
                    'description': 'The specific subtask to delegate. Be clear and specific about what needs to be done.',
                },
                'context': {
                    'type': 'string',
                    'description': 'Additional context or requirements for the subtask. Include relevant information the role needs.',
                },
                'expected_output': {
                    'type': 'string',
                    'description': 'What you expect the role to deliver (e.g., "code implementation", "architecture diagram", "requirements document").',
                },
            },
            'required': ['role', 'task'],
        },
    ),
)


def create_delegate_to_role_tool() -> ChatCompletionToolParam:
    """Create the delegate_to_role tool with current available roles."""
    return DelegateToRoleTool

