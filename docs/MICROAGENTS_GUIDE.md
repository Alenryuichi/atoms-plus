# OpenHands Microagents 详解

Microagents 是 OpenHands 的**可插拔知识注入系统**，允许向 AI Agent 动态注入专业知识、项目规范和任务指南。

## 概览

```
┌─────────────────────────────────────────────────────────────────┐
│                    Microagent 加载来源                          │
├─────────────────────────────────────────────────────────────────┤
│  1. 全局目录: OpenHands/microagents/           (公共知识库)     │
│  2. 用户目录: ~/.openhands/microagents/        (个人定制)       │
│  3. 项目目录: .openhands/microagents/          (项目专属)       │
│  4. 特殊文件: .cursorrules, AGENTS.md          (第三方兼容)     │
└─────────────────────────────────────────────────────────────────┘
```

## 三种类型

### 1. Repo (`type: repo`) - 始终加载

```yaml
---
name: atoms-plus
type: repo          # 关键: 没有 triggers
---
# 项目结构和开发指南...
```

**特点**:
- **无 triggers** → 自动推断为 `repo` 类型
- Agent 启动时**立即注入**到系统上下文
- 用于: 项目结构、编码规范、团队约定

### 2. Knowledge (`type: knowledge`) - 关键词触发

```yaml
---
name: role-engineer
type: knowledge
triggers:           # 关键: 有 triggers
  - 代码
  - code
  - implement
---
# 你是 Bob，高级工程师...
```

**特点**:
- **有 triggers** → 自动推断为 `knowledge` 类型
- 用户消息**匹配关键词时注入**
- 用于: 角色人设、领域知识、最佳实践

### 3. Task (`type: task`) - 任务执行

```yaml
---
name: component-generator
type: task
triggers:
  - create component
inputs:             # 关键: 有 inputs 定义
  - name: COMPONENT_NAME
    description: "组件名称"
---
# 创建组件的步骤...
```

**特点**:
- **有 inputs** → 自动推断为 `task` 类型
- 自动添加 `/{name}` 触发器 (如 `/component-generator`)
- 支持 `${VARIABLE}` 变量替换
- 用于: 复杂任务的执行流程

## 类型推断逻辑

```python
# 优先级:
# 1. 有 inputs → TASK
# 2. 有 triggers → KNOWLEDGE  
# 3. 都没有 → REPO (始终加载)

if metadata.inputs:
    inferred_type = MicroagentType.TASK
elif metadata.triggers:
    inferred_type = MicroagentType.KNOWLEDGE
else:
    inferred_type = MicroagentType.REPO_KNOWLEDGE
```

## 触发匹配机制

### 匹配逻辑

```python
def match_trigger(self, message: str) -> str | None:
    message = message.lower()
    for trigger in self.triggers:
        if trigger.lower() in message:  # 子字符串匹配
            return trigger
    return None
```

### 匹配示例

| 用户输入 | 匹配的 Trigger | 注入的 Microagent |
|---------|---------------|------------------|
| "帮我写一段**代码**" | `代码` | `role-engineer.md` |
| "设计**微服务**架构" | `微服务` | `role-architect.md` |
| "创建一个**component**" | `component` | `component-generator.md` |

## 完整注入流程

```
1. 会话启动
   │
   ├─▶ Runtime.get_microagents_from_selected_repo()
   │     ├─ 加载 .openhands/microagents/*.md
   │     ├─ 加载 .cursorrules, AGENTS.md
   │     └─ 加载 .openhands_instructions (legacy)
   │
   ├─▶ Memory.load_user_workspace_microagents()
   │     ├─ repo_microagents = {} (始终加载)
   │     └─ knowledge_microagents = {} (待触发)
   │
   └─▶ 构建 SystemMessage
         └─ repo_microagents 内容注入到 <REPOSITORY_INSTRUCTIONS>

2. 用户发送消息
   │
   ├─▶ AgentController 创建 RecallAction(query=用户消息)
   │
   ├─▶ Memory._on_microagent_recall()
   │     └─ _find_microagent_knowledge(query)
   │           └─ 遍历 knowledge_microagents，匹配 triggers
   │
   ├─▶ 返回 RecallObservation(microagent_knowledge=[...])
   │
   └─▶ ConversationMemory 处理 RecallObservation
         └─ prompt_manager.build_microagent_info()
               └─ 渲染 microagent_info.j2 模板
```

## 注入位置

### Repo Microagents → 系统消息

```jinja2
{% if repository_instructions -%}
<REPOSITORY_INSTRUCTIONS>
{{ repository_instructions }}
</REPOSITORY_INSTRUCTIONS>
{% endif %}
```

### Knowledge Microagents → 用户消息 (触发后)

```jinja2
{% for agent_info in triggered_agents %}
<EXTRA_INFO>
The following information has been included based on a keyword match for "{{ agent_info.trigger }}".
It may or may not be relevant to the user's request.

{{ agent_info.content }}
</EXTRA_INFO>
{% endfor %}
```

## 文件格式

### Frontmatter (YAML)

```yaml
---
name: my-microagent           # 必填: 唯一标识
type: knowledge               # 可选: 自动推断
version: 1.0.0                # 可选
agent: CodeActAgent           # 可选: 默认 CodeActAgent
triggers:                     # Knowledge/Task 类型需要
  - trigger1
  - trigger2
inputs:                       # Task 类型专用
  - name: VAR_NAME
    description: "描述"
mcp_tools:                    # 可选: MCP 工具配置
  stdio_servers:
    - name: server1
      command: "npx"
---
```

### 字段详解

| 字段 | 必填 | 默认值 | 作用 |
|------|------|--------|------|
| `name` | ✅ | `default` | Microagent 唯一标识符，用于日志、禁用列表、去重 |
| `type` | ❌ | 自动推断 | 决定加载方式: `repo` (始终) / `knowledge` (触发) / `task` (触发+输入) |
| `version` | ❌ | `1.0.0` | 版本号，用于追踪变更，目前仅供参考 |
| `agent` | ❌ | `CodeActAgent` | **预留字段**: 指定适用的 Agent 类型 |
| `triggers` | ❌ | `[]` | 触发关键词列表，有则推断为 `knowledge` 类型 |
| `inputs` | ❌ | `[]` | 用户输入变量定义，有则推断为 `task` 类型 |
| `mcp_tools` | ❌ | `None` | MCP 工具服务器配置 |

### `agent` 字段说明

```yaml
agent: CodeActAgent  # 指定此 Microagent 适用于哪个 Agent
```

**当前状态**: 这是一个**预留字段**，在当前代码中**未被实际使用**进行过滤。

**设计意图**:
- 未来可能用于：只有指定的 Agent 类型才会加载该 Microagent
- 例如：`agent: BrowsingAgent` 表示只有浏览器 Agent 才需要这个知识

**为什么都写 `CodeActAgent`**:
- `CodeActAgent` 是 OpenHands 的默认/主要 Agent
- 大多数 Microagent 都是为 CodeActAgent 设计的
- 显式声明有助于未来兼容性

**可用的 Agent 类型**:
- `CodeActAgent` - 默认的代码执行 Agent
- `BrowsingAgent` - 浏览器交互 Agent
- `DelegatorAgent` - 任务分发 Agent
- 自定义 Agent 类名

### 内容 (Markdown)

Frontmatter 之后的所有内容都会作为 `content` 注入到 Agent 上下文。

## 特殊文件支持

| 文件 | 处理方式 |
|------|---------|
| `.cursorrules` | 自动转换为 `RepoMicroagent` |
| `AGENTS.md` / `agents.md` | 自动转换为 `RepoMicroagent` |
| `.openhands_instructions` | Legacy 格式，自动加载 |

## 禁用 Microagent

可以在 Agent 配置中禁用特定的 microagents:

```python
agent_config.disabled_microagents = ['role-engineer', 'typescript-validation']
```

## 核心源码位置

| 文件 | 功能 |
|------|------|
| `openhands/microagent/microagent.py` | Microagent 类定义和加载 |
| `openhands/microagent/types.py` | 类型定义 (MicroagentType, MicroagentMetadata) |
| `openhands/memory/memory.py` | 触发匹配和知识检索 |
| `openhands/memory/conversation_memory.py` | Prompt 构建 |
| `openhands/utils/prompt.py` | PromptManager |
| `openhands/agenthub/codeact_agent/prompts/*.j2` | Jinja2 模板 |

## 当前项目配置 (Atoms Plus)

### 目录: `.openhands/microagents/`

| 类型 | 数量 | 文件 |
|------|------|------|
| **Repo** | 2 | `atoms-plus.md`, `scaffolding.md` |
| **Knowledge** (角色) | 8 | `role-architect.md`, `role-engineer.md`, `role-product-manager.md`, `role-data-analyst.md`, `role-researcher.md`, `role-project-manager.md`, `role-seo-specialist.md`, `role-team-leader.md` |
| **Knowledge** (领域) | 2 | `documentation.md`, `typescript-validation.md` |
| **Task** | 6 | `component-generator.md`, `api-generator.md`, `supabase-integration.md`, `ui-library.md`, `deployment.md`, `glossary.md` |

### 中英文双语 Triggers

所有角色 Microagents 都配置了中英文 triggers，例如:

```yaml
# role-engineer.md
triggers:
  - 代码        # 中文
  - code        # 英文
  - 编程
  - programming
  - 实现
  - implement
  # ...
```

## 常见问题

### Q: 为什么用户发中文消息没有触发角色?

A: 确保 triggers 包含中文关键词。匹配是**子字符串匹配**，大小写不敏感。

### Q: 多个 Microagent 同时触发会怎样?

A: 所有匹配的 Microagent 都会注入，每个用 `<EXTRA_INFO>` 包裹。

### Q: Repo 和 Knowledge 的区别?

A: Repo 始终加载到系统消息；Knowledge 只有匹配时才注入到用户消息。

### Q: 如何创建新的 Microagent?

1. 在 `.openhands/microagents/` 创建 `.md` 文件
2. 添加 YAML frontmatter
3. 如果需要触发，添加 `triggers`
4. 如果需要用户输入，添加 `inputs`

