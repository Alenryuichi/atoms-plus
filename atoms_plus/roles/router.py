# Atoms Plus Role System - Auto Router
"""
Automatic role detection and routing based on user input.
No manual switching required - the system intelligently selects the best role.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from atoms_plus.roles.base import AgentRole


@dataclass
class RouteResult:
    """Result of role routing."""

    role: AgentRole
    confidence: float  # 0.0 to 1.0
    matched_keywords: list[str]
    reason: str


# Keyword patterns for each role (priority order matters)
ROLE_PATTERNS: dict[AgentRole, dict] = {
    # Architect - System design, API design, tech decisions
    AgentRole.ARCHITECT: {
        'keywords': [
            '架构',
            'architecture',
            '设计系统',
            'system design',
            'api设计',
            'api design',
            '微服务',
            'microservice',
            '技术选型',
            'tech stack',
            '数据库设计',
            'database design',
            'scalability',
            '可扩展',
            '高可用',
            'high availability',
        ],
        'patterns': [
            r'设计.*架构',
            r'如何.*设计',
            r'architecture.*for',
            r'design.*system',
        ],
        'priority': 1,
    },
    # Product Manager - Requirements, user stories, PRD
    AgentRole.PRODUCT_MANAGER: {
        'keywords': [
            '需求',
            'requirement',
            '用户故事',
            'user story',
            'prd',
            '产品',
            'product',
            '功能规划',
            'feature',
            '用户体验',
            'ux',
            'mvp',
            '优先级',
            'priority',
        ],
        'patterns': [
            r'写.*需求',
            r'定义.*功能',
            r'product.*requirement',
            r'user.*need',
        ],
        'priority': 2,
    },
    # Deep Researcher - Research, analysis, investigation
    AgentRole.DEEP_RESEARCHER: {
        'keywords': [
            '研究',
            'research',
            '调研',
            '分析',
            'analyze',
            '对比',
            'compare',
            '评估',
            'evaluate',
            '调查',
            'investigate',
            '了解',
            '学习',
            'learn about',
        ],
        'patterns': [
            r'研究.*一下',
            r'分析.*情况',
            r'compare.*with',
            r'what.*is.*best',
        ],
        'priority': 3,
    },
    # Data Analyst - Data, statistics, visualization
    AgentRole.DATA_ANALYST: {
        'keywords': [
            '数据',
            'data',
            '统计',
            'statistics',
            '图表',
            'chart',
            '可视化',
            'visualization',
            '报表',
            'report',
            'sql',
            'pandas',
            '分析数据',
            'analyze data',
        ],
        'patterns': [
            r'分析.*数据',
            r'生成.*报表',
            r'create.*chart',
            r'visualize',
        ],
        'priority': 4,
    },
    # Project Manager - Planning, timeline, tasks
    AgentRole.PROJECT_MANAGER: {
        'keywords': [
            '计划',
            'plan',
            '排期',
            'timeline',
            '任务',
            'task',
            '进度',
            'progress',
            '里程碑',
            'milestone',
            'sprint',
            '敏捷',
            'agile',
            '甘特图',
            'gantt',
        ],
        'patterns': [
            r'制定.*计划',
            r'安排.*任务',
            r'create.*plan',
            r'schedule',
        ],
        'priority': 5,
    },
    # SEO Specialist - SEO, keywords, optimization
    AgentRole.SEO_SPECIALIST: {
        'keywords': [
            'seo',
            '关键词',
            'keyword',
            '搜索引擎',
            'search engine',
            '排名',
            'ranking',
            '优化',
            'meta',
            'sitemap',
        ],
        'patterns': [
            r'seo.*优化',
            r'提高.*排名',
            r'optimize.*for.*search',
        ],
        'priority': 6,
    },
    # Team Leader - Coordination (rarely auto-selected)
    AgentRole.TEAM_LEADER: {
        'keywords': [
            '协调',
            'coordinate',
            '团队',
            'team',
            '分配',
            'delegate',
            '安排人员',
            'assign',
        ],
        'patterns': [
            r'协调.*团队',
            r'分配.*任务给',
        ],
        'priority': 7,
    },
    # Engineer - Default for coding tasks (lowest priority, catches all coding)
    AgentRole.ENGINEER: {
        'keywords': [
            '代码',
            'code',
            '编程',
            'programming',
            '实现',
            'implement',
            '开发',
            'develop',
            '写',
            'write',
            '创建',
            'create',
            '修复',
            'fix',
            'bug',
            '调试',
            'debug',
            '重构',
            'refactor',
            '测试',
            'test',
            '部署',
            'deploy',
            '组件',
            'component',
            'api',
            '接口',
            '函数',
            'function',
            '类',
            'class',
        ],
        'patterns': [
            r'写.*代码',
            r'实现.*功能',
            r'create.*component',
            r'fix.*bug',
            r'implement',
        ],
        'priority': 99,  # Lowest priority - default fallback
    },
}


class RoleRouter:
    """Automatic role router based on user input analysis."""

    @classmethod
    def detect_role(cls, user_input: str) -> RouteResult:
        """
        Automatically detect the best role for the given user input.

        Args:
            user_input: The user's message or task description

        Returns:
            RouteResult with the detected role and confidence
        """
        input_lower = user_input.lower()
        best_match: RouteResult | None = None
        best_score = 0.0

        for role, config in ROLE_PATTERNS.items():
            score, matched = cls._calculate_match_score(
                input_lower, config['keywords'], config['patterns']
            )

            # Adjust score by priority (lower priority = slight penalty)
            priority_factor = 1.0 - (config['priority'] * 0.01)
            adjusted_score = score * priority_factor

            if adjusted_score > best_score:
                best_score = adjusted_score
                best_match = RouteResult(
                    role=role,
                    confidence=min(score, 1.0),
                    matched_keywords=matched,
                    reason=cls._generate_reason(role, matched),
                )

        # Default to Engineer if no strong match
        if best_match is None or best_match.confidence < 0.1:
            return RouteResult(
                role=AgentRole.ENGINEER,
                confidence=0.5,
                matched_keywords=[],
                reason='Default role for general development tasks',
            )

        return best_match

    @classmethod
    def _calculate_match_score(
        cls, text: str, keywords: list[str], patterns: list[str]
    ) -> tuple[float, list[str]]:
        """Calculate match score based on keywords and regex patterns."""
        matched = []
        score = 0.0

        # Check keywords
        for keyword in keywords:
            if keyword.lower() in text:
                matched.append(keyword)
                score += 0.15  # Each keyword adds 0.15

        # Check regex patterns (higher weight)
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                matched.append(f'pattern:{pattern}')
                score += 0.25  # Each pattern match adds 0.25

        return score, matched

    @classmethod
    def _generate_reason(cls, role: AgentRole, matched: list[str]) -> str:
        """Generate human-readable reason for role selection."""
        role_descriptions = {
            AgentRole.ARCHITECT: 'System architecture and design tasks',
            AgentRole.PRODUCT_MANAGER: 'Product requirements and user stories',
            AgentRole.DEEP_RESEARCHER: 'Research and analysis tasks',
            AgentRole.DATA_ANALYST: 'Data analysis and visualization',
            AgentRole.PROJECT_MANAGER: 'Project planning and task management',
            AgentRole.SEO_SPECIALIST: 'SEO optimization tasks',
            AgentRole.TEAM_LEADER: 'Team coordination and delegation',
            AgentRole.ENGINEER: 'Software development and coding',
        }
        desc = role_descriptions.get(role, 'General tasks')
        keywords = [k for k in matched if not k.startswith('pattern:')]
        if keywords:
            return f'{desc} (matched: {", ".join(keywords[:3])})'
        return desc


# Convenience function for direct usage
def auto_route(user_input: str) -> RouteResult:
    """Automatically route user input to the best role."""
    return RoleRouter.detect_role(user_input)
