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
    """DashScope WebSearch (better for Chinese queries).

    Uses the OpenAI-compatible endpoint with enable_search=True.
    """

    # Use OpenAI-compatible endpoint for enable_search support
    API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"

    def __init__(self):
        self.api_key = os.getenv("DASHSCOPE_API_KEY")
        if not self.api_key:
            raise ValueError("DASHSCOPE_API_KEY environment variable not set")

    @property
    def name(self) -> str:
        return "dashscope"

    async def search(
        self, query: str, max_results: int = 10, max_retries: int = 3
    ) -> list[SearchResult]:
        """Execute search using DashScope WebSearch plugin.

        Includes retry logic for transient network failures.
        """
        import asyncio

        logger.info(f"DashScope search: {query} (max_results={max_results})")

        last_error: Exception | None = None
        for attempt in range(max_retries):
            # Increase timeout for each retry
            timeout = 90.0 + (attempt * 30)
            async with httpx.AsyncClient(timeout=timeout) as client:
                try:
                    response = await client.post(
                        self.API_URL,
                        headers={
                            "Authorization": f"Bearer {self.api_key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            # Use OpenAI-compatible format
                            "model": "qwen-plus",
                            "messages": [
                                {"role": "user", "content": f"搜索并总结: {query}"}
                            ],
                            "enable_search": True,
                        },
                    )
                    response.raise_for_status()
                    data = response.json()
                    return self._parse_response(data, max_results)
                except (
                    httpx.RemoteProtocolError,
                    httpx.ConnectError,
                    httpx.ReadTimeout,
                    httpx.ConnectTimeout,
                    httpx.WriteTimeout,
                ) as e:
                    last_error = e
                    logger.warning(
                        f"DashScope search attempt {attempt + 1}/{max_retries} failed: {e}"
                    )
                    if attempt < max_retries - 1:
                        wait_time = 3 * (2**attempt)  # 3s, 6s, 12s
                        logger.info(f"Retrying in {wait_time}s...")
                        await asyncio.sleep(wait_time)
                    continue
                except Exception as e:
                    logger.error(f"DashScope search failed: {e}")
                    raise

        logger.error(f"DashScope search failed after {max_retries} attempts")
        raise last_error  # type: ignore[misc]

    def _parse_response(self, data: dict, max_results: int) -> list[SearchResult]:
        """Parse DashScope response to extract search results.

        DashScope enable_search mode returns synthesized content, not structured
        search results with URLs. We create a SearchResult with the content
        and a placeholder source attribution.
        """
        import re

        results = []

        # Handle both old format (output.choices) and OpenAI format (choices)
        choices = data.get("choices", []) or data.get("output", {}).get("choices", [])

        if choices:
            message = choices[0].get("message", {})
            content = message.get("content", "")

            if content:
                # Extract any URLs mentioned in the content
                url_pattern = r"https?://[^\s<>\"'\)\]，。、]+"
                found_urls = re.findall(url_pattern, content)

                if found_urls:
                    # Create results from found URLs
                    for url in found_urls[:max_results]:
                        # Clean URL (remove trailing punctuation)
                        url = url.rstrip(".,;:!?)")
                        results.append(
                            SearchResult(
                                title=f"Source: {url[:50]}...",
                                url=url,
                                snippet=content[:300],
                            )
                        )
                else:
                    # No URLs found - DashScope synthesized without citing sources
                    # Create a result with knowledge base attribution
                    results.append(
                        SearchResult(
                            title="DashScope Knowledge Base Search",
                            url="https://dashscope.aliyuncs.com",
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
