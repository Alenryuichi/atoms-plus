# Tests for atoms_plus.team_mode.graph
"""Unit tests for Team Mode LangGraph construction."""

import pytest

from atoms_plus.team_mode.graph import (
    compile_team_graph,
    create_team_graph,
    get_sqlite_checkpointer,
)


class TestCreateTeamGraph:
    """Tests for graph creation."""

    def test_creates_graph_successfully(self):
        """Should create a StateGraph without errors."""
        graph = create_team_graph()
        assert graph is not None

    def test_graph_has_required_nodes(self):
        """Graph should have all MVP nodes."""
        graph = create_team_graph()

        # Check nodes exist in the graph
        # LangGraph stores nodes in _nodes dict
        node_names = set(graph.nodes.keys())

        assert 'pm' in node_names
        assert 'architect' in node_names
        assert 'engineer' in node_names
        assert 'architect_review' in node_names


class TestCompileTeamGraph:
    """Tests for graph compilation."""

    def test_compiles_without_checkpointer(self):
        """Should compile graph without a checkpointer."""
        compiled = compile_team_graph(checkpointer=None)
        assert compiled is not None

    def test_compiled_graph_is_callable(self):
        """Compiled graph should be invokable."""
        compiled = compile_team_graph()

        # The compiled graph should have invoke and ainvoke methods
        assert hasattr(compiled, 'invoke')
        assert hasattr(compiled, 'ainvoke')
        assert hasattr(compiled, 'stream')
        assert hasattr(compiled, 'astream')


class TestSqliteCheckpointer:
    """Tests for SQLite persistence."""

    def test_get_sqlite_checkpointer_returns_saver(self):
        """Should return a SqliteSaver instance."""
        checkpointer = get_sqlite_checkpointer()
        # Should succeed since langgraph-checkpoint-sqlite is installed
        assert checkpointer is not None

    def test_compile_with_checkpointer(self):
        """Should compile graph with SQLite checkpointer."""
        checkpointer = get_sqlite_checkpointer()
        compiled = compile_team_graph(checkpointer=checkpointer)

        assert compiled is not None
        assert hasattr(compiled, 'invoke')

    @pytest.mark.asyncio
    async def test_async_checkpointer_available(self):
        """Should have async checkpointer support."""
        from atoms_plus.team_mode.graph import get_async_sqlite_checkpointer

        checkpointer = await get_async_sqlite_checkpointer()
        assert checkpointer is not None
