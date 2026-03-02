# Atoms Plus - Multi-Agent Controller
"""
MultiAgentController: Manages parallel execution of multiple role-based agents.
Enables Team Leader to run multiple subtasks concurrently.

Uses LiteLLM to call real LLMs (Alibaba Qwen, DeepSeek, etc.)
"""

from __future__ import annotations

import asyncio
import logging
import os
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any

import litellm
from litellm import acompletion, completion_cost

from atoms_plus.orchestrator.dispatcher import Subtask
from atoms_plus.roles import RoleRegistry

# Configure litellm
litellm.set_verbose = False
logger = logging.getLogger(__name__)


class AgentStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class AgentResult:
    """Result from a single agent execution."""

    agent_id: str
    role: str
    task: str
    status: AgentStatus
    output: str = ""
    error: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    duration_seconds: float = 0.0
    # LLM metrics
    model: str = ""
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    cost_estimate: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "role": self.role,
            "task": self.task,
            "status": self.status.value,
            "output": self.output,
            "error": self.error,
            "duration_seconds": self.duration_seconds,
            "model": self.model,
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.total_tokens,
            "cost_estimate": self.cost_estimate,
        }


@dataclass
class MultiAgentSession:
    """A session managing multiple parallel agents."""
    
    session_id: str
    subtasks: list[Subtask]
    results: dict[str, AgentResult] = field(default_factory=dict)
    status: AgentStatus = AgentStatus.PENDING
    created_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> dict[str, Any]:
        return {
            "session_id": self.session_id,
            "subtasks": [s.to_dict() for s in self.subtasks],
            "results": {k: v.to_dict() for k, v in self.results.items()},
            "status": self.status.value,
        }


class MultiAgentController:
    """
    Controls parallel execution of multiple role-based agents.
    Uses LiteLLM to call real LLMs (Alibaba Qwen, DeepSeek, etc.)

    Usage:
        controller = MultiAgentController(model="openai/qwen-plus")

        # Define subtasks
        subtasks = [
            Subtask(role=AgentRole.ARCHITECT, task="Design API schema"),
            Subtask(role=AgentRole.ENGINEER, task="Implement endpoints"),
        ]

        # Run in parallel
        results = await controller.run_parallel(subtasks)
    """

    # Default model - Alibaba Qwen Plus (百炼)
    DEFAULT_MODEL = "openai/qwen-plus"

    # Supported models
    SUPPORTED_MODELS = {
        # 阿里云百炼 (Qwen)
        "openai/qwen-plus": {"provider": "aliyun", "display": "通义千问 Plus"},
        "openai/qwen-max": {"provider": "aliyun", "display": "通义千问 Max"},
        "openai/qwen-turbo": {"provider": "aliyun", "display": "通义千问 Turbo"},
        # DeepSeek
        "deepseek/deepseek-chat": {"provider": "deepseek", "display": "DeepSeek V3"},
        "deepseek/deepseek-coder": {"provider": "deepseek", "display": "DeepSeek Coder"},
    }

    def __init__(
        self,
        model: str | None = None,
        max_tokens: int = 4096,
        temperature: float = 0.7,
    ):
        """
        Initialize MultiAgentController with LLM configuration.

        Args:
            model: LiteLLM model identifier (default: openai/qwen-plus)
            max_tokens: Maximum tokens for generation
            temperature: Temperature for generation
        """
        self.model = model or self.DEFAULT_MODEL
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.sessions: dict[str, MultiAgentSession] = {}

    async def run_parallel(
        self,
        subtasks: list[Subtask],
        timeout: float = 300.0,
    ) -> list[AgentResult]:
        """
        Run multiple subtasks in parallel.
        
        Args:
            subtasks: List of subtasks to execute
            timeout: Maximum time to wait for all tasks (seconds)
            
        Returns:
            List of AgentResult from each subtask
        """
        session_id = str(uuid.uuid4())[:8]
        session = MultiAgentSession(
            session_id=session_id,
            subtasks=subtasks,
        )
        self.sessions[session_id] = session
        session.status = AgentStatus.RUNNING

        # Create tasks for parallel execution
        tasks = [
            asyncio.wait_for(
                self._execute_subtask(subtask, session_id),
                timeout=timeout,
            )
            for subtask in subtasks
        ]

        # Run all tasks in parallel
        try:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            final_results: list[AgentResult] = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    error_result = AgentResult(
                        agent_id=f"{session_id}-{i}",
                        role=subtasks[i].role.value,
                        task=subtasks[i].task,
                        status=AgentStatus.FAILED,
                        error=str(result),
                    )
                    final_results.append(error_result)
                else:
                    final_results.append(result)
                    
            session.status = AgentStatus.COMPLETED
            return final_results
            
        except Exception as e:
            session.status = AgentStatus.FAILED
            logger.error(f"Multi-agent session {session_id} failed: {e}")
            raise

    async def _execute_subtask(
        self,
        subtask: Subtask,
        session_id: str,
    ) -> AgentResult:
        """
        Execute a single subtask with role-specific prompt using real LLM.

        Supports:
        - Alibaba Qwen (百炼): openai/qwen-plus, openai/qwen-max
        - DeepSeek: deepseek/deepseek-chat, deepseek/deepseek-coder
        """
        agent_id = f"{session_id}-{subtask.role.value}"
        started_at = datetime.now()
        start_time = time.time()

        try:
            # Get role-specific system prompt
            role_prompt = RoleRegistry.get_system_prompt(subtask.role)

            # Build user prompt
            user_prompt = f"""## Your Task
{subtask.task}

## Context
{subtask.context or 'No additional context provided.'}

## Expected Output
{subtask.expected_output or 'Complete the task as described.'}"""

            # Build messages
            messages = [
                {"role": "system", "content": role_prompt},
                {"role": "user", "content": user_prompt},
            ]

            # Build LiteLLM call kwargs
            call_kwargs = {
                "model": self.model,
                "messages": messages,
                "max_tokens": self.max_tokens,
                "temperature": self.temperature,
            }

            # Configure API for Alibaba Qwen (百炼)
            if self.model.startswith("openai/qwen"):
                call_kwargs["api_base"] = "https://dashscope.aliyuncs.com/compatible-mode/v1"
                call_kwargs["api_key"] = os.getenv("DASHSCOPE_API_KEY") or os.getenv("LLM_API_KEY")

            # Call LLM via LiteLLM
            logger.info(f"[{agent_id}] Calling LLM: {self.model}")
            response = await acompletion(**call_kwargs)

            execution_time = time.time() - start_time
            completed_at = datetime.now()

            # Extract response content
            content = response.choices[0].message.content or ""

            # Extract token usage
            usage = response.usage
            prompt_tokens = usage.prompt_tokens if usage else 0
            completion_tokens = usage.completion_tokens if usage else 0
            total_tokens = usage.total_tokens if usage else 0

            # Calculate cost
            try:
                cost = completion_cost(completion_response=response)
            except Exception:
                cost = 0.0

            logger.info(
                f"[{agent_id}] Completed in {execution_time:.2f}s, "
                f"tokens: {total_tokens}, cost: ${cost:.6f}"
            )

            return AgentResult(
                agent_id=agent_id,
                role=subtask.role.value,
                task=subtask.task,
                status=AgentStatus.COMPLETED,
                output=content,
                started_at=started_at,
                completed_at=completed_at,
                duration_seconds=execution_time,
                model=self.model,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
                cost_estimate=cost,
            )

        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"[{agent_id}] LLM call failed: {e}")
            return AgentResult(
                agent_id=agent_id,
                role=subtask.role.value,
                task=subtask.task,
                status=AgentStatus.FAILED,
                error=str(e),
                duration_seconds=execution_time,
                model=self.model,
            )

