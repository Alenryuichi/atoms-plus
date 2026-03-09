# Multi-Agent Vibe Coding 架构方案

> 基于 MiroFish GraphRAG 启发，实现结构化多 Agent 协作的 Vibe Coding 体验

## ⚡ 深度评估发现 (2026-03-09)

本文档经过 5 个专业 Agent 的深度评审，发现并修复了以下关键问题：

### ✅ 已修复

| 问题 | 严重性 | 修复内容 |
|------|--------|---------|
| **API 使用错误** | 🔴 P0 | `agent.run()` → 使用 V1 SDK 的 `AgentContext.system_message_suffix` |
| **Entity 缺少 id 字段** | 🔴 P0 | 已在 `atoms_plus/project_graph/models.py` 添加 `id` 和 `dependencies` 字段 |
| **缺少 Context/Provider/Layout Level** | 🟠 P1 | 已更新 Level 分层 (0-7)，包含 Contexts, Providers, Layouts |

### ⚠️ 待实现

| 问题 | 严重性 | 建议 |
|------|--------|------|
| **Context Window 溢出** | 🟠 P1 | 实现增量上下文，只注入直接依赖 |
| **SharedContext 线程安全** | 🟠 P1 | 使用 `asyncio.Lock` 或不可变模式 |
| **结构化 API 契约** | 🟡 P2 | 改为 dict 格式而非字符串 |
| **测试策略缺失** | 🟡 P2 | 添加单元/集成/E2E 测试计划 |

### 📊 评审评分

| Agent | 评估维度 | 评分 |
|-------|---------|------|
| Tech Lead | 整体架构 | 7.5/10 |
| Python Expert | 代码实现 | 4.5/10 → 修复后预估 7/10 |
| API Architect | SharedContext 设计 | 6.5/10 |
| React Architect | 前端生成 | 7.5/10 → 修复后预估 8.5/10 |
| Code Reviewer | 实施路线图 | 7/10 |

---

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

> **React Architect 评审反馈**: 原方案缺少 Context/Provider/Layout 层级，这对 React 全局状态和 Next.js 布局至关重要。

```
Level 0: Types/Constants ─────────────────────────────────┐
         (纯类型定义，无依赖)                               │
         • src/types/*.ts                                  │
         • src/constants/*.ts                              │
                                                          │
Level 1: Contexts/Lib ────────────────────────────────────┤
         (React Context 定义 + 第三方库封装)                │
         • src/contexts/*.tsx  (AuthContext, ThemeContext) │
         • src/lib/*.ts        (supabase client)           │
                                                          │
Level 2: InfraAgent ──────────────────────────────────────┤
         (hooks/utils，依赖 Types + Contexts)              │
         • src/hooks/*.ts                                  │
         • src/utils/*.ts                                  │
                                                          │
Level 3: Providers ───────────────────────────────────────┤
         (Context Providers，依赖 hooks)                   │
         • src/providers/*.tsx                             │
                                                          │
Level 4: ComponentAgent ──────────────────────────────────┤
         (依赖 hooks/types/contexts)                       │
         • src/components/*.tsx                            │
                                                          │
Level 5: Layouts (Next.js) ───────────────────────────────┤
         (页面布局，依赖 Providers + Components)           │
         • src/app/layout.tsx                              │
         • src/app/*/layout.tsx                            │
                                                          │
Level 6: PageAgents (并行) ───────────────────────────────┤
         • PageAgent(Editor)                              │
         • PageAgent(Sidebar)                             │
         • PageAgent(Settings)                            │
                                                          │
Level 7: ReviewerAgent ───────────────────────────────────┘
         (检查一致性，RSC 边界验证)
```

**新增 Level 说明**:

| Level | 类型 | 原因 |
|-------|------|------|
| 1 | Contexts | React 全局状态 (AuthContext, ThemeContext) 需在 hooks 前定义 |
| 3 | Providers | Context.Provider 组件包装 hooks 逻辑 |
| 5 | Layouts | Next.js App Router 的 layout.tsx 是页面的父级 |

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

### 3.4 实现方案选择

| 方案 | 描述 | 优点 | 缺点 | 选择 |
|------|------|------|------|------|
| **A: Handoff** | Agent 间传递控制权 | 职责清晰 | 串行执行 | ❌ |
| **B: 多实例** | 每个任务独立 Agent | 真正并行 | 资源消耗大 | ❌ |
| **C: 单 Agent + 动态 Prompt** | Orchestrator 控制单 Agent 多轮执行 | 复用基础设施 | 页面间串行 | ✅ |
| **D: Team Mode** | 基于 LangGraph | 成熟架构 | 当前先不用 | 🔜 |

**选择方案 C 的原因**:
1. 不需要修改 CodeActAgent 核心代码
2. 复用单个 Runtime/Sandbox
3. 通过动态 System Prompt "切换角色"
4. 共享上下文通过 Prompt 更新传递

## 4. 方案 C 详解: 单 CodeActAgent + 动态 Prompt

### 4.1 核心思想

**不创建多个 Agent 实例，而是用一个 Orchestrator (纯 Python) 控制单个 CodeActAgent 的多轮对话，每轮通过不同的 System Prompt "切换角色"。**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         VibeCodingOrchestrator                          │
│                         (纯 Python 类，不是 Agent)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. 接收用户输入: "做一个类似 Notion 的笔记应用"                          │
│                                                                         │
│  2. [可选] 执行 Deep Research → 获得技术决策                             │
│                                                                         │
│  3. 生成 ProjectGraph → 提取实体和关系                                   │
│                                                                         │
│  4. 分解任务 → ExecutionPlan (按 Level 排序)                             │
│                                                                         │
│  5. 按 Level 顺序执行:                                                   │
│     ┌─────────────────────────────────────────────────────────────────┐ │
│     │ Level 0: Types                                                  │ │
│     │   - 设置 System Prompt = "TypeScript 类型专家"                  │ │
│     │   - 触发 CodeActAgent 生成 src/types/*.ts                       │ │
│     │   - 收集生成的文件和导出符号                                     │ │
│     │   - 更新 SharedContext                                          │ │
│     ├─────────────────────────────────────────────────────────────────┤ │
│     │ Level 1: Infra (Hooks)                                          │ │
│     │   - 设置 System Prompt = "React Hooks 专家"                     │ │
│     │   - Prompt 中注入 Level 0 的导出 (可用的 Types)                  │ │
│     │   - 触发 CodeActAgent 生成 src/hooks/*.ts                       │ │
│     │   - 更新 SharedContext                                          │ │
│     ├─────────────────────────────────────────────────────────────────┤ │
│     │ Level 2: Components                                             │ │
│     │   - 设置 System Prompt = "React 组件专家"                       │ │
│     │   - Prompt 中注入 Types + Hooks 的导出                          │ │
│     │   - 触发 CodeActAgent 生成 src/components/*.tsx                 │ │
│     │   - 更新 SharedContext                                          │ │
│     ├─────────────────────────────────────────────────────────────────┤ │
│     │ Level 3: Pages (串行执行每个页面)                                │ │
│     │   - 设置 System Prompt = "React 页面专家 (EditorPage)"          │ │
│     │   - Prompt 中注入所有可用依赖                                    │ │
│     │   - 约束: 只能在 src/pages/editor/ 创建文件                      │ │
│     │   - ... 对每个页面重复 ...                                       │ │
│     └─────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  6. 输出完整项目                                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 每个 Level 的执行示例

#### Level 0: Types (类型定义)

```python
# Orchestrator 内部逻辑

# 1. 构建 System Prompt
system_prompt = """
You are a TypeScript type definition expert.

## Project: Notion-like Note App

## Your Task
Generate TypeScript type definitions for:
- Document: A document containing blocks
- Block: A content block (paragraph, heading, list, etc.)

## Tech Decisions
- Use Zod for runtime validation
- Export both types and Zod schemas

## Output Directory
You can ONLY create files in: src/types/
"""

# 2. 发送给 CodeActAgent
agent.set_system_prompt(system_prompt)
result = await agent.run("Generate the type definitions as specified above.")

# 3. Agent 执行后生成:
# - src/types/document.ts
# - src/types/block.ts
# - src/types/index.ts

# 4. 更新共享上下文
shared_context.generated_files["src/types/document.ts"] = ["Document", "DocumentSchema"]
shared_context.generated_files["src/types/block.ts"] = ["Block", "BlockType", "BlockSchema"]
shared_context.api_contracts["Document"] = "export interface Document { id: string; title: string; blocks: Block[]; }"
shared_context.api_contracts["Block"] = "export interface Block { id: string; type: BlockType; content: string; }"
```

#### Level 1: Infra (Hooks) - 包含上一步的输出

```python
# System Prompt 包含 Level 0 的输出!
system_prompt = f"""
You are a React Hooks expert.

## Project: Notion-like Note App

## Your Task
Generate React hooks:
- useEditor: Manages TipTap editor state
- useDocument: Manages document CRUD operations

## Tech Decisions
- Editor: TipTap (from research)
- State: Zustand for global state

## Available Types (from previous step - import these!)
```typescript
// From src/types/document.ts
{shared_context.api_contracts["Document"]}

// From src/types/block.ts
{shared_context.api_contracts["Block"]}
```

## Output Directory
You can ONLY create files in: src/hooks/

## IMPORTANT
- Import types from '@/types'
- Do NOT redefine Document or Block types
"""

# 执行后更新 SharedContext
shared_context.generated_files["src/hooks/useEditor.ts"] = ["useEditor", "EditorState"]
shared_context.api_contracts["useEditor"] = "export function useEditor(): { editor: Editor; ... }"
```

#### Level 2 & 3: 累积可用依赖

```python
# Level 2: Components
# Prompt 中包含: Types + Hooks

# Level 3: Pages
# Prompt 中包含: Types + Hooks + Components
# 并且有目录约束: src/pages/{page_name}/ 只能操作特定目录
```

## 5. Orchestrator 代码实现

### 5.1 核心类定义

```python
# atoms_plus/multi_agent/orchestrator.py

from dataclasses import dataclass, field
from typing import Any

@dataclass
class SharedContext:
    """跨任务共享的上下文"""
    project_graph: dict = field(default_factory=dict)
    tech_decisions: dict = field(default_factory=dict)
    generated_files: dict[str, list[str]] = field(default_factory=dict)  # path -> exported symbols
    api_contracts: dict[str, str] = field(default_factory=dict)          # symbol -> type signature

    def get_available_imports(self, allowed_sources: list[str]) -> str:
        """格式化可用的导入，供 Prompt 使用"""
        imports = []
        for path, symbols in self.generated_files.items():
            if any(path.startswith(src) for src in allowed_sources):
                for symbol in symbols:
                    if symbol in self.api_contracts:
                        imports.append(f"// From {path}\n{self.api_contracts[symbol]}")
        return "\n\n".join(imports)


class VibeCodingOrchestrator:
    """
    协调多阶段 Vibe Coding 执行。

    核心机制:
    1. 不创建多个 Agent 实例
    2. 通过动态 System Prompt "切换角色"
    3. 每轮执行后更新 SharedContext
    4. 下一轮 Prompt 包含上一轮的输出信息
    """

    # 更新后的 Level 分层 (基于 React Architect 评审)
    EXECUTION_LEVELS = {
        0: ["types", "constants"],      # 纯定义，无依赖
        1: ["contexts", "lib"],          # Context 定义 + 第三方封装
        2: ["hooks", "utils"],           # 状态逻辑 (infra)
        3: ["providers"],                # Context Providers
        4: ["components"],               # UI 组件
        5: ["layouts"],                  # Next.js Layouts
        6: ["pages"],                    # 页面 (可并行)
        7: ["review"],                   # 一致性检查
    }

    ROLE_PROMPTS = {
        "types": "You are a TypeScript type definition expert. Create clean, well-documented type definitions.",
        "constants": "You are a TypeScript constants expert. Define application-wide constants and enums.",
        "contexts": "You are a React Context expert. Create typed React Context definitions for global state.",
        "lib": "You are an integration expert. Create type-safe wrappers for third-party services (Supabase, etc).",
        "hooks": "You are a React Hooks expert. Create reusable, well-tested custom hooks.",
        "utils": "You are a utility functions expert. Create pure, well-typed helper functions.",
        "providers": "You are a React Provider expert. Create Context Providers that wrap hooks and state logic.",
        "components": "You are a React Component expert. Create accessible, performant components with Tailwind CSS.",
        "layouts": "You are a Next.js Layout expert. Create app layouts with proper provider hierarchy.",
        "pages": "You are a React Page expert. Create complete page layouts that integrate all components.",
        "review": "You are a Code Reviewer. Check for consistency, missing imports, RSC boundaries, and type errors.",
    }

    DIRECTORY_BOUNDARIES = {
        "types": ["src/types/"],
        "constants": ["src/constants/"],
        "contexts": ["src/contexts/"],
        "lib": ["src/lib/"],
        "hooks": ["src/hooks/"],
        "utils": ["src/utils/"],
        "providers": ["src/providers/"],
        "components": ["src/components/"],
        "layouts": ["src/app/"],           # Next.js App Router layouts
        "pages": ["src/app/"],              # 具体页面会进一步限制
        "review": [],                       # 只读
    }

    IMPORT_SOURCES = {
        "types": [],                                                    # Level 0: 无依赖
        "constants": ["src/types/"],                                    # Level 0: 可依赖 types
        "contexts": ["src/types/"],                                     # Level 1
        "lib": ["src/types/"],                                          # Level 1
        "hooks": ["src/types/", "src/contexts/", "src/lib/"],           # Level 2
        "utils": ["src/types/"],                                        # Level 2
        "providers": ["src/types/", "src/contexts/", "src/hooks/"],     # Level 3
        "components": ["src/types/", "src/hooks/", "src/contexts/"],    # Level 4
        "layouts": ["src/providers/", "src/components/"],               # Level 5
        "pages": ["src/types/", "src/hooks/", "src/components/", "src/layouts/"],  # Level 6
    }

    def __init__(self, agent, llm_client):
        self.agent = agent  # CodeActAgent 实例
        self.llm = llm_client
        self.context = SharedContext()

    async def execute(self, user_input: str) -> dict:
        """完整执行流程"""

        # Phase 1: Deep Research (可选)
        research = await self._deep_research(user_input)
        self.context.tech_decisions = research.get("tech_decisions", {})

        # Phase 2: Generate Project Graph
        graph = await self._generate_graph(user_input, research)
        self.context.project_graph = graph

        # Phase 3: Decompose Tasks
        tasks = self._decompose_tasks(graph)

        # Phase 4: Execute by Level
        for level in sorted(set(t["level"] for t in tasks)):
            level_tasks = [t for t in tasks if t["level"] == level]

            for task in level_tasks:
                await self._execute_task(task)

        return {"success": True, "files": self.context.generated_files}

    async def _execute_task(self, task: dict):
        """执行单个任务

        V1 架构说明:
        - OpenHands V1 使用 Software Agent SDK (openhands/sdk/)
        - Agent 通过 AgentContext.system_message_suffix 接收额外指令
        - 不直接调用 agent.run()，而是通过 EventStream 发送消息
        - 参考: openhands/app_server/app_conversation/live_status_app_conversation_service.py
        """
        from openhands.sdk import AgentContext
        from openhands.agent_server.models import SendMessageRequest, TextContent

        # 1. 构建该任务的 System Prompt
        task_prompt = self._build_task_prompt(task)

        # 2. 创建带有任务指令的 AgentContext
        # V1 使用 system_message_suffix 而非 inject_instructions
        agent_context = AgentContext(
            system_message_suffix=task_prompt,
            secrets=None  # 如需要可传入 secrets
        )

        # 3. 更新 Agent 的 context (使用 pydantic model_copy)
        self.agent = self.agent.model_copy(update={'agent_context': agent_context})

        # 4. 通过 HTTP 发送消息到 Agent Server
        # V1 架构中，Agent 运行在独立的 sandbox 中，通过 REST API 通信
        user_message = f"Generate {task['type']}: {task['description']}"

        async with self.http_client as client:
            response = await client.post(
                f"{self.agent_server_url}/conversations/{self.conversation_id}/send-message",
                json={
                    "content": [{"type": "text", "text": user_message}]
                }
            )
            result = response.json()

        # 5. 解析结果，更新 SharedContext
        self._update_context_from_result(result, task)

    def _build_task_prompt(self, task: dict) -> str:
        """为任务构建 System Prompt"""

        task_type = task["type"]
        role_prompt = self.ROLE_PROMPTS[task_type]

        # 获取可用的导入
        import_sources = self.IMPORT_SOURCES.get(task_type, [])
        available_imports = self.context.get_available_imports(import_sources)

        # 获取目录边界
        boundaries = self.DIRECTORY_BOUNDARIES[task_type]
        if task_type == "page" and "entity" in task:
            # 页面任务限制到特定目录
            page_name = task["entity"]["name"].lower().replace("page", "")
            boundaries = [f"src/pages/{page_name}/"]

        return f"""
{role_prompt}

## Project Understanding
{self._format_project_summary()}

## Tech Decisions
{self._format_tech_decisions()}

## Your Task
{task["description"]}

## Available Dependencies (import these, do NOT recreate)
{available_imports if available_imports else "(none yet)"}

## Output Constraints
- You can ONLY create files in: {", ".join(boundaries)}
- You MUST use existing types/hooks/components via import
- Do NOT redefine types that already exist

## After Completion
List all files you created and their exports in this format:
FILE: path/to/file.ts
EXPORTS: Symbol1, Symbol2, Symbol3
"""

    def _update_context_from_result(self, result, task):
        """从 Agent 执行结果更新共享上下文"""
        # 解析 Agent 返回的 FILE/EXPORTS 格式
        # 更新 generated_files 和 api_contracts
        pass  # 实现略

    def _format_project_summary(self) -> str:
        """格式化项目摘要"""
        graph = self.context.project_graph
        if not graph:
            return "(not yet generated)"
        return f"Project: {graph.get('name', 'Unknown')}\nEntities: {len(graph.get('entities', []))}"

    def _format_tech_decisions(self) -> str:
        """格式化技术决策"""
        decisions = self.context.tech_decisions
        if not decisions:
            return "(using defaults: React + TypeScript + Tailwind)"
        return "\n".join(f"- {k}: {v}" for k, v in decisions.items())
```

### 5.2 与现有代码集成

```python
# 集成方式: 通过 Vibe Coding 入口点调用

# openhands/app_server/app_conversation/live_status_app_conversation_service.py

async def _maybe_inject_vibe_coding(self, ...):
    # 现有逻辑: 检测 Vibe Coding 模式

    # 新增: 检测是否需要多阶段协调
    if self._is_complex_project(user_message):
        # 启用 Orchestrator 模式
        orchestrator = VibeCodingOrchestrator(self.agent, self.llm)
        result = await orchestrator.execute(user_message)
        return result

    # 否则使用现有的单轮 Vibe Coding
    ...
```

## 6. 各阶段详细流程

### 6.1 Phase 1: Deep Research

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

### 6.2 Phase 2: Project Graph Generation

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


### 6.3 Phase 3: Task Decomposition (Orchestrator)

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


### 6.4 Phase 4: Multi-Agent Execution

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

## 7. 共享上下文管理

### 7.1 上下文结构

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

### 7.2 上下文注入到 System Prompt

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

## 8. 与 MiroFish 的对应关系

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

### 8.1 核心理念映射

**MiroFish**: "群体智能涌现预测"
```
种子 → 图谱 → 仿真世界 → 多轮模拟 → 预测报告
```

**Atoms Plus**: "结构化多 Agent 代码生成"
```
描述 → 研究 → 图谱 → 任务分解 → 并行生成 → 可运行应用
```

## 9. 实现文件结构

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

## 10. 实施路线图

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

## 11. 相关文档

- [Deep Research 集成方案](./DEEP_RESEARCH_INTEGRATION.md) - Phase A 详细实现
- [项目图谱模型](../atoms_plus/project_graph/models.py) - 数据模型定义
- [Vibe Coding 指令](../atoms_plus/roles/vibe_coding_instructions.py) - 指令模板

## 12. 参考

- [MiroFish (微舆)](https://github.com/666ghj/MiroFish) - GraphRAG 多智能体预测引擎
- [OASIS](https://github.com/camel-ai/oasis) - 社会仿真平台
- [OpenHands](https://github.com/All-Hands-AI/OpenHands) - AI 软件工程师平台
