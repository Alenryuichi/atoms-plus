# Atoms Plus - Project Graph
"""
Project Graph module for structured project understanding.

Inspired by MiroFish's GraphRAG approach, this module extracts
structured project information from user descriptions to guide
code generation.
"""

from atoms_plus.project_graph.generator import generate_project_graph
from atoms_plus.project_graph.models import (
    Entity,
    EntityType,
    ProjectGraph,
    Relation,
    RelationType,
    TechStack,
)

__all__ = [
    'Entity',
    'EntityType',
    'ProjectGraph',
    'Relation',
    'RelationType',
    'TechStack',
    'generate_project_graph',
]
