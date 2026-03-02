# Atoms Plus Orchestrator - 多角色协调系统
"""
Multi-role orchestration for Team Leader coordination.

使用示例:
    from atoms_plus.orchestrator import TaskDispatcher, MultiAgentController

    # Team Leader 分派任务
    dispatcher = TaskDispatcher()
    subtasks = [
        dispatcher.create_subtask("architect", "Design the API schema"),
        dispatcher.create_subtask("engineer", "Implement the endpoints"),
    ]

    # 并行执行
    controller = MultiAgentController()
    results = await controller.run_parallel(subtasks)

    # 聚合结果
    from atoms_plus.orchestrator import ResultAggregator
    aggregated = ResultAggregator.merge_results(results)
    print(ResultAggregator.format_for_team_leader(aggregated))
"""

from atoms_plus.orchestrator.dispatcher import Subtask, TaskDispatcher
from atoms_plus.orchestrator.multi_agent import (
    AgentResult,
    AgentStatus,
    MultiAgentController,
    MultiAgentSession,
)
from atoms_plus.orchestrator.result_aggregator import AggregatedResult, ResultAggregator
from atoms_plus.orchestrator.tools import (
    DelegateToRoleTool,
    create_delegate_to_role_tool,
)

__all__ = [
    # Dispatcher
    "TaskDispatcher",
    "Subtask",
    # Multi-Agent
    "MultiAgentController",
    "MultiAgentSession",
    "AgentResult",
    "AgentStatus",
    # Aggregator
    "ResultAggregator",
    "AggregatedResult",
    # Tools
    "DelegateToRoleTool",
    "create_delegate_to_role_tool",
]

