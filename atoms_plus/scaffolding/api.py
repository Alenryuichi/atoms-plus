# Atoms Plus Scaffolding - API Routes
"""
FastAPI routes for project scaffolding.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from atoms_plus.scaffolding.generator import ProjectGenerator
from atoms_plus.scaffolding.models import (
    FeatureSet,
    ProjectConfig,
    ProjectType,
    UILibrary,
)
from atoms_plus.scaffolding.templates_registry import TemplateRegistry

router = APIRouter(prefix="/scaffolding", tags=["scaffolding"])


class CreateProjectRequest(BaseModel):
    """Request body for project creation."""
    
    name: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    project_type: str = Field(..., description="Project type: react-vite, nextjs, vue-vite, nuxt")
    ui_library: str = Field(default="tailwind", description="UI library: tailwind, shadcn, primevue, none")
    features: list[str] = Field(default_factory=list, description="Features to include")
    description: str = Field(default="", max_length=500)
    author: str = Field(default="")
    package_manager: str = Field(default="npm", pattern=r"^(npm|pnpm|yarn|bun)$")
    
    # Optional Supabase config
    supabase_url: str = Field(default="")
    supabase_anon_key: str = Field(default="")


class TemplateResponse(BaseModel):
    """Response for template listing."""
    
    id: str
    name: str
    description: str
    project_type: str
    supported_ui_libraries: list[str]
    tags: list[str]


class CreateProjectResponse(BaseModel):
    """Response for project creation."""
    
    success: bool
    project_path: str
    files_created: list[str]
    errors: list[str]
    warnings: list[str]
    next_steps: list[str]


@router.get("/templates")
async def list_templates() -> dict[str, Any]:
    """List all available project templates."""
    templates = TemplateRegistry.list_all()
    return {
        "templates": [t.to_dict() for t in templates],
        "total": len(templates),
    }


@router.get("/templates/{template_id}")
async def get_template(template_id: str) -> dict[str, Any]:
    """Get details for a specific template."""
    template = TemplateRegistry.get(template_id)
    if not template:
        raise HTTPException(status_code=404, detail=f"Template not found: {template_id}")
    return template.to_dict()


@router.get("/project-types")
async def list_project_types() -> dict[str, Any]:
    """List all supported project types."""
    return {
        "project_types": [
            {"id": pt.value, "name": pt.name.replace("_", " ").title()}
            for pt in ProjectType
        ]
    }


@router.get("/ui-libraries")
async def list_ui_libraries() -> dict[str, Any]:
    """List all supported UI libraries."""
    return {
        "ui_libraries": [
            {"id": lib.value, "name": lib.name.replace("_", " ").title()}
            for lib in UILibrary
        ]
    }


@router.get("/features")
async def list_features() -> dict[str, Any]:
    """List all available features."""
    return {
        "features": [
            {"id": f.value, "name": f.name.replace("_", " ").title()}
            for f in FeatureSet
        ]
    }


@router.post("/create", response_model=CreateProjectResponse)
async def create_project(request: CreateProjectRequest) -> CreateProjectResponse:
    """Create a new project from template."""
    try:
        # Parse enums
        project_type = ProjectType(request.project_type)
        ui_library = UILibrary(request.ui_library)
        features = [FeatureSet(f) for f in request.features if f in [fs.value for fs in FeatureSet]]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Create config
    config = ProjectConfig(
        name=request.name,
        project_type=project_type,
        ui_library=ui_library,
        features=features,
        description=request.description,
        author=request.author,
        package_manager=request.package_manager,
        supabase_url=request.supabase_url,
        supabase_anon_key=request.supabase_anon_key,
    )
    
    # Generate project
    generator = ProjectGenerator()
    result = generator.generate(config)
    
    return CreateProjectResponse(
        success=result.success,
        project_path=result.project_path,
        files_created=result.files_created,
        errors=result.errors,
        warnings=result.warnings,
        next_steps=result.next_steps,
    )

