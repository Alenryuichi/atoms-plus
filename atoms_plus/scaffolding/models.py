# Atoms Plus Scaffolding - Data Models
"""
Data models for project scaffolding configuration.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class ProjectType(str, Enum):
    """Supported project types."""
    
    REACT_VITE = "react-vite"
    NEXTJS = "nextjs"
    VUE_VITE = "vue-vite"
    NUXT = "nuxt"


class UILibrary(str, Enum):
    """Supported UI component libraries."""
    
    TAILWIND = "tailwind"
    SHADCN = "shadcn"
    PRIMEVUE = "primevue"
    NONE = "none"


class FeatureSet(str, Enum):
    """Optional features to include."""
    
    TYPESCRIPT = "typescript"
    ESLINT = "eslint"
    PRETTIER = "prettier"
    TESTING = "testing"
    SUPABASE = "supabase"
    AUTH = "auth"
    DARK_MODE = "dark-mode"
    RESPONSIVE = "responsive"
    PWA = "pwa"
    I18N = "i18n"


@dataclass
class ProjectConfig:
    """Configuration for project generation."""
    
    name: str
    project_type: ProjectType
    ui_library: UILibrary = UILibrary.TAILWIND
    features: list[FeatureSet] = field(default_factory=list)
    description: str = ""
    author: str = ""
    
    # Advanced options
    package_manager: str = "npm"  # npm, pnpm, yarn, bun
    node_version: str = "20"
    
    # Supabase config (if enabled)
    supabase_url: str = ""
    supabase_anon_key: str = ""
    
    def to_template_context(self) -> dict[str, Any]:
        """Convert to template context for Jinja2 rendering."""
        return {
            "project_name": self.name,
            "project_name_snake": self.name.replace("-", "_").lower(),
            "project_name_pascal": "".join(
                word.capitalize() for word in self.name.replace("-", " ").replace("_", " ").split()
            ),
            "project_type": self.project_type.value,
            "ui_library": self.ui_library.value,
            "description": self.description or f"A {self.project_type.value} project",
            "author": self.author,
            "package_manager": self.package_manager,
            "node_version": self.node_version,
            
            # Feature flags
            "use_typescript": FeatureSet.TYPESCRIPT in self.features,
            "use_eslint": FeatureSet.ESLINT in self.features,
            "use_prettier": FeatureSet.PRETTIER in self.features,
            "use_testing": FeatureSet.TESTING in self.features,
            "use_supabase": FeatureSet.SUPABASE in self.features,
            "use_auth": FeatureSet.AUTH in self.features,
            "use_dark_mode": FeatureSet.DARK_MODE in self.features,
            "use_responsive": FeatureSet.RESPONSIVE in self.features,
            "use_pwa": FeatureSet.PWA in self.features,
            "use_i18n": FeatureSet.I18N in self.features,
            
            # Supabase
            "supabase_url": self.supabase_url,
            "supabase_anon_key": self.supabase_anon_key,
        }


@dataclass
class GenerationResult:
    """Result of project generation."""
    
    success: bool
    project_path: str
    files_created: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    
    # Post-generation instructions
    next_steps: list[str] = field(default_factory=list)
    
    def to_dict(self) -> dict[str, Any]:
        """Convert to API response format."""
        return {
            "success": self.success,
            "project_path": self.project_path,
            "files_created": self.files_created,
            "errors": self.errors,
            "warnings": self.warnings,
            "next_steps": self.next_steps,
        }

