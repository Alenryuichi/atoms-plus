"""Search engine abstraction for Deep Research.

This module provides a unified interface for multiple search engines:
- TavilySearch: Recommended for English queries (uses Tavily API)
- DashScopeSearch: Better for Chinese queries (uses DashScope WebSearch)

The get_search_engine() factory function automatically selects
the best available search engine based on configured API keys.
"""

from __future__ import annotations

import logging
import os
from abc import ABC, abstractmethod

import httpx

from atoms_plus.deep_research.models import SearchResult

logger = logging.getLogger(__name__)


# =============================================================================
# Abstract Base Class
# =============================================================================


class SearchEngine(ABC):
    """Abstract base class for search engines."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Return the search engine name."""
        pass

    @abstractmethod
    async def search(self, query: str, max_results: int = 10) -> list[SearchResult]:
        """Execute a search query.

        Args:
            query: Search query string
            max_results: Maximum number of results to return

        Returns:
            List of SearchResult objects
        """
        pass


# =============================================================================
# Tavily Search Implementation
# =============================================================================


class TavilySearch(SearchEngine):
    """Tavily API search engine (recommended for English queries)."""

    API_URL = "https://api.tavily.com/search"

    def __init__(self):
        self.api_key = os.getenv("TAVILY_API_KEY")
        if not self.api_key:
            raise ValueError("TAVILY_API_KEY environment variable not set")

    @property
    def name(self) -> str:
        return "tavily"

    async def search(self, query: str, max_results: int = 10) -> list[SearchResult]:
        """Execute search using Tavily API."""
        logger.info(f"Tavily search: {query} (max_results={max_results})")

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    self.API_URL,
                    json={
                        "api_key": self.api_key,
                        "query": query,
                        "max_results": max_results,
                        "search_depth": "basic",
                    },
                )
                response.raise_for_status()
                data = response.json()

                results = []
                for item in data.get("results", []):
                    results.append(
                        SearchResult(
                            title=item.get("title", ""),
                            url=item.get("url", ""),
                            snippet=item.get("content", ""),
                            score=item.get("score"),
                        )
                    )

                logger.info(f"Tavily returned {len(results)} results")
                return results

            except httpx.HTTPStatusError as e:
                logger.error(f"Tavily API error: {e.response.status_code}")
                raise
            except Exception as e:
                logger.error(f"Tavily search failed: {e}")
                raise


# =============================================================================
# DashScope Search Implementation
# =============================================================================


class DashScopeSearch(SearchEngine):
    """DashScope WebSearch (better for Chinese queries)."""

    API_URL = (
        "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation"
    )

    def __init__(self):
        self.api_key = os.getenv("DASHSCOPE_API_KEY")
        if not self.api_key:
            raise ValueError("DASHSCOPE_API_KEY environment variable not set")

    @property
    def name(self) -> str:
        return "dashscope"

    async def search(self, query: str, max_results: int = 10) -> list[SearchResult]:
        """Execute search using DashScope WebSearch plugin."""
        logger.info(f"DashScope search: {query} (max_results={max_results})")

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    self.API_URL,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "qwen-plus",  # DashScope search uses qwen-plus internally
                        "input": {
                            "messages": [
                                {"role": "user", "content": f"搜索并总结: {query}"}
                            ]
                        },
                        "parameters": {
                            "result_format": "message",
                            "enable_search": True,
                        },
                    },
                )
                response.raise_for_status()
                data = response.json()
                # Parse search results from response
                return self._parse_response(data, max_results)
            except Exception as e:
                logger.error(f"DashScope search failed: {e}")
                raise

    def _parse_response(self, data: dict, max_results: int) -> list[SearchResult]:
        """Parse DashScope response to extract search results."""
        results = []

        # Extract web_search results if available
        output = data.get("output", {})
        choices = output.get("choices", [])

        if choices:
            message = choices[0].get("message", {})
            # Check for tool_calls with web_search results
            tool_calls = message.get("tool_calls", [])
            for call in tool_calls:
                if call.get("type") == "web_search":
                    search_results = call.get("search_results", [])
                    for item in search_results[:max_results]:
                        results.append(
                            SearchResult(
                                title=item.get("title", ""),
                                url=item.get("url", ""),
                                snippet=item.get("snippet", item.get("content", "")),
                            )
                        )

        # Fallback: create a single result from the text response
        if not results:
            content = ""
            if choices:
                content = choices[0].get("message", {}).get("content", "")
            if content:
                results.append(
                    SearchResult(
                        title=f"Search result for: {content[:50]}...",
                        url="",
                        snippet=content[:500],
                    )
                )

        logger.info(f"DashScope returned {len(results)} results")
        return results


# =============================================================================
# Factory Function
# =============================================================================


def get_search_engine(engine: str = "auto") -> SearchEngine:
    """Get a search engine instance based on preference.

    Args:
        engine: Search engine preference
            - "auto": Automatically select based on available API keys
            - "tavily": Use Tavily search
            - "dashscope": Use DashScope search

    Returns:
        SearchEngine instance

    Raises:
        ValueError: If no search engine is configured
    """
    engine = engine.lower()

    if engine == "tavily":
        return TavilySearch()
    elif engine == "dashscope":
        return DashScopeSearch()
    elif engine == "auto":
        # Prefer Tavily if available, fallback to DashScope
        if os.getenv("TAVILY_API_KEY"):
            return TavilySearch()
        elif os.getenv("DASHSCOPE_API_KEY"):
            return DashScopeSearch()
        else:
            raise ValueError(
                "No search engine configured. "
                "Set TAVILY_API_KEY or DASHSCOPE_API_KEY environment variable."
            )
    else:
        raise ValueError(f"Unknown search engine: {engine}")


__all__ = [
    "SearchEngine",
    "TavilySearch",
    "DashScopeSearch",
    "get_search_engine",
]
