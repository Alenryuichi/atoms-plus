"""
Race Mode Result Selector - 智能选择最佳结果

支持多种选择策略：
- 代码质量评分
- 执行速度
- 成本效益
- 用户偏好
"""

from dataclasses import dataclass
from enum import Enum
from typing import Callable

from .coordinator import RaceResult


class SelectionCriteria(Enum):
    """选择标准"""

    CODE_QUALITY = "code_quality"  # 代码质量优先
    SPEED = "speed"  # 速度优先
    COST = "cost"  # 成本优先
    BALANCED = "balanced"  # 平衡模式
    CUSTOM = "custom"  # 自定义评分


@dataclass
class QualityMetrics:
    """代码质量指标"""

    correctness: float = 0.0  # 正确性 (0-100)
    completeness: float = 0.0  # 完整性 (0-100)
    readability: float = 0.0  # 可读性 (0-100)
    efficiency: float = 0.0  # 效率 (0-100)
    best_practices: float = 0.0  # 最佳实践 (0-100)

    @property
    def overall(self) -> float:
        """综合评分"""
        weights = {
            "correctness": 0.35,
            "completeness": 0.25,
            "readability": 0.15,
            "efficiency": 0.15,
            "best_practices": 0.10,
        }
        return sum(getattr(self, k) * v for k, v in weights.items())


class ResultSelector:
    """
    结果选择器

    根据不同标准从多个模型结果中选择最佳答案
    """

    def __init__(self, criteria: SelectionCriteria = SelectionCriteria.BALANCED):
        self.criteria = criteria
        self._custom_scorer: Callable[[RaceResult], float] | None = None

    def select_best(self, results: list[RaceResult]) -> RaceResult | None:
        """从结果列表中选择最佳结果"""
        if not results:
            return None

        # 过滤掉有错误的结果
        valid_results = [r for r in results if not r.error]
        if not valid_results:
            return results[0] if results else None

        if len(valid_results) == 1:
            return valid_results[0]

        # 根据选择标准评分
        scored_results = [(result, self._calculate_score(result)) for result in valid_results]

        # 按分数降序排列
        scored_results.sort(key=lambda x: x[1], reverse=True)

        best_result = scored_results[0][0]
        best_result.quality_score = scored_results[0][1]

        return best_result

    def _calculate_score(self, result: RaceResult) -> float:
        """根据选择标准计算分数"""
        if self.criteria == SelectionCriteria.SPEED:
            max_time = 120.0
            return max(0, 100 - (result.execution_time / max_time * 100))

        elif self.criteria == SelectionCriteria.COST:
            max_cost = 0.10
            return max(0, 100 - (result.cost_estimate / max_cost * 100))

        elif self.criteria == SelectionCriteria.CODE_QUALITY:
            return self._evaluate_code_quality(result)

        elif self.criteria == SelectionCriteria.CUSTOM and self._custom_scorer:
            return self._custom_scorer(result)

        else:  # BALANCED
            speed_score = max(0, 100 - result.execution_time * 10)
            cost_score = max(0, 100 - result.cost_estimate * 1000)
            quality_score = self._evaluate_code_quality(result)
            return speed_score * 0.2 + cost_score * 0.3 + quality_score * 0.5

    def _evaluate_code_quality(self, result: RaceResult) -> float:
        """评估代码质量（启发式评分）"""
        response = result.response
        score = 50.0  # 基础分

        if "```" in response:
            score += 10
        if "#" in response or "//" in response:
            score += 5
        if 100 < len(response) < 5000:
            score += 10
        if "try" in response or "except" in response or "catch" in response:
            score += 5

        return min(100, score)

    def set_custom_scorer(self, scorer: Callable[[RaceResult], float]):
        """设置自定义评分函数"""
        self._custom_scorer = scorer
        self.criteria = SelectionCriteria.CUSTOM

    def rank_all(self, results: list[RaceResult]) -> list[tuple[RaceResult, float]]:
        """对所有结果进行排名"""
        valid_results = [r for r in results if not r.error]
        scored = [(r, self._calculate_score(r)) for r in valid_results]
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored

