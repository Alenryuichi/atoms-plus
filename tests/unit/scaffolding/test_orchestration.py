from __future__ import annotations

import pytest

from atoms_plus.scaffolding.models import PackageManager, UILibrary
from atoms_plus.scaffolding.orchestration import ScaffoldingOrchestrator


def test_resolve_launch_config_applies_preset_defaults() -> None:
    resolution = ScaffoldingOrchestrator.resolve_launch_config(
        {
            "preset_id": "saas-starter",
            "project_name": "launchpad",
        }
    )

    assert resolution.preset is not None
    assert resolution.preset.id == "saas-starter"
    assert resolution.template.id == "nextjs-app-router"
    assert resolution.config.description == (
        "A SaaS starter with auth, dashboard, and polished landing pages."
    )
    assert resolution.config.ui_library == UILibrary.SHADCN
    assert resolution.config.package_manager == PackageManager.PNPM


def test_resolve_launch_config_rejects_unsupported_ui_library() -> None:
    with pytest.raises(ValueError, match="UI library primevue is not supported"):
        ScaffoldingOrchestrator.resolve_launch_config(
            {
                "template_id": "nextjs-app-router",
                "project_name": "marketing-site",
                "ui_library": "primevue",
            }
        )
