# Atoms Plus Scaffolding - Data Models
"""
Data models for project scaffolding configuration.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
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


class PresetCategory(str, Enum):
    """Homepage preset categories."""

    SAAS = "saas"
    ECOMMERCE = "ecommerce"
    INTERNAL = "internal"
    PERSONAL = "personal"


class PackageManager(str, Enum):
    """Supported package managers."""

    NPM = "npm"
    PNPM = "pnpm"
    YARN = "yarn"
    BUN = "bun"


@dataclass
class ProjectConfig:
    """Configuration for project generation."""
    
    name: str
    project_type: ProjectType
    template_id: str | None = None
    ui_library: UILibrary = UILibrary.TAILWIND
    features: list[FeatureSet] = field(default_factory=list)
    description: str = ""
    author: str = ""
    
    # Advanced options
    package_manager: str = PackageManager.NPM.value
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
class PresetDefaultConfig:
    """Default configuration bundled with a homepage preset."""

    project_type: ProjectType
    ui_library: UILibrary
    features: list[FeatureSet] = field(default_factory=list)
    description: str = ""
    package_manager: PackageManager = PackageManager.NPM

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["project_type"] = self.project_type.value
        payload["ui_library"] = self.ui_library.value
        payload["features"] = [feature.value for feature in self.features]
        payload["package_manager"] = self.package_manager.value
        return payload


@dataclass
class SupportedOverrides:
    """Fields that the wizard is allowed to override for a preset."""

    ui_library: bool = True
    features: bool = True
    project_name: bool = True
    description: bool = True
    package_manager: bool = True

    def to_dict(self) -> dict[str, bool]:
        return asdict(self)


@dataclass
class LaunchConfig:
    """Structured scaffold launch payload shared across API layers."""

    project_name: str
    project_type: ProjectType
    template_id: str
    preset_id: str | None = None
    description: str = ""
    author: str = ""
    ui_library: UILibrary = UILibrary.TAILWIND
    features: list[FeatureSet] = field(default_factory=list)
    package_manager: PackageManager = PackageManager.NPM
    supabase_url: str = ""
    supabase_anon_key: str = ""

    def to_project_config(self) -> ProjectConfig:
        return ProjectConfig(
            name=self.project_name,
            project_type=self.project_type,
            template_id=self.template_id,
            ui_library=self.ui_library,
            features=self.features,
            description=self.description,
            author=self.author,
            package_manager=self.package_manager.value,
            supabase_url=self.supabase_url,
            supabase_anon_key=self.supabase_anon_key,
        )


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

    template_id: str | None = None
    preset_id: str | None = None
    
    def to_dict(self) -> dict[str, Any]:
        """Convert to API response format."""
        return {
            "success": self.success,
            "project_path": self.project_path,
            "files_created": self.files_created,
            "errors": self.errors,
            "warnings": self.warnings,
            "next_steps": self.next_steps,
            "template_id": self.template_id,
            "preset_id": self.preset_id,
        }

