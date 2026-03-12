# Atoms Plus Scaffolding - Project Generator
"""
Core project generator using Jinja2 templates.
"""

from __future__ import annotations

import logging
import os
import shutil
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from atoms_plus.scaffolding.models import (
    GenerationResult,
    ProjectConfig,
    ProjectType,
)
from atoms_plus.scaffolding.templates_registry import TemplateRegistry

logger = logging.getLogger(__name__)


class ProjectGenerator:
    """
    Generate complete frontend projects from templates.
    
    Uses Jinja2 for template rendering with support for:
    - Variable substitution in file content
    - Conditional file inclusion
    - Dynamic file/folder naming
    """
    
    TEMPLATE_EXTENSION = ".jinja"
    
    def __init__(self, output_base_dir: str = "/tmp/atoms-projects"):
        """
        Initialize the project generator.
        
        Args:
            output_base_dir: Base directory for generated projects
        """
        self.output_base_dir = output_base_dir
        os.makedirs(output_base_dir, exist_ok=True)
    
    def generate(self, config: ProjectConfig) -> GenerationResult:
        """
        Generate a project from configuration.
        
        Args:
            config: Project configuration
            
        Returns:
            GenerationResult with status and file list
        """
        # Get template info
        template_id = config.template_id or self._get_template_id(config.project_type)
        template_path = TemplateRegistry.get_template_path(template_id)
        
        if not template_path or not os.path.exists(template_path):
            return GenerationResult(
                success=False,
                project_path="",
                errors=[f"Template not found: {template_id}"],
            )
        
        # Create output directory
        project_path = os.path.join(self.output_base_dir, config.name)
        if os.path.exists(project_path):
            shutil.rmtree(project_path)
        os.makedirs(project_path, exist_ok=True)
        
        # Setup Jinja2 environment
        env = Environment(
            loader=FileSystemLoader(template_path),
            autoescape=select_autoescape(default=False),
            keep_trailing_newline=True,
        )
        
        # Get template context
        context = config.to_template_context()
        
        # Process template files
        files_created = []
        errors = []
        warnings = []
        
        try:
            files_created = self._process_template_dir(
                template_path, project_path, env, context, errors, warnings
            )
        except Exception as e:
            logger.exception(f"Error generating project: {e}")
            errors.append(str(e))
            return GenerationResult(
                success=False,
                project_path=project_path,
                files_created=files_created,
                errors=errors,
                warnings=warnings,
            )
        
        # Generate next steps
        next_steps = self._generate_next_steps(config, project_path)
        
        return GenerationResult(
            success=len(errors) == 0,
            project_path=project_path,
            files_created=files_created,
            errors=errors,
            warnings=warnings,
            next_steps=next_steps,
            template_id=template_id,
        )
    
    def _get_template_id(self, project_type: ProjectType) -> str:
        """Map project type to template ID."""
        mapping = {
            ProjectType.REACT_VITE: "react-vite-ts",
            ProjectType.NEXTJS: "nextjs-app-router",
            ProjectType.VUE_VITE: "vue-vite-ts",
            ProjectType.NUXT: "nuxt3",
        }
        return mapping.get(project_type, "react-vite-ts")
    
    def _process_template_dir(
        self,
        template_dir: str,
        output_dir: str,
        env: Environment,
        context: dict,
        errors: list[str],
        warnings: list[str],
    ) -> list[str]:
        """Process all files in template directory."""
        files_created = []
        
        for root, dirs, files in os.walk(template_dir):
            # Calculate relative path
            rel_root = os.path.relpath(root, template_dir)
            
            # Skip hidden directories and __pycache__
            dirs[:] = [d for d in dirs if not d.startswith(".") and d != "__pycache__"]

            # Render directory name if it contains template variables
            if rel_root != ".":
                rendered_rel_root = self._render_string(rel_root, context)
                target_dir = os.path.join(output_dir, rendered_rel_root)
            else:
                target_dir = output_dir

            os.makedirs(target_dir, exist_ok=True)

            for filename in files:
                # Skip meta files
                if filename in ["copier.yml", "copier.yaml", ".gitkeep"]:
                    continue

                src_path = os.path.join(root, filename)

                # Handle jinja template files
                if filename.endswith(self.TEMPLATE_EXTENSION):
                    output_filename = filename[: -len(self.TEMPLATE_EXTENSION)]
                    output_filename = self._render_string(output_filename, context)

                    try:
                        rel_template_path = os.path.relpath(src_path, template_dir)
                        template = env.get_template(rel_template_path)
                        content = template.render(**context)

                        dest_path = os.path.join(target_dir, output_filename)
                        with open(dest_path, "w", encoding="utf-8") as f:
                            f.write(content)
                        files_created.append(os.path.relpath(dest_path, output_dir))
                    except Exception as e:
                        errors.append(f"Error rendering {filename}: {e}")
                else:
                    # Copy non-template files directly
                    output_filename = self._render_string(filename, context)
                    dest_path = os.path.join(target_dir, output_filename)
                    shutil.copy2(src_path, dest_path)
                    files_created.append(os.path.relpath(dest_path, output_dir))

        return files_created

    def _render_string(self, s: str, context: dict) -> str:
        """Render template variables in a string (like filenames)."""
        if "{{" not in s:
            return s
        env = Environment()
        template = env.from_string(s)
        return template.render(**context)

    def _generate_next_steps(self, config: ProjectConfig, project_path: str) -> list[str]:
        """Generate next steps instructions."""
        pm = config.package_manager
        steps = [
            f"cd {project_path}",
            f"{pm} install",
        ]

        if config.project_type == ProjectType.NEXTJS:
            steps.append(f"{pm} run dev")
        elif config.project_type == ProjectType.NUXT:
            steps.append(f"{pm} run dev")
        else:
            steps.append(f"{pm} run dev")

        return steps

