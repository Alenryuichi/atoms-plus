# Team Mode Test Configuration
"""
pytest configuration for Team Mode tests.

Skips tests if langgraph is not installed.
"""

import pytest

# Check if langgraph is available
try:
    import langgraph  # noqa: F401

    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False

# Check if litellm is available
try:
    import litellm  # noqa: F401

    LITELLM_AVAILABLE = True
except ImportError:
    LITELLM_AVAILABLE = False


def pytest_configure(config):
    """Register custom markers."""
    config.addinivalue_line(
        'markers', 'requires_langgraph: mark test as requiring langgraph'
    )
    config.addinivalue_line(
        'markers', 'requires_litellm: mark test as requiring litellm'
    )


def pytest_collection_modifyitems(config, items):
    """Skip tests if dependencies are not available."""
    if not LANGGRAPH_AVAILABLE:
        skip_langgraph = pytest.mark.skip(
            reason='langgraph not installed (requires Python 3.12+)'
        )
        for item in items:
            if 'test_team_mode' in str(item.fspath):
                item.add_marker(skip_langgraph)

    if not LITELLM_AVAILABLE:
        skip_litellm = pytest.mark.skip(
            reason='litellm not installed (requires Python 3.12+)'
        )
        for item in items:
            if 'test_nodes' in str(item.fspath):
                item.add_marker(skip_litellm)
