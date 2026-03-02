# Atoms Race Mode - 多模型竞速对比功能（基于 LiteLLM）
"""
Race Mode: 同时运行多个 LLM，对比结果选择最优方案

支持 100+ LLM 提供商：OpenAI, Anthropic, Google, DeepSeek, Mistral 等

使用示例:
    from atoms_plus.race_mode import RaceCoordinator, ResultSelector, SelectionCriteria
    
    # 初始化协调器
    race = RaceCoordinator(
        models=["claude-sonnet-4-20250514", "gpt-4o", "gemini/gemini-2.0-flash"]
    )
    
    # 并行调用所有模型
    results = await race.run("创建一个 React Todo 应用")
    
    # 选择最佳结果
    selector = ResultSelector(criteria=SelectionCriteria.BALANCED)
    best = selector.select_best(results)
    
    print(f"Winner: {best.model_name}")
    print(f"Cost: ${best.cost_estimate:.4f}")
    print(f"Response: {best.response}")
"""

from .coordinator import RaceCoordinator, RaceResult, RaceSession
from .result_selector import ResultSelector, SelectionCriteria

__all__ = [
    "RaceCoordinator",
    "RaceResult",
    "RaceSession",
    "ResultSelector",
    "SelectionCriteria",
]

