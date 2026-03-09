"""Deep Research module for Atoms Plus (深度研究模块).

Provides multi-round search, summarization, and reflection to generate
comprehensive research reports.

Usage:
    from atoms_plus.deep_research import deep_research_async, ResearchRequest

    response = await deep_research_async(
        query="AI Agent trends 2025",
        max_rounds=2,
    )
    print(response.report)

API Usage:
    from atoms_plus.deep_research import router
    app.include_router(router, prefix="/api/v1")
"""

from .api import router
from .models import (
    Language,
    ReportSection,
    ReportStructure,
    ResearchProgress,
    ResearchRequest,
    ResearchResponse,
    SearchEngine,
    SearchResult,
    SectionResult,
)
from .research import deep_research_async
from .search import DashScopeSearch, TavilySearch, get_search_engine
from .search import SearchEngine as SearchEngineBase

__all__ = [
    # Router
    'router',
    # Main function
    'deep_research_async',
    # Enums
    'SearchEngine',
    'Language',
    # Request/Response
    'ResearchRequest',
    'ResearchResponse',
    'SectionResult',
    # Progress
    'ResearchProgress',
    # Internal structures
    'ReportSection',
    'ReportStructure',
    'SearchResult',
    # Search engines
    'SearchEngineBase',
    'TavilySearch',
    'DashScopeSearch',
    'get_search_engine',
]
