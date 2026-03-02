# Atoms Plus - Result Aggregator
"""
ResultAggregator: Combines outputs from multiple role-based agents.
Used by Team Leader to merge and present final results.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from atoms_plus.orchestrator.multi_agent import AgentResult, AgentStatus

logger = logging.getLogger(__name__)


@dataclass
class AggregatedResult:
    """Combined result from multiple agents."""
    
    success_count: int
    failure_count: int
    total_duration: float
    summary: str
    details: list[dict[str, Any]]
    recommendations: list[str]

    def to_dict(self) -> dict[str, Any]:
        return {
            "success_count": self.success_count,
            "failure_count": self.failure_count,
            "total_duration": self.total_duration,
            "summary": self.summary,
            "details": self.details,
            "recommendations": self.recommendations,
        }


class ResultAggregator:
    """
    Aggregates results from multiple agent executions.
    
    Strategies:
    - MERGE: Combine all outputs into a single document
    - BEST: Select the best result based on criteria
    - VOTE: Use majority voting for decisions
    - CHAIN: Pass output from one agent to the next
    """

    @staticmethod
    def merge_results(results: list[AgentResult]) -> AggregatedResult:
        """
        Merge all agent results into a combined summary.
        
        Args:
            results: List of AgentResult from parallel execution
            
        Returns:
            AggregatedResult with combined information
        """
        success_count = sum(1 for r in results if r.status == AgentStatus.COMPLETED)
        failure_count = sum(1 for r in results if r.status == AgentStatus.FAILED)
        total_duration = sum(r.duration_seconds for r in results)

        # Build details
        details = [r.to_dict() for r in results]

        # Build summary
        role_outputs = []
        for r in results:
            if r.status == AgentStatus.COMPLETED:
                role_outputs.append(f"**{r.role}**: {r.output}")
            else:
                role_outputs.append(f"**{r.role}**: ❌ Failed - {r.error}")

        summary = "\n\n".join(role_outputs)

        # Generate recommendations
        recommendations = []
        if failure_count > 0:
            recommendations.append(f"Retry {failure_count} failed task(s)")
        if success_count == len(results):
            recommendations.append("All tasks completed successfully - ready for review")

        return AggregatedResult(
            success_count=success_count,
            failure_count=failure_count,
            total_duration=total_duration,
            summary=summary,
            details=details,
            recommendations=recommendations,
        )

    @staticmethod
    def format_for_team_leader(aggregated: AggregatedResult) -> str:
        """Format aggregated results for Team Leader review."""
        output = f"""
## Multi-Agent Execution Summary

**Status**: {aggregated.success_count} succeeded, {aggregated.failure_count} failed
**Total Duration**: {aggregated.total_duration:.2f} seconds

### Results by Role

{aggregated.summary}

### Recommendations
"""
        for rec in aggregated.recommendations:
            output += f"- {rec}\n"

        return output.strip()

    @staticmethod
    def chain_results(results: list[AgentResult]) -> str:
        """
        Chain results for sequential processing.
        Output of each agent becomes context for the next.
        """
        context_chain = []
        for r in results:
            if r.status == AgentStatus.COMPLETED:
                context_chain.append(f"[{r.role}] Output:\n{r.output}")
        
        return "\n\n---\n\n".join(context_chain)

