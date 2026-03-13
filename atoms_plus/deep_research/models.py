"""Pydantic models for Deep Research functionality (深度研究数据模型).

This module defines:
- Request models for research API
- Response models for structured results
- Progress models for WebSocket streaming
- Internal structure models for research flow
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class SearchEngine(str, Enum):
    """Supported search engines for research.

    支持的搜索引擎选项。
    """

    TAVILY = "tavily"  # Recommended for English queries
    DASHSCOPE = "dashscope"  # Better for Chinese queries
    AUTO = "auto"  # Automatically select based on availability


class Language(str, Enum):
    """Supported report languages.

    支持的报告语言。
    """

    AUTO = "auto"  # Auto-detect from query
    EN = "en"  # English
    ZH = "zh"  # Chinese


# =============================================================================
# Request Models (请求模型)
# =============================================================================


class ResearchRequest(BaseModel):
    """Request model for deep research.

    深度研究请求模型。

    Attributes:
        query: Research topic or question (研究主题或问题)
        max_rounds: Maximum reflection rounds per section (每章节最大反思轮数)
        search_engine: Search engine preference (搜索引擎选择)
        language: Report language (报告语言)
    """

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "query": "2025年AI Agent发展趋势",
                "max_rounds": 2,
                "search_engine": "auto",
                "language": "auto",
            }
        }
    )

    query: str = Field(
        ...,
        min_length=3,
        max_length=500,
        description="Research topic or question / 研究主题或问题",
    )
    max_rounds: int = Field(
        default=2,
        ge=1,
        le=5,
        description="Maximum reflection rounds per section (1-5) / 每章节最大反思轮数",
    )
    search_engine: SearchEngine = Field(
        default=SearchEngine.AUTO, description="Search engine preference / 搜索引擎选择"
    )
    language: str = Field(
        default="auto",
        pattern="^(auto|en|zh)$",
        description="Report language: auto/en/zh / 报告语言",
    )


class SaveReportRequest(BaseModel):
    """Request model for saving a research report to a sandbox.

    研究完成后，将报告写入沙箱工作区的请求模型。

    The caller provides the sandbox_id and report content.
    The server resolves the host-side path via base_working_dir + sandbox_id.
    """

    sandbox_id: str = Field(
        ...,
        min_length=1,
        max_length=128,
        pattern=r"^[a-zA-Z0-9][a-zA-Z0-9_\-]*$",
        description="Sandbox ID that identifies the conversation sandbox / 沙箱 ID",
    )
    report: str = Field(
        ...,
        min_length=1,
        description="Markdown report content to write / 要写入的 Markdown 报告内容",
    )
    filename: str = Field(
        default="report.md",
        pattern=r"^[\w\-\.]+$",
        description="File name inside the sandbox workspace (default: report.md)",
    )


class SaveReportResponse(BaseModel):
    """Response model for save-report endpoint.

    保存报告端点的响应模型。
    """

    success: bool = Field(..., description="Whether the write succeeded / 写入是否成功")
    host_path: str | None = Field(
        default=None,
        description="Host-side file path where report was written / 宿主机上的文件路径",
    )
    sandbox_path: str | None = Field(
        default=None,
        description=(
            "Path as seen from inside the sandbox (e.g. /workspace/report.md) / "
            "沙箱内部视角的文件路径"
        ),
    )
    error: str | None = Field(
        default=None,
        description="Error message if write failed / 写入失败时的错误信息",
    )


# =============================================================================
# Response Models (响应模型)
# =============================================================================


class SectionResult(BaseModel):
    """Result for a single research section.

    单个章节的研究结果。
    """

    title: str = Field(..., description="Section title / 章节标题")
    content: str = Field(..., description="Section content (Markdown) / 章节内容")
    sources: list[str] = Field(
        default_factory=list, description="Source URLs used / 引用的来源 URL"
    )
    search_queries: list[str] = Field(
        default_factory=list, description="Search queries executed / 执行的搜索查询"
    )


class ResearchResponse(BaseModel):
    """Response model for completed research.

    完成的研究响应模型。
    """

    session_id: str = Field(..., description="Unique session identifier / 唯一会话标识")
    query: str = Field(..., description="Original research query / 原始研究主题")
    report: str = Field(
        ..., description="Complete Markdown report / 完整 Markdown 报告"
    )
    sections: list[SectionResult] = Field(
        default_factory=list, description="Individual section results / 各章节结果"
    )
    total_sources: int = Field(
        default=0, ge=0, description="Total unique sources cited / 引用的唯一来源总数"
    )
    execution_time: float = Field(
        ..., ge=0, description="Total execution time in seconds / 总执行时间（秒）"
    )
    search_engine_used: str = Field(
        ..., description="Search engine actually used / 实际使用的搜索引擎"
    )


# =============================================================================
# Progress Models (进度模型 - WebSocket)
# =============================================================================


class ResearchProgress(BaseModel):
    """Progress event for WebSocket streaming.

    WebSocket 流式输出的进度事件。

    Events:
        - started: Research started
        - section_started: Section processing started
        - searching: Executing search query
        - summarizing: LLM summarizing results
        - reflecting: LLM identifying information gaps
        - section_completed: Section finished
        - completed: All research finished
        - error: Error occurred
    """

    event: str = Field(..., description="Event type / 事件类型")
    session_id: str = Field(default="", description="Session identifier / 会话标识")
    current_section: str | None = Field(
        default=None, description="Current section being processed / 当前处理的章节"
    )
    current_round: int | None = Field(
        default=None, ge=0, description="Current reflection round / 当前反思轮次"
    )
    total_sections: int | None = Field(
        default=None, ge=0, description="Total number of sections / 总章节数"
    )
    message: str | None = Field(
        default=None, description="Human-readable progress message / 可读的进度消息"
    )
    progress: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Progress percentage (0.0-1.0), omit to keep previous / 进度百分比",
    )
    section_index: int | None = Field(
        default=None,
        ge=0,
        description="Index of the section this event belongs to (for parallel tracking)",
    )
    section_title: str | None = Field(
        default=None,
        description="Title of the section this event belongs to",
    )
    section_status: str | None = Field(
        default=None,
        description="Per-section status: queued / running / done / error",
    )
    data: dict | None = Field(
        default=None,
        description="Arbitrary extra data payload for the event",
    )


# =============================================================================
# Internal Structure Models (内部结构模型)
# =============================================================================


class ReportSection(BaseModel):
    """Section definition in report structure.

    报告结构中的章节定义。
    """

    title: str = Field(..., description="Section title / 章节标题")
    search_query: str = Field(..., description="Initial search query / 初始搜索查询")
    description: str | None = Field(
        default=None, description="Section description / 章节描述"
    )


class ReportStructure(BaseModel):
    """Report structure generated by LLM.

    LLM 生成的报告结构。
    """

    title: str = Field(..., description="Report title / 报告标题")
    sections: list[ReportSection] = Field(
        default_factory=list, min_length=1, description="Report sections / 报告章节"
    )


class SearchResult(BaseModel):
    """Search result from search engine.

    搜索引擎返回的搜索结果。
    """

    title: str = Field(..., description="Result title / 结果标题")
    url: str = Field(..., description="Result URL / 结果链接")
    snippet: str = Field(default="", description="Result snippet/content / 结果摘要")
    score: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Relevance score (0.0-1.0) / 相关性分数",
    )
