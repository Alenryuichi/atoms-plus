"""Registry for homepage scaffolding presets."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from atoms_plus.scaffolding.models import (
    FeatureSet,
    PackageManager,
    PresetCategory,
    PresetDefaultConfig,
    ProjectType,
    SupportedOverrides,
    UILibrary,
)


@dataclass
class PresetInfo:
    """Business-facing preset shown on the homepage."""

    id: str
    title: str
    description: str
    category: PresetCategory
    template_id: str
    preview_image: str = ""
    tags: list[str] = field(default_factory=list)
    default_config: PresetDefaultConfig | None = None
    supported_overrides: SupportedOverrides = field(
        default_factory=SupportedOverrides
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category.value,
            "template_id": self.template_id,
            "preview_image": self.preview_image,
            "tags": self.tags,
            "default_config": (
                self.default_config.to_dict() if self.default_config else None
            ),
            "supported_overrides": self.supported_overrides.to_dict(),
        }


class PresetRegistry:
    """Registry of homepage business presets."""

    _presets: dict[str, PresetInfo] = {}

    @classmethod
    def register(cls, preset: PresetInfo) -> None:
        cls._presets[preset.id] = preset

    @classmethod
    def get(cls, preset_id: str) -> PresetInfo | None:
        return cls._presets.get(preset_id)

    @classmethod
    def list_all(cls) -> list[PresetInfo]:
        return list(cls._presets.values())


def _register_builtin_presets() -> None:
    PresetRegistry.register(
        PresetInfo(
            id="saas-starter",
            title="SaaS Starter",
            description="Authentication, dashboard shell, billing-ready foundation, and marketing pages.",
            category=PresetCategory.SAAS,
            template_id="nextjs-app-router",
            preview_image="/template-preview-saas-starter.svg",
            tags=["saas", "dashboard", "auth", "starter"],
            default_config=PresetDefaultConfig(
                project_type=ProjectType.NEXTJS,
                ui_library=UILibrary.SHADCN,
                features=[
                    FeatureSet.TYPESCRIPT,
                    FeatureSet.AUTH,
                    FeatureSet.DARK_MODE,
                    FeatureSet.RESPONSIVE,
                ],
                description="A SaaS starter with auth, dashboard, and polished landing pages.",
                package_manager=PackageManager.PNPM,
            ),
        )
    )
    PresetRegistry.register(
        PresetInfo(
            id="admin-dashboard",
            title="Admin Dashboard",
            description="Internal tooling starter with analytics widgets, CRUD surfaces, and role-oriented layout.",
            category=PresetCategory.INTERNAL,
            template_id="react-vite-ts",
            preview_image="/template-preview-admin-dashboard.svg",
            tags=["admin", "dashboard", "internal", "analytics"],
            default_config=PresetDefaultConfig(
                project_type=ProjectType.REACT_VITE,
                ui_library=UILibrary.SHADCN,
                features=[
                    FeatureSet.TYPESCRIPT,
                    FeatureSet.DARK_MODE,
                    FeatureSet.RESPONSIVE,
                    FeatureSet.TESTING,
                ],
                description="An internal admin dashboard starter with analytics and data management surfaces.",
                package_manager=PackageManager.PNPM,
            ),
        )
    )
    PresetRegistry.register(
        PresetInfo(
            id="blog",
            title="Blog",
            description="Content-driven site starter with article pages, author sections, and polished reading experience.",
            category=PresetCategory.PERSONAL,
            template_id="nextjs-app-router",
            preview_image="/template-preview-blog.svg",
            tags=["blog", "content", "writing", "seo"],
            default_config=PresetDefaultConfig(
                project_type=ProjectType.NEXTJS,
                ui_library=UILibrary.TAILWIND,
                features=[
                    FeatureSet.TYPESCRIPT,
                    FeatureSet.DARK_MODE,
                    FeatureSet.I18N,
                    FeatureSet.RESPONSIVE,
                ],
                description="A content-first blog starter with featured articles and author pages.",
                package_manager=PackageManager.NPM,
            ),
        )
    )
    PresetRegistry.register(
        PresetInfo(
            id="portfolio",
            title="Portfolio",
            description="Personal showcase with hero storytelling, selected work, and contact sections.",
            category=PresetCategory.PERSONAL,
            template_id="react-vite-ts",
            preview_image="/template-preview-portfolio.svg",
            tags=["portfolio", "personal", "showcase", "landing"],
            default_config=PresetDefaultConfig(
                project_type=ProjectType.REACT_VITE,
                ui_library=UILibrary.TAILWIND,
                features=[
                    FeatureSet.TYPESCRIPT,
                    FeatureSet.DARK_MODE,
                    FeatureSet.RESPONSIVE,
                ],
                description="A polished portfolio starter for showcasing work, testimonials, and contact info.",
                package_manager=PackageManager.NPM,
            ),
        )
    )


_register_builtin_presets()
