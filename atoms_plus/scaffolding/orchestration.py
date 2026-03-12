"""Scaffolding orchestration for preset resolution and workspace application."""

from __future__ import annotations

import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from atoms_plus.scaffolding.generator import ProjectGenerator
from atoms_plus.scaffolding.models import (
    FeatureSet,
    GenerationResult,
    LaunchConfig,
    PackageManager,
    ProjectType,
    UILibrary,
)
from atoms_plus.scaffolding.presets_registry import PresetInfo, PresetRegistry
from atoms_plus.scaffolding.templates_registry import TemplateInfo, TemplateRegistry


@dataclass
class LaunchResolution:
    """Resolved preset/template/config trio for launch or create requests."""

    config: LaunchConfig
    template: TemplateInfo
    preset: PresetInfo | None = None


class ScaffoldingOrchestrator:
    """Resolve scaffolding launch requests and apply them to workspaces."""

    @staticmethod
    def _parse_ui_library(value: str | None, fallback: UILibrary) -> UILibrary:
        if value is None:
            return fallback
        return UILibrary(value)

    @staticmethod
    def _parse_package_manager(
        value: str | None, fallback: PackageManager
    ) -> PackageManager:
        if value is None:
            return fallback
        return PackageManager(value)

    @staticmethod
    def _parse_features(
        values: list[str] | None,
        fallback: list[FeatureSet],
    ) -> list[FeatureSet]:
        if values is None:
            return list(fallback)
        return [FeatureSet(value) for value in values]

    @classmethod
    def resolve_launch_config(cls, payload: dict[str, Any]) -> LaunchResolution:
        preset_id = payload.get("preset_id")
        preset = PresetRegistry.get(preset_id) if preset_id else None
        if preset_id and preset is None:
            raise ValueError(f"Preset not found: {preset_id}")

        template_id = payload.get("template_id") or (
            preset.template_id if preset else None
        )
        template: TemplateInfo | None = None
        if template_id:
            template = TemplateRegistry.get(template_id)
            if template is None:
                raise ValueError(f"Template not found: {template_id}")
        else:
            project_type_value = payload.get("project_type")
            if not project_type_value:
                raise ValueError("template_id, preset_id, or project_type is required")

            project_type = ProjectType(project_type_value)
            templates = TemplateRegistry.get_by_type(project_type)
            if not templates:
                raise ValueError(f"No template registered for project type: {project_type.value}")
            template = templates[0]

        default_config = (
            preset.default_config if preset and preset.default_config else None
        )

        ui_library = cls._parse_ui_library(
            payload.get("ui_library"),
            default_config.ui_library if default_config else UILibrary.TAILWIND,
        )
        package_manager = cls._parse_package_manager(
            payload.get("package_manager"),
            default_config.package_manager if default_config else PackageManager.NPM,
        )
        features = cls._parse_features(
            payload.get("features"),
            default_config.features if default_config else [FeatureSet.TYPESCRIPT],
        )

        project_type = template.project_type
        if ui_library not in template.supported_ui_libraries:
            raise ValueError(
                f"UI library {ui_library.value} is not supported by {template.id}"
            )

        project_name = payload.get("project_name") or payload.get("name")
        if not project_name:
            raise ValueError("project_name is required")

        description = payload.get("description")
        if not description and default_config:
            description = default_config.description

        config = LaunchConfig(
            project_name=project_name,
            project_type=ProjectType(project_type),
            template_id=template.id,
            preset_id=preset.id if preset else None,
            description=description or "",
            author=payload.get("author", ""),
            ui_library=ui_library,
            features=features,
            package_manager=package_manager,
            supabase_url=payload.get("supabase_url", ""),
            supabase_anon_key=payload.get("supabase_anon_key", ""),
        )

        return LaunchResolution(config=config, template=template, preset=preset)

    @staticmethod
    def generate_project(
        resolution: LaunchResolution, output_base_dir: str
    ) -> GenerationResult:
        generator = ProjectGenerator(output_base_dir=output_base_dir)
        result = generator.generate(resolution.config.to_project_config())
        result.template_id = resolution.template.id
        result.preset_id = resolution.preset.id if resolution.preset else None
        return result

    @classmethod
    async def apply_to_workspace(
        cls,
        workspace: Any,
        payload: dict[str, Any],
    ) -> GenerationResult:
        resolution = cls.resolve_launch_config(payload)

        with tempfile.TemporaryDirectory(prefix="atoms-scaffold-") as temp_dir:
            result = cls.generate_project(resolution, output_base_dir=temp_dir)
            if not result.success:
                return result

            project_root = Path(result.project_path)
            for relative_path in result.files_created:
                local_path = project_root / relative_path
                remote_destination = Path(workspace.working_dir) / relative_path
                remote_parent = remote_destination.parent
                if remote_parent != Path(workspace.working_dir):
                    await workspace.execute_command(
                        f'mkdir -p "{remote_parent.as_posix()}"',
                    )
                await workspace.file_upload(
                    source_path=local_path,
                    destination_path=remote_destination.as_posix(),
                )

            result.project_path = workspace.working_dir
            result.next_steps = [
                step.replace(str(project_root), workspace.working_dir)
                for step in result.next_steps
            ]

            return result
