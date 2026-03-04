# Atoms Plus Scaffolding System
"""
Project scaffolding module for generating frontend projects.

Supports:
- React + Vite + TypeScript + Tailwind
- Next.js 14+ (App Router)
- Vue 3 + Vite
- Nuxt 3
"""

from atoms_plus.scaffolding.generator import ProjectGenerator
from atoms_plus.scaffolding.templates_registry import TemplateRegistry
from atoms_plus.scaffolding.models import (
    ProjectConfig,
    ProjectType,
    UILibrary,
    FeatureSet,
    GenerationResult,
)

__all__ = [
    "ProjectGenerator",
    "TemplateRegistry",
    "ProjectConfig",
    "ProjectType",
    "UILibrary",
    "FeatureSet",
    "GenerationResult",
]

