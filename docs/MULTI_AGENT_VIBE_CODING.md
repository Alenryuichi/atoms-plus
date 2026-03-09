# Multi-Agent Vibe Coding 架构方案

> 基于 MiroFish GraphRAG 启发，实现结构化多 Agent 协作的 Vibe Coding 体验

## 1. 概述

### 1.1 问题陈述

**当前状态**: 单 Agent 线性生成
- 大型项目容易混乱、遗漏
- 无法并行处理多个模块
- 缺乏结构化理解

**目标状态**: 多 Agent 结构化协作
- 每个 Agent 专注一个模块（页面/组件/API）
- 基于项目图谱进行任务分解
- 共享上下文保持一致性

### 1.2 MiroFish 启发

MiroFish 的核心流程：
```
种子材料 → GraphRAG 本体生成 → 仿真世界 → 多轮预测 → 反思修正
```

映射到 Vibe Coding：
```
用户描述 → Deep Research (调研) 
              ↓
         → Project Graph (结构) 
              ↓
         → Multi-Agent 协作 (执行)
              ↓
         → 共享记忆 + 反思 (迭代)
```

## 2. 架构设计

### 2.1 四阶段流程

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Vibe Coding Pipeline                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Phase 1: Deep Research                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 用户: "做一个类似 Notion 的笔记应用"                              │   │
│  │                     ↓                                            │   │
│  │ DeepResearchAgent (MCP WebSearch + LLM)                          │   │
│  │   • 竞品分析 (Notion, Obsidian, Roam)                            │   │
│  │   • 技术选型 (TipTap vs Slate vs Lexical)                        │   │
│  │   • UI/UX 模式                                                   │   │
│  │                     ↓                                            │   │
│  │ 输出: ResearchReport                                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Phase 2: Project Graph                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ResearchReport + 用户描述                                        │   │
│  │                     ↓                                            │   │
│  │ GraphGenerator (LLM)                                             │   │
│  │   • 提取实体 (Pages, Components, Hooks, Models)                  │   │
│  │   • 分析关系 (contains, uses, calls)                             │   │
│  │   • 注入技术决策                                                  │   │
│  │                     ↓                                            │   │
│  │ 输出: ProjectGraph                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Phase 3: Task Decomposition                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ProjectGraph                                                     │   │
│  │                     ↓                                            │   │
│  │ Orchestrator                                                     │   │
│  │   • 依赖分析 (拓扑排序)                                          │   │
│  │   • 任务分解 (每个 Entity → 任务)                                │   │
│  │   • Agent 分配                                                   │   │
│  │                     ↓                                            │   │
│  │ 输出: TaskGraph + ExecutionPlan                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Phase 4: Multi-Agent Execution                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    SharedContext                                 │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │ • ProjectGraph • TechDecisions • GeneratedFiles        │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  │        │              │              │              │           │   │
│  │        ▼              ▼              ▼              ▼           │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │   │
│  │  │ Infra    │  │Component │  │  Page    │  │  Page    │        │   │
│  │  │ Agent    │→ │ Agent    │→ │ Agent 1  │  │ Agent 2  │        │   │
│  │  │(hooks)   │  │          │  │ (Editor) │  │(Sidebar) │        │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │   │
│  │                                    ↓                            │   │
│  │                            ReviewerAgent                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 数据模型

#### ProjectGraph (项目图谱)

```python
@dataclass
class ProjectGraph:
    name: str                      # "notion-clone"
    description: str               # "A Notion-like note-taking app"
    entities: list[Entity]         # 所有实体
    relations: list[Relation]      # 实体间关系
    tech_stack: TechStack          # 技术栈
    tech_decisions: dict           # 来自 ResearchReport 的技术决策
    features: list[str]            # 功能列表

@dataclass
class Entity:
    id: str                        # "p1", "c1", "h1"
    name: str                      # "EditorPage"
    type: EntityType               # page, component, hook, model, api
    description: str               # "Main editor page with block editing"
    properties: list[str]          # 属性 (for models)
    methods: list[str]             # 方法 (for services)
    dependencies: list[str]        # 依赖的其他 Entity ID

@dataclass
class Relation:
    source: str                    # Entity ID
    target: str                    # Entity ID
    type: RelationType             # contains, uses, calls, manages
    label: str                     # 可选描述
```

#### SharedContext (共享上下文)

```python
@dataclass
class SharedContext:
    # 只读 - 所有 Agent 共享
    project_graph: ProjectGraph
    research_report: str
    design_tokens: dict

    # 动态更新 - Agent 完成后更新
    generated_files: dict[str, list[str]]  # path -> exported symbols
    api_contracts: dict[str, str]          # hook/component -> interface

    # 约束
    agent_boundaries: dict[str, str]       # agent_id -> allowed_directory
```

## 3. Agent 设计

### 3.1 Agent 类型与职责

| Agent | 职责 | 输入 | 输出 | 目录边界 |
|-------|------|------|------|----------|
| **InfraAgent** | hooks, utils, types | ProjectGraph | GeneratedFiles | `src/hooks/`, `src/utils/`, `src/types/` |
| **ComponentAgent** | 共享组件 | ProjectGraph + InfraOutput | Components | `src/components/` |
| **PageAgent** | 单个页面 | All above + PageEntity | Page files | `src/pages/{page}/` |
| **ReviewerAgent** | 一致性检查 | All outputs | Review report | 只读 |

### 3.2 执行顺序 (拓扑排序)

```
Level 0: Types/Models ────────────────────────────────────┐
         (纯类型定义，无依赖)                               │
                                                          │
Level 1: InfraAgent ──────────────────────────────────────┤
         (hooks/utils，只依赖 Types)                       │
                                                          │
Level 2: ComponentAgent ──────────────────────────────────┤
         (依赖 hooks/types)                                │
                                                          │
Level 3: PageAgents (并行) ───────────────────────────────┤
         • PageAgent(Editor)                              │
         • PageAgent(Sidebar)                             │
         • PageAgent(Settings)                            │
                                                          │
Level 4: ReviewerAgent ───────────────────────────────────┘
         (检查一致性)
```

### 3.3 Agent 粒度决策

| 粒度 | 优点 | 缺点 | 选择 |
|------|------|------|------|
| 每个文件一个 Agent | 最细粒度控制 | 协调成本高 | ❌ |
| 每个页面一个 Agent | 平衡粒度，可并行 | - | ✅ |
| 每类实体一个 Agent | 专业化强 | 页面多时不够并行 | ✅ |
| 单一 Agent | 简单 | 大项目容易混乱 | ❌ |

**推荐**: 混合模式
- Infra (hooks/utils) → 1 个 Agent
- Components → 1 个 Agent
- Pages → 每个 Page 1 个 Agent (可并行)

## 4. 详细流程

### 4.1 Phase 1: Deep Research

```python
async def deep_research(query: str, max_rounds: int = 2) -> ResearchReport:
    """
    执行深度研究，返回结构化研究报告。

    流程:
    1. 生成报告结构 (LLM)
    2. 对每个章节执行: 搜索 → 总结 → 反思 → 补充搜索
    3. 生成最终报告 + 技术决策
    """
    # 1. 生成报告大纲
    structure = await generate_structure(query)
    # sections: ["竞品分析", "技术选型", "UI/UX模式", "存储方案"]

    # 2. 对每个章节执行搜索-反思循环
    for section in structure.sections:
        results = await mcp_web_search(section.search_query)
        summary = await llm_summarize(results, section.topic)

        for _ in range(max_rounds):
            gaps = await llm_reflect(summary)
            if gaps == "COMPLETE":
                break
            additional = await mcp_web_search(gaps)
            summary = await llm_summarize(results + additional)

        section.content = summary

    # 3. 提取技术决策
    tech_decisions = await extract_tech_decisions(structure)

    return ResearchReport(
        content=format_markdown(structure),
        tech_decisions=tech_decisions,
    )
```

### 4.2 Phase 2: Project Graph Generation

```python
async def generate_project_graph(
    user_input: str,
    research_report: ResearchReport | None = None,
) -> ProjectGraph:
    """
    从用户输入和研究报告生成项目图谱。

    如果有 ResearchReport:
    - 使用其中的技术决策
    - 参考竞品分析结果
    """
    prompt = PROJECT_GRAPH_PROMPT.format(
        user_input=user_input,
        tech_decisions=research_report.tech_decisions if research_report else {},
    )

    response = await llm_call(prompt)
    graph = parse_graph_json(response)

    # 注入技术决策
    if research_report:
        graph.tech_decisions = research_report.tech_decisions

    return graph


### 4.3 Phase 3: Task Decomposition (Orchestrator)

```python
async def decompose_tasks(graph: ProjectGraph) -> ExecutionPlan:
    """
    将项目图谱分解为可执行的任务列表。

    步骤:
    1. 拓扑排序确定依赖顺序
    2. 为每个 Entity 创建任务
    3. 分配 Agent 类型
    4. 生成执行计划
    """
    # 1. 拓扑排序
    sorted_entities = topological_sort(graph.entities, graph.relations)

    # 2. 按类型分组
    groups = {
        "types": [e for e in sorted_entities if e.type == "model"],
        "infra": [e for e in sorted_entities if e.type in ("hook", "util")],
        "components": [e for e in sorted_entities if e.type == "component"],
        "pages": [e for e in sorted_entities if e.type == "page"],
    }

    # 3. 创建任务
    tasks = []

    # Level 0: Types (串行，通常很少)
    for entity in groups["types"]:
        tasks.append(Task(
            id=f"task-{entity.id}",
            agent_type="infra",
            entity=entity,
            level=0,
            dependencies=[],
        ))

    # Level 1: Infra (由 InfraAgent 统一处理)
    if groups["infra"]:
        tasks.append(Task(
            id="task-infra",
            agent_type="infra",
            entities=groups["infra"],
            level=1,
            dependencies=[t.id for t in tasks if t.level == 0],
        ))

    # Level 2: Components (由 ComponentAgent 统一处理)
    if groups["components"]:
        tasks.append(Task(
            id="task-components",
            agent_type="component",
            entities=groups["components"],
            level=2,
            dependencies=["task-infra"],
        ))

    # Level 3: Pages (每个 Page 一个任务，可并行)
    for entity in groups["pages"]:
        tasks.append(Task(
            id=f"task-{entity.id}",
            agent_type="page",
            entity=entity,
            level=3,
            dependencies=["task-components"],
        ))

    # Level 4: Review (最后执行)
    tasks.append(Task(
        id="task-review",
        agent_type="reviewer",
        level=4,
        dependencies=[t.id for t in tasks if t.level == 3],
    ))

    return ExecutionPlan(tasks=tasks)


### 4.4 Phase 4: Multi-Agent Execution

```python
async def execute_plan(
    plan: ExecutionPlan,
    shared_context: SharedContext,
) -> ExecutionResult:
    """
    执行任务计划，支持按 Level 并行。
    """
    results = {}

    # 按 Level 分组执行
    for level in sorted(set(t.level for t in plan.tasks)):
        level_tasks = [t for t in plan.tasks if t.level == level]

        # 同一 Level 的任务可以并行
        level_results = await asyncio.gather(*[
            execute_task(task, shared_context, results)
            for task in level_tasks
        ])

        # 更新结果和共享上下文
        for task, result in zip(level_tasks, level_results):
            results[task.id] = result

            # 更新 generated_files
            if result.generated_files:
                shared_context.generated_files.update(result.generated_files)

            # 更新 api_contracts
            if result.exports:
                shared_context.api_contracts.update(result.exports)

    return ExecutionResult(
        success=all(r.success for r in results.values()),
        results=results,
        generated_files=shared_context.generated_files,
    )


async def execute_task(
    task: Task,
    shared_context: SharedContext,
    completed_results: dict,
) -> TaskResult:
    """
    执行单个任务。

    每个 Agent 收到:
    - 只与其相关的 Entity 信息
    - 可用的依赖 (已生成的文件和导出)
    - 目录边界约束
    """
    # 构建 Agent 上下文
    agent_context = build_agent_context(task, shared_context, completed_results)

    # 选择 Agent
    agent = get_agent_for_type(task.agent_type)

    # 执行
    result = await agent.execute(agent_context)

    return result
```

## 5. 共享上下文管理

### 5.1 上下文结构

```typescript
interface SharedContext {
  // === 只读部分 (所有 Agent 共享) ===

  // 项目图谱
  projectGraph: ProjectGraph;

  // 研究报告
  researchReport: string;

  // 技术决策
  techDecisions: {
    editor: "TipTap";        // 来自 ResearchReport
    styling: "Tailwind";
    stateManagement: "Zustand";
    storage: "IndexedDB + Supabase";
  };

  // 设计规范
  designTokens: {
    colors: { primary: "#3B82F6", ... };
    spacing: { sm: "0.5rem", ... };
    typography: { ... };
  };

  // === 动态更新部分 ===

  // 已生成的文件及其导出
  generatedFiles: {
    "src/hooks/useEditor.ts": ["useEditor", "EditorState", "EditorConfig"];
    "src/components/Block.tsx": ["Block", "BlockProps"];
  };

  // API 契约 (类型定义)
  apiContracts: {
    "useEditor": "export function useEditor(config?: EditorConfig): EditorState";
    "Block": "export interface BlockProps { id: string; type: BlockType; ... }";
  };

  // === Agent 约束 ===

  // 目录边界 (每个 Agent 只能在其边界内创建/修改文件)
  agentBoundaries: {
    "infra-agent": ["src/hooks/", "src/utils/", "src/types/"];
    "component-agent": ["src/components/"];
    "page-agent-editor": ["src/pages/editor/"];
    "page-agent-sidebar": ["src/pages/sidebar/"];
  };
}
```

### 5.2 上下文注入到 System Prompt

```python
def build_agent_system_prompt(
    agent_type: str,
    task: Task,
    shared_context: SharedContext,
) -> str:
    """
    为特定 Agent 构建 System Prompt。
    """

    # 基础 prompt
    base_prompt = AGENT_BASE_PROMPTS[agent_type]

    # 注入项目理解
    project_section = f"""
## Project Understanding

**Project**: {shared_context.project_graph.name}
**Description**: {shared_context.project_graph.description}

### Tech Stack
{format_tech_stack(shared_context.tech_decisions)}

### Your Assignment
{format_entity_assignment(task.entity)}

### Available Dependencies
{format_available_deps(shared_context.generated_files, shared_context.api_contracts)}

### CONSTRAINTS
- You can ONLY create/modify files in: {shared_context.agent_boundaries[agent_type]}
- You MUST use the provided hooks and components via import
- You MUST NOT redefine types that already exist in api_contracts
"""

    return base_prompt + project_section
```

## 6. 与 MiroFish 的对应关系

| MiroFish 概念 | Atoms Plus 对应 | 说明 |
|--------------|-----------------|------|
| 种子材料 (新闻/小说) | 用户项目描述 | 输入源 |
| `ontology_generator` | `generate_project_graph()` | 结构提取 |
| 实体 (人物/组织/事件) | 实体 (Page/Component/Hook/Model) | 基本单元 |
| 关系 (社会关系/因果) | 关系 (contains/uses/calls) | 连接 |
| GraphRAG 图谱 | ProjectGraph | 结构化表示 |
| 仿真环境 (世界模型) | 项目结构 + SharedContext | 执行环境 |
| 多轮预测 | Multi-Agent 并行执行 | 生成过程 |
| Zep 长期记忆 | SharedContext + 文件系统 | 状态持久化 |
| 反思机制 | ReviewerAgent + 用户反馈 | 质量保证 |
| 报告生成 | 可运行的 Web 应用 | 最终输出 |

### 6.1 核心理念映射

**MiroFish**: "群体智能涌现预测"
```
种子 → 图谱 → 仿真世界 → 多轮模拟 → 预测报告
```

**Atoms Plus**: "结构化多 Agent 代码生成"
```
描述 → 研究 → 图谱 → 任务分解 → 并行生成 → 可运行应用
```

## 7. 实现文件结构

```
atoms_plus/
├── deep_research/              # Phase 1: 深度研究
│   ├── __init__.py
│   ├── mcp_search.py           # MCP WebSearch 封装
│   ├── prompts.py              # 研究相关 prompts
│   └── research.py             # 核心研究逻辑
│
├── project_graph/              # Phase 2: 项目图谱 (已有基础)
│   ├── __init__.py
│   ├── models.py               # 数据模型
│   ├── generator.py            # LLM 图谱生成
│   └── dependency_analyzer.py  # 新增: 依赖分析/拓扑排序
│
├── multi_agent/                # Phase 3 & 4: 多 Agent 协作
│   ├── __init__.py
│   ├── orchestrator.py         # 任务分解 + 调度
│   ├── shared_context.py       # 共享上下文管理
│   ├── executor.py             # 执行引擎
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── base_agent.py       # Agent 基类
│   │   ├── infra_agent.py      # Hooks/Utils/Types Agent
│   │   ├── component_agent.py  # 组件 Agent
│   │   ├── page_agent.py       # 页面 Agent
│   │   └── reviewer_agent.py   # 审查 Agent
│   └── prompts/
│       ├── __init__.py
│       ├── infra.py            # InfraAgent prompts
│       ├── component.py        # ComponentAgent prompts
│       ├── page.py             # PageAgent prompts
│       └── reviewer.py         # ReviewerAgent prompts
│
└── roles/                      # 现有: Vibe Coding 指令
    └── vibe_coding_instructions.py  # 修改: 集成图谱
```

## 8. 实施路线图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          实施路线图                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Phase A: Deep Research (基础设施)                     优先级: ⭐⭐⭐    │
│  ────────────────────────────────                                       │
│  [ ] 创建 atoms_plus/deep_research/ 目录                                │
│  [ ] 实现 mcp_search.py (MCP WebSearch 封装)                            │
│  [ ] 实现 prompts.py (结构生成/总结/反思 prompts)                        │
│  [ ] 实现 research.py (搜索-总结-反思循环)                               │
│  [ ] 作为 Agent Skill 集成到 CodeActAgent                               │
│                                                                         │
│  Phase B: Project Graph 增强                          优先级: ⭐⭐⭐    │
│  ────────────────────────────────                                       │
│  [ ] 添加 dependency_analyzer.py (拓扑排序)                              │
│  [ ] 从 ResearchReport 注入技术决策                                     │
│  [ ] 实现任务分解逻辑                                                   │
│  [ ] 测试图谱生成质量                                                   │
│                                                                         │
│  Phase C: Multi-Agent 基础                            优先级: ⭐⭐      │
│  ────────────────────────────────                                       │
│  [ ] 创建 atoms_plus/multi_agent/ 目录结构                              │
│  [ ] 实现 SharedContext 数据结构                                        │
│  [ ] 实现 Agent 基类和 prompts                                          │
│  [ ] 实现 Orchestrator (顺序执行模式)                                   │
│                                                                         │
│  Phase D: 并行执行 + 优化                              优先级: ⭐       │
│  ────────────────────────────────                                       │
│  [ ] 实现并行执行 (asyncio.gather)                                      │
│  [ ] 实现 ReviewerAgent (一致性检查)                                    │
│  [ ] 添加迭代反馈循环                                                   │
│  [ ] 性能优化和错误处理                                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 9. 相关文档

- [Deep Research 集成方案](./DEEP_RESEARCH_INTEGRATION.md) - Phase A 详细实现
- [项目图谱模型](../atoms_plus/project_graph/models.py) - 数据模型定义
- [Vibe Coding 指令](../atoms_plus/roles/vibe_coding_instructions.py) - 指令模板

## 10. 参考

- [MiroFish (微舆)](https://github.com/666ghj/MiroFish) - GraphRAG 多智能体预测引擎
- [OASIS](https://github.com/camel-ai/oasis) - 社会仿真平台
- [OpenHands](https://github.com/All-Hands-AI/OpenHands) - AI 软件工程师平台
