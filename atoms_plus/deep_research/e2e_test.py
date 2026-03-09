#!/usr/bin/env python3
"""Deep Research E2E Test CLI (深度研究端到端测试工具).

Usage:
    # Load API keys and run full test
    source ~/.openhands/deep_research.env
    poetry run python -m atoms_plus.deep_research.e2e_test

    # Test specific components
    poetry run python -m atoms_plus.deep_research.e2e_test search --engine tavily
    poetry run python -m atoms_plus.deep_research.e2e_test search --engine dashscope
    poetry run python -m atoms_plus.deep_research.e2e_test research --query "AI Agent trends"

    # Save report to file
    poetry run python -m atoms_plus.deep_research.e2e_test research --query "..." --output report.md
"""

import argparse
import asyncio
import os
import sys
import time
from pathlib import Path


async def test_search_engine(engine: str, query: str) -> bool:
    """Test a specific search engine."""
    from atoms_plus.deep_research.search import get_search_engine

    print(f"\n{'=' * 60}")
    print(f"📍 Testing {engine.upper()} Search Engine")
    print(f"{'=' * 60}")

    try:
        search = get_search_engine(engine)
        print(f"✅ Engine initialized: {type(search).__name__}")

        start = time.time()
        results = await search.search(query, max_results=3)
        elapsed = time.time() - start

        print(f"✅ Search completed in {elapsed:.2f}s")
        print(f"   Results: {len(results)}")
        for i, r in enumerate(results[:3], 1):
            print(f"   [{i}] {r.title[:50]}...")
            print(f"       URL: {r.url[:60]}...")
        return True
    except Exception as e:
        print(f"❌ Search failed: {e}")
        return False


async def test_research(query: str, output: str | None = None) -> bool:
    """Test the full research pipeline."""
    from atoms_plus.deep_research import ResearchRequest, deep_research_async

    print(f"\n{'=' * 60}")
    print(f"📌 Deep Research - Full Pipeline Test")
    print(f"{'=' * 60}")
    print(f"Query: {query}")
    print(f"Model: {os.getenv('LLM_MODEL', 'openai/MiniMax-M2.5')}")

    try:
        request = ResearchRequest(query=query, max_rounds=2)
        start = time.time()
        response = await deep_research_async(request)
        elapsed = time.time() - start

        print(f"\n✅ Research completed in {elapsed:.1f}s")
        print(f"   Rounds: {response.total_rounds}")
        print(f"   Sources: {len(response.sources)}")
        print(f"   Sections: {len(response.sections)}")

        # Save report if output specified
        if output:
            output_path = Path(output)
        else:
            output_dir = Path.home() / ".openhands" / "reports"
            output_dir.mkdir(parents=True, exist_ok=True)
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            output_path = output_dir / f"deep_research_{timestamp}.md"

        output_path.write_text(response.report, encoding="utf-8")
        print(f"\n📄 Report saved: {output_path}")
        print(f"   View: cat {output_path}")
        return True
    except Exception as e:
        print(f"❌ Research failed: {e}")
        import traceback

        traceback.print_exc()
        return False


async def test_all() -> bool:
    """Run all tests."""
    print("\n🚀 Deep Research E2E Test Suite")
    print("=" * 60)

    results = []

    # Test Tavily
    if os.getenv("TAVILY_API_KEY"):
        results.append(await test_search_engine("tavily", "OpenHands AI agent"))
    else:
        print("⚠️  TAVILY_API_KEY not set, skipping Tavily test")

    # Test DashScope
    if os.getenv("DASHSCOPE_API_KEY"):
        results.append(await test_search_engine("dashscope", "AI 编程助手"))
    else:
        print("⚠️  DASHSCOPE_API_KEY not set, skipping DashScope test")

    # Test full research
    if os.getenv("LLM_API_KEY"):
        results.append(await test_research("OpenHands 是什么？有哪些核心功能？"))
    else:
        print("⚠️  LLM_API_KEY not set, skipping research test")

    print("\n" + "=" * 60)
    passed = sum(results)
    total = len(results)
    print(f"📊 Results: {passed}/{total} tests passed")
    return all(results)


def main() -> int:
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Deep Research E2E Test CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    subparsers = parser.add_subparsers(dest="command", help="Test command")

    # search subcommand
    search_parser = subparsers.add_parser("search", help="Test search engine")
    search_parser.add_argument(
        "--engine", choices=["tavily", "dashscope"], default="tavily"
    )
    search_parser.add_argument("--query", default="AI Agent development")

    # research subcommand
    research_parser = subparsers.add_parser("research", help="Test full research")
    research_parser.add_argument("--query", required=True, help="Research query")
    research_parser.add_argument("--output", help="Output file path")

    args = parser.parse_args()

    if args.command == "search":
        success = asyncio.run(test_search_engine(args.engine, args.query))
    elif args.command == "research":
        success = asyncio.run(test_research(args.query, args.output))
    else:
        success = asyncio.run(test_all())

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
