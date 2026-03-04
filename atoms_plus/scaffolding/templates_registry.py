# Atoms Plus Scaffolding - Template Registry
"""
Registry of available project templates.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Any

from atoms_plus.scaffolding.models import ProjectType, UILibrary


@dataclass
class TemplateInfo:
    """Information about a project template."""
    
    id: str
    name: str
    description: str
    project_type: ProjectType
    supported_ui_libraries: list[UILibrary]
    template_path: str
    preview_image: str = ""
    tags: list[str] = field(default_factory=list)
    
    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "project_type": self.project_type.value,
            "supported_ui_libraries": [lib.value for lib in self.supported_ui_libraries],
            "preview_image": self.preview_image,
            "tags": self.tags,
        }


class TemplateRegistry:
    """Registry of available project templates."""
    
    _templates: dict[str, TemplateInfo] = {}
    _templates_dir = os.path.join(os.path.dirname(__file__), "templates")
    
    @classmethod
    def register(cls, template: TemplateInfo) -> None:
        """Register a template."""
        cls._templates[template.id] = template
    
    @classmethod
    def get(cls, template_id: str) -> TemplateInfo | None:
        """Get a template by ID."""
        return cls._templates.get(template_id)
    
    @classmethod
    def get_by_type(cls, project_type: ProjectType) -> list[TemplateInfo]:
        """Get all templates for a project type."""
        return [t for t in cls._templates.values() if t.project_type == project_type]
    
    @classmethod
    def list_all(cls) -> list[TemplateInfo]:
        """List all available templates."""
        return list(cls._templates.values())
    
    @classmethod
    def get_template_path(cls, template_id: str) -> str | None:
        """Get the filesystem path for a template."""
        template = cls.get(template_id)
        if template:
            return os.path.join(cls._templates_dir, template.template_path)
        return None


# Register built-in templates
def _register_builtin_templates():
    """Register all built-in templates."""
    
    TemplateRegistry.register(TemplateInfo(
        id="react-vite-ts",
        name="React + Vite + TypeScript",
        description="Modern React app with Vite, TypeScript, and Tailwind CSS",
        project_type=ProjectType.REACT_VITE,
        supported_ui_libraries=[UILibrary.TAILWIND, UILibrary.SHADCN, UILibrary.NONE],
        template_path="react-vite-ts",
        tags=["react", "vite", "typescript", "tailwind", "starter"],
    ))
    
    TemplateRegistry.register(TemplateInfo(
        id="nextjs-app-router",
        name="Next.js 14 App Router",
        description="Next.js 14+ with App Router, TypeScript, and Tailwind CSS",
        project_type=ProjectType.NEXTJS,
        supported_ui_libraries=[UILibrary.TAILWIND, UILibrary.SHADCN, UILibrary.NONE],
        template_path="nextjs-app-router",
        tags=["nextjs", "react", "typescript", "tailwind", "ssr"],
    ))
    
    TemplateRegistry.register(TemplateInfo(
        id="vue-vite-ts",
        name="Vue 3 + Vite + TypeScript",
        description="Vue 3 app with Vite, TypeScript, and Tailwind CSS",
        project_type=ProjectType.VUE_VITE,
        supported_ui_libraries=[UILibrary.TAILWIND, UILibrary.PRIMEVUE, UILibrary.NONE],
        template_path="vue-vite-ts",
        tags=["vue", "vite", "typescript", "tailwind", "starter"],
    ))
    
    TemplateRegistry.register(TemplateInfo(
        id="nuxt3",
        name="Nuxt 3",
        description="Nuxt 3 with TypeScript and Tailwind CSS",
        project_type=ProjectType.NUXT,
        supported_ui_libraries=[UILibrary.TAILWIND, UILibrary.PRIMEVUE, UILibrary.NONE],
        template_path="nuxt3",
        tags=["nuxt", "vue", "typescript", "tailwind", "ssr"],
    ))


# Register templates on module import
_register_builtin_templates()

