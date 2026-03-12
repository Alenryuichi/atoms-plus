# Atoms Plus Scaffolding - API Routes
"""
FastAPI routes for project scaffolding.
"""

from __future__ import annotations

import asyncio
from typing import Any
from uuid import UUID

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from atoms_plus.scaffolding.models import FeatureSet, ProjectType, UILibrary
from atoms_plus.scaffolding.orchestration import ScaffoldingOrchestrator
from atoms_plus.scaffolding.presets_registry import PresetRegistry
from atoms_plus.scaffolding.templates_registry import TemplateRegistry
from openhands.agent_server.models import SendMessageRequest, TextContent
from openhands.app_server.app_conversation.app_conversation_models import (
    AppConversationStartRequest,
)
from openhands.app_server.app_conversation.app_conversation_service import (
    AppConversationService,
)
from openhands.app_server.config import (
    depends_app_conversation_service,
    depends_db_session,
    depends_httpx_client,
)
from openhands.app_server.services.db_session_injector import set_db_session_keep_open
from openhands.app_server.services.httpx_client_injector import (
    set_httpx_client_keep_open,
)

router = APIRouter(prefix="/scaffolding", tags=["scaffolding"])
app_conversation_service_dependency = depends_app_conversation_service()
db_session_dependency = depends_db_session()
httpx_client_dependency = depends_httpx_client()


class CreateProjectRequest(BaseModel):
    """Request body for standalone project creation."""

    name: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    project_type: str = Field(
        ..., description="Project type: react-vite, nextjs, vue-vite, nuxt"
    )
    template_id: str | None = Field(
        default=None,
        description="Optional base template id, e.g. react-vite-ts",
    )
    preset_id: str | None = Field(default=None, description="Optional preset id")
    ui_library: str = Field(
        default="tailwind",
        description="UI library: tailwind, shadcn, primevue, none",
    )
    features: list[str] = Field(default_factory=list, description="Features to include")
    description: str = Field(default="", max_length=500)
    author: str = Field(default="")
    package_manager: str = Field(default="npm", pattern=r"^(npm|pnpm|yarn|bun)$")
    supabase_url: str = Field(default="")
    supabase_anon_key: str = Field(default="")


class CreateProjectResponse(BaseModel):
    """Response for standalone project creation."""

    success: bool
    project_path: str
    files_created: list[str]
    generated_files: list[str]
    errors: list[str]
    warnings: list[str]
    next_steps: list[str]
    template_id: str | None = None
    preset_id: str | None = None


class LaunchProjectRequest(BaseModel):
    """Request body for launch-to-workspace flow."""

    preset_id: str | None = Field(default=None)
    template_id: str | None = Field(default=None)
    project_name: str = Field(
        ..., min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$"
    )
    description: str = Field(default="", max_length=500)
    author: str = Field(default="")
    ui_library: str | None = Field(default=None)
    features: list[str] | None = Field(default=None)
    package_manager: str | None = Field(default=None, pattern=r"^(npm|pnpm|yarn|bun)$")
    supabase_url: str = Field(default="")
    supabase_anon_key: str = Field(default="")
    initial_message: str | None = Field(default=None)
    system_message_suffix: str | None = Field(default=None)
    sandbox_id: str | None = Field(default=None)
    conversation_id: UUID | None = Field(default=None)
    parent_conversation_id: UUID | None = Field(default=None)
    agent_type: str = Field(default="default", pattern=r"^(default|plan)$")
    agent_role: str | None = Field(default=None)
    llm_model: str | None = Field(default=None)


class LaunchProjectResponse(BaseModel):
    """Response for launch-to-workspace flow."""

    success: bool
    conversation_id: str
    start_task_id: str
    status: str
    detail: str | None = None
    warnings: list[str] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)
    preset_id: str | None = None
    template_id: str | None = None
    project_name: str


def _build_create_response(result: Any) -> CreateProjectResponse:
    return CreateProjectResponse(
        success=result.success,
        project_path=result.project_path,
        files_created=result.files_created,
        generated_files=result.files_created,
        errors=result.errors,
        warnings=result.warnings,
        next_steps=result.next_steps,
        template_id=result.template_id,
        preset_id=result.preset_id,
    )


def _build_launch_initial_message(
    request: LaunchProjectRequest,
    preset_title: str | None,
) -> SendMessageRequest:
    if request.initial_message:
        text = request.initial_message
    else:
        template_label = preset_title or request.template_id or "starter template"
        text = (
            f"The starter project `{request.project_name}` has already been scaffolded "
            f"in the workspace using the `{template_label}` template. Review the "
            "generated files, install dependencies if needed, start the local dev "
            "server so preview becomes available, then briefly summarize what was "
            "created and wait for the user's next instruction."
        )

    return SendMessageRequest(role="user", content=[TextContent(text=text)])


async def _consume_remaining(
    async_iter,
    db_session: AsyncSession,
    httpx_client: httpx.AsyncClient,
) -> None:
    try:
        async for _ in async_iter:
            pass
    finally:
        await db_session.close()
        await httpx_client.aclose()


@router.get("/templates")
async def list_templates() -> dict[str, Any]:
    """List all available base templates."""
    templates = TemplateRegistry.list_all()
    return {
        "templates": [template.to_dict() for template in templates],
        "total": len(templates),
    }


@router.get("/templates/{template_id}")
async def get_template(template_id: str) -> dict[str, Any]:
    """Get details for a specific base template."""
    template = TemplateRegistry.get(template_id)
    if not template:
        raise HTTPException(status_code=404, detail=f"Template not found: {template_id}")
    return template.to_dict()


@router.get("/presets")
async def list_presets() -> dict[str, Any]:
    """List homepage business presets."""
    presets = PresetRegistry.list_all()
    return {
        "presets": [preset.to_dict() for preset in presets],
        "total": len(presets),
    }


@router.get("/project-types")
async def list_project_types() -> dict[str, Any]:
    """List all supported project types."""
    return {
        "project_types": [
            {"id": project_type.value, "name": project_type.name.replace("_", " ").title()}
            for project_type in ProjectType
        ]
    }


@router.get("/ui-libraries")
async def list_ui_libraries() -> dict[str, Any]:
    """List all supported UI libraries."""
    return {
        "ui_libraries": [
            {"id": library.value, "name": library.name.replace("_", " ").title()}
            for library in UILibrary
        ]
    }


@router.get("/features")
async def list_features() -> dict[str, Any]:
    """List all available features."""
    return {
        "features": [
            {"id": feature.value, "name": feature.name.replace("_", " ").title()}
            for feature in FeatureSet
        ]
    }


@router.post("/create", response_model=CreateProjectResponse)
async def create_project(request: CreateProjectRequest) -> CreateProjectResponse:
    """Create a project in a standalone local directory."""
    try:
        resolution = ScaffoldingOrchestrator.resolve_launch_config(
            {
                "project_name": request.name,
                "project_type": request.project_type,
                "template_id": request.template_id,
                "preset_id": request.preset_id,
                "ui_library": request.ui_library,
                "features": request.features,
                "description": request.description,
                "author": request.author,
                "package_manager": request.package_manager,
                "supabase_url": request.supabase_url,
                "supabase_anon_key": request.supabase_anon_key,
            }
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    result = ScaffoldingOrchestrator.generate_project(
        resolution, output_base_dir="/tmp/atoms-projects"
    )
    return _build_create_response(result)


@router.post("/launch", response_model=LaunchProjectResponse)
async def launch_project(
    http_request: Request,
    request: LaunchProjectRequest,
    db_session: AsyncSession = db_session_dependency,
    httpx_client: httpx.AsyncClient = httpx_client_dependency,
    app_conversation_service: AppConversationService = app_conversation_service_dependency,
) -> LaunchProjectResponse:
    """Launch a scaffold into a real V1 conversation workspace."""
    if request.parent_conversation_id is not None:
        raise HTTPException(
            status_code=400,
            detail="Launching a scaffold into a sub-conversation workspace is not supported yet.",
        )

    try:
        resolution = ScaffoldingOrchestrator.resolve_launch_config(
            request.model_dump()
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    start_request = AppConversationStartRequest(
        sandbox_id=request.sandbox_id,
        conversation_id=request.conversation_id,
        initial_message=_build_launch_initial_message(
            request,
            resolution.preset.title if resolution.preset else None,
        ),
        system_message_suffix=request.system_message_suffix,
        llm_model=request.llm_model,
        parent_conversation_id=request.parent_conversation_id,
        agent_type=request.agent_type,
        agent_role=request.agent_role,
        scaffold={
            "project_name": resolution.config.project_name,
            "project_type": resolution.config.project_type.value,
            "template_id": resolution.template.id,
            "preset_id": resolution.preset.id if resolution.preset else None,
            "description": resolution.config.description,
            "author": request.author,
            "ui_library": resolution.config.ui_library.value,
            "features": [feature.value for feature in resolution.config.features],
            "package_manager": resolution.config.package_manager.value,
            "supabase_url": request.supabase_url,
            "supabase_anon_key": request.supabase_anon_key,
        },
    )

    set_db_session_keep_open(http_request.state, True)
    set_httpx_client_keep_open(http_request.state, True)

    try:
        async_iter = app_conversation_service.start_app_conversation(start_request)
        start_task = await async_iter.__anext__()
        asyncio.create_task(_consume_remaining(async_iter, db_session, httpx_client))
        return LaunchProjectResponse(
            success=True,
            conversation_id=f"task-{start_task.id}",
            start_task_id=str(start_task.id),
            status=start_task.status.value,
            detail=start_task.detail,
            preset_id=resolution.preset.id if resolution.preset else None,
            template_id=resolution.template.id,
            project_name=request.project_name,
        )
    except Exception:
        await db_session.close()
        await httpx_client.aclose()
        raise

