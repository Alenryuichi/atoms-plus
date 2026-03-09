# Atoms Plus - Project Graph Models
"""
Data models for project graph representation.

Inspired by MiroFish's ontology_generator.py, these models represent
the structured understanding of a project extracted from user descriptions.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class EntityType(str, Enum):
    """Types of entities in a project graph."""

    PAGE = 'page'  # UI pages/routes
    COMPONENT = 'component'  # Reusable UI components
    API = 'api'  # API endpoints
    MODEL = 'model'  # Data models/schemas
    SERVICE = 'service'  # Business logic services
    HOOK = 'hook'  # React hooks or composables
    STORE = 'store'  # State management stores
    UTIL = 'util'  # Utility functions


class RelationType(str, Enum):
    """Types of relationships between entities."""

    CONTAINS = 'contains'  # Page contains Component
    USES = 'uses'  # Component uses Hook
    CALLS = 'calls'  # Page calls API
    MANAGES = 'manages'  # Store manages Model
    EXTENDS = 'extends'  # Component extends Component
    DEPENDS_ON = 'depends_on'  # Generic dependency


@dataclass
class Entity:
    """An entity in the project graph."""

    name: str
    type: EntityType
    description: str = ''
    properties: list[str] = field(default_factory=list)  # For models
    methods: list[str] = field(default_factory=list)  # For services/APIs

    def to_dict(self) -> dict[str, Any]:
        return {
            'name': self.name,
            'type': self.type.value,
            'description': self.description,
            'properties': self.properties,
            'methods': self.methods,
        }


@dataclass
class Relation:
    """A relationship between two entities."""

    source: str  # Entity name
    target: str  # Entity name
    type: RelationType
    label: str = ''  # Optional label (e.g., "fetches", "renders")

    def to_dict(self) -> dict[str, Any]:
        return {
            'source': self.source,
            'target': self.target,
            'type': self.type.value,
            'label': self.label,
        }


@dataclass
class TechStack:
    """Recommended technology stack for the project."""

    framework: str = 'React'  # React, Vue, Next.js, Nuxt
    language: str = 'TypeScript'
    styling: str = 'Tailwind CSS'
    state_management: str = 'React hooks'  # Redux, Zustand, Pinia
    backend: str | None = None  # Supabase, Firebase, Express
    database: str | None = None  # PostgreSQL, MongoDB
    ui_library: str | None = None  # shadcn/ui, Radix, PrimeVue

    def to_dict(self) -> dict[str, Any]:
        return {
            'framework': self.framework,
            'language': self.language,
            'styling': self.styling,
            'state_management': self.state_management,
            'backend': self.backend,
            'database': self.database,
            'ui_library': self.ui_library,
        }


@dataclass
class ProjectGraph:
    """Complete project graph with entities, relations, and tech stack."""

    name: str
    description: str
    entities: list[Entity] = field(default_factory=list)
    relations: list[Relation] = field(default_factory=list)
    tech_stack: TechStack = field(default_factory=TechStack)
    features: list[str] = field(default_factory=list)  # Key features to implement

    def to_dict(self) -> dict[str, Any]:
        return {
            'name': self.name,
            'description': self.description,
            'entities': [e.to_dict() for e in self.entities],
            'relations': [r.to_dict() for r in self.relations],
            'tech_stack': self.tech_stack.to_dict(),
            'features': self.features,
        }

    def to_prompt_context(self) -> str:
        """Generate a structured prompt context from the graph."""
        lines = []
        lines.append(f'📊 PROJECT: {self.name}')
        lines.append(f'📝 Description: {self.description}')
        lines.append('')

        # Tech Stack
        ts = self.tech_stack
        lines.append('🛠️ TECH STACK:')
        lines.append(f'  - Framework: {ts.framework}')
        lines.append(f'  - Language: {ts.language}')
        lines.append(f'  - Styling: {ts.styling}')
        if ts.backend:
            lines.append(f'  - Backend: {ts.backend}')
        if ts.ui_library:
            lines.append(f'  - UI Library: {ts.ui_library}')
        lines.append('')

        # Features
        if self.features:
            lines.append('✨ KEY FEATURES:')
            for feat in self.features:
                lines.append(f'  - {feat}')
            lines.append('')

        # Entities grouped by type
        if self.entities:
            lines.append('📦 PROJECT STRUCTURE:')
            by_type: dict[EntityType, list[Entity]] = {}
            for e in self.entities:
                by_type.setdefault(e.type, []).append(e)

            for etype, ents in by_type.items():
                lines.append(f'  [{etype.value.upper()}S]')
                for e in ents:
                    desc = f' - {e.description}' if e.description else ''
                    lines.append(f'    • {e.name}{desc}')
            lines.append('')

        # Relations (simplified)
        if self.relations:
            lines.append('🔗 RELATIONSHIPS:')
            for r in self.relations:
                label = f' ({r.label})' if r.label else ''
                lines.append(f'  {r.source} → {r.type.value} → {r.target}{label}')

        return '\n'.join(lines)
