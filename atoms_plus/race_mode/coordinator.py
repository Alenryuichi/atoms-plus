"""
Race Mode Coordinator - 协调多个 LLM 并行执行任务

使用 LiteLLM 实现真实的多模型并行调用，支持：
- 100+ LLM 提供商（OpenAI, Anthropic, Google, DeepSeek 等）
- 成本追踪与 Token 统计
- 并行执行与超时控制
"""

import asyncio
import logging
import time
import uuid
from dataclasses import dataclass, field

import litellm
from litellm import acompletion, completion_cost

# 配置 litellm
litellm.set_verbose = False
logger = logging.getLogger(__name__)


@dataclass
class RaceResult:
    """单个模型的竞速结果"""

    model_name: str
    response: str
    code_output: str | None = None
    execution_time: float = 0.0
    token_count: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    cost_estimate: float = 0.0
    quality_score: float = 0.0  # 0-100
    error: str | None = None
    metadata: dict = field(default_factory=dict)


@dataclass
class RaceSession:
    """竞速会话"""

    session_id: str
    prompt: str
    models: list[str]
    results: list[RaceResult] = field(default_factory=list)
    winner: RaceResult | None = None
    created_at: float = field(default_factory=time.time)
    total_cost: float = 0.0


class RaceCoordinator:
    """
    Race Mode 协调器 - 使用 LiteLLM 实现真实多模型并行调用

    功能：
    1. 并行调用多个 LLM（真实 API 调用）
    2. 自动成本追踪和 Token 统计
    3. 超时控制和错误处理
    """

    # 支持的模型列表 - LiteLLM 格式
    SUPPORTED_MODELS = {
        # ========== 国产模型 (你已有 API) ==========
        # 阿里云百炼 (Qwen) - 使用 openai 兼容格式
        "openai/qwen-plus": {"provider": "aliyun", "display": "通义千问 Plus"},
        "openai/qwen-max": {"provider": "aliyun", "display": "通义千问 Max"},
        "openai/qwen-turbo": {"provider": "aliyun", "display": "通义千问 Turbo"},
        # DeepSeek
        "deepseek/deepseek-chat": {"provider": "deepseek", "display": "DeepSeek V3"},
        "deepseek/deepseek-coder": {"provider": "deepseek", "display": "DeepSeek Coder"},
        # 智谱 GLM - 使用 LiteLLM 的 zai/ 前缀
        "zai/glm-4-plus": {"provider": "zhipu", "display": "智谱 GLM-4 Plus"},
        "zai/glm-4-flash": {"provider": "zhipu", "display": "智谱 GLM-4 Flash"},
        "zai/glm-4": {"provider": "zhipu", "display": "智谱 GLM-4"},
        # ========== 国际模型 (需要额外购买) ==========
        # Anthropic
        "claude-sonnet-4-20250514": {"provider": "anthropic", "display": "Claude Sonnet 4"},
        "claude-opus-4-20250514": {"provider": "anthropic", "display": "Claude Opus 4"},
        "claude-3-5-sonnet-20241022": {"provider": "anthropic", "display": "Claude 3.5 Sonnet"},
        # OpenAI
        "gpt-4o": {"provider": "openai", "display": "GPT-4o"},
        "gpt-4o-mini": {"provider": "openai", "display": "GPT-4o Mini"},
        "gpt-4-turbo": {"provider": "openai", "display": "GPT-4 Turbo"},
        # Google
        "gemini/gemini-2.0-flash": {"provider": "google", "display": "Gemini 2.0 Flash"},
        "gemini/gemini-1.5-pro": {"provider": "google", "display": "Gemini 1.5 Pro"},
        # Mistral
        "mistral/mistral-large-latest": {"provider": "mistral", "display": "Mistral Large"},
    }

    # 默认模型组合 - 使用你已有的国产模型
    DEFAULT_MODELS = ["openai/qwen-plus", "deepseek/deepseek-chat", "zai/glm-4-flash"]

    def __init__(
        self,
        models: list[str] | None = None,
        timeout: float = 120.0,
        max_tokens: int = 4096,
        temperature: float = 0.7,
    ):
        """
        初始化 Race Coordinator

        Args:
            models: 参与竞速的模型列表 (LiteLLM 格式)
            timeout: 单个模型的超时时间（秒）
            max_tokens: 最大生成 token 数
            temperature: 温度参数
        """
        self.models = models or self.DEFAULT_MODELS
        self.timeout = timeout
        self.max_tokens = max_tokens
        self.temperature = temperature
        self._sessions: dict[str, RaceSession] = {}

    async def run(
        self,
        prompt: str,
        context: str = "",
        system_prompt: str | None = None,
    ) -> list[RaceResult]:
        """
        启动竞速：并行调用所有模型

        Args:
            prompt: 用户的任务描述
            context: 额外的上下文信息（会附加到 prompt）
            system_prompt: 系统提示词

        Returns:
            所有模型的结果列表
        """
        session_id = str(uuid.uuid4())[:8]
        session = RaceSession(
            session_id=session_id,
            prompt=prompt,
            models=self.models,
        )

        # 构建完整 prompt
        full_prompt = f"{context}\n\n{prompt}" if context else prompt

        # 并行调用所有模型
        tasks = [
            asyncio.wait_for(
                self._call_model(model, full_prompt, system_prompt),
                timeout=self.timeout,
            )
            for model in self.models
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # 处理结果
        for i, result in enumerate(results):
            if isinstance(result, RaceResult):
                session.results.append(result)
                session.total_cost += result.cost_estimate
            elif isinstance(result, asyncio.TimeoutError):
                session.results.append(
                    RaceResult(
                        model_name=self.models[i],
                        response="",
                        error=f"Timeout after {self.timeout}s",
                        execution_time=self.timeout,
                    )
                )
            elif isinstance(result, Exception):
                logger.error(f"Model {self.models[i]} error: {result}")
                session.results.append(
                    RaceResult(
                        model_name=self.models[i],
                        response="",
                        error=str(result),
                    )
                )

        self._sessions[session_id] = session
        return session.results

    async def _call_model(
        self,
        model: str,
        prompt: str,
        system_prompt: str | None = None,
    ) -> RaceResult:
        """
        调用单个模型 - 使用 LiteLLM acompletion

        Args:
            model: LiteLLM 模型标识符
            prompt: 用户提示
            system_prompt: 系统提示

        Returns:
            RaceResult 包含响应和统计信息
        """
        start_time = time.time()

        # 构建消息
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            # 构建 LiteLLM 调用参数
            call_kwargs = {
                "model": model,
                "messages": messages,
                "max_tokens": self.max_tokens,
                "temperature": self.temperature,
            }

            # 阿里云百炼需要特殊的 api_base 配置
            # 使用 openai/qwen-xxx 格式，并设置阿里云的 API 地址
            if model.startswith("openai/qwen"):
                import os
                call_kwargs["api_base"] = "https://dashscope.aliyuncs.com/compatible-mode/v1"
                call_kwargs["api_key"] = os.getenv("DASHSCOPE_API_KEY") or os.getenv("LLM_API_KEY")

            # 调用 LiteLLM
            response = await acompletion(**call_kwargs)

            execution_time = time.time() - start_time

            # 提取响应内容
            content = response.choices[0].message.content or ""

            # 提取 token 使用情况
            usage = response.usage
            prompt_tokens = usage.prompt_tokens if usage else 0
            completion_tokens = usage.completion_tokens if usage else 0
            total_tokens = usage.total_tokens if usage else 0

            # 计算成本
            try:
                cost = completion_cost(completion_response=response)
            except Exception:
                cost = 0.0

            return RaceResult(
                model_name=model,
                response=content,
                execution_time=execution_time,
                token_count=total_tokens,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                cost_estimate=cost,
                metadata={
                    "model_id": response.model if hasattr(response, "model") else model,
                    "finish_reason": response.choices[0].finish_reason,
                },
            )

        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"LiteLLM call failed for {model}: {e}")
            return RaceResult(
                model_name=model,
                response="",
                execution_time=execution_time,
                error=str(e),
            )

    def get_session(self, session_id: str) -> RaceSession | None:
        """获取竞速会话"""
        return self._sessions.get(session_id)

    def list_sessions(self) -> list[str]:
        """列出所有会话 ID"""
        return list(self._sessions.keys())

    @classmethod
    def get_available_models(cls) -> dict[str, dict]:
        """获取支持的模型列表"""
        return cls.SUPPORTED_MODELS
