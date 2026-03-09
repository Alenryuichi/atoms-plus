"""LLM prompt templates for Deep Research functionality.

This module defines all prompt templates used in the deep research pipeline:
- STRUCTURE_PROMPT: Generate report outline from research topic
- SUMMARIZE_PROMPT: Summarize search results for a section
- REFLECT_PROMPT: Evaluate summary completeness and identify gaps
- FINAL_REPORT_PROMPT: Generate complete research report

All prompts use f-string placeholders {variable} and support both
Chinese and English output based on the input language.
"""

from __future__ import annotations

# =============================================================================
# Report Structure Generation Prompt
# =============================================================================

STRUCTURE_PROMPT = """你是一个专业的研究分析师。根据用户的研究主题，生成一个结构化的报告大纲。

研究主题: {query}

请输出 JSON 格式的报告结构:
```json
{{
  "title": "报告标题",
  "sections": [
    {{
      "title": "章节标题",
      "description": "这个章节需要研究什么",
      "search_query": "用于搜索的关键词"
    }}
  ]
}}
```

要求:
- 3-5 个章节
- 每个章节聚焦一个具体方面
- search_query 应该是简洁有效的搜索关键词
- 章节应该覆盖主题的不同方面
- 保持逻辑递进关系
"""

# =============================================================================
# Technical Implementation Structure Prompt (BUILD_APP 意图专用)
# =============================================================================

STRUCTURE_PROMPT_TECH = """你是一个资深全栈架构师。用户想要构建一个应用，生成一个**技术实施指南**的报告结构。

用户需求: {query}

请输出 JSON 格式的技术报告结构:
```json
{{
  "title": "技术实施指南标题",
  "sections": [
    {{
      "title": "推荐技术栈",
      "description": "前端框架、后端服务、数据库的具体选择和理由",
      "search_query": "Next.js Supabase 全栈项目模板 2025"
    }},
    {{
      "title": "数据库设计",
      "description": "表结构、ER 图、ORM 配置",
      "search_query": "PostgreSQL Prisma schema 设计示例"
    }},
    {{
      "title": "核心功能实现",
      "description": "关键功能的代码实现方案",
      "search_query": "用户认证 购物车 搜索 代码实现"
    }},
    {{
      "title": "第三方服务集成",
      "description": "支付、OAuth、文件存储的接入方法",
      "search_query": "Stripe 支付集成 NextAuth OAuth 代码"
    }},
    {{
      "title": "部署与上线",
      "description": "部署配置、CI/CD、安全检查清单",
      "search_query": "Vercel Railway 部署配置 安全检查"
    }}
  ]
}}
```

⚠️ 重要规则:
- 章节必须聚焦**技术实现**，不要包含市场调研、商业模式等
- search_query 必须包含具体技术名称（框架、库、工具）
- 内容应该对开发者有直接可操作的价值
"""


# =============================================================================
# Search Results Summarization Prompt
# =============================================================================

SUMMARIZE_PROMPT = """你是一个专业的研究分析师。根据以下搜索结果，撰写关于"{topic}"的内容总结。

搜索结果:
{search_results}

要求:
- 综合多个来源的信息
- 提取关键事实和数据
- 保持客观中立
- 标注重要来源
- 长度: 300-500字
"""
"""
Summarizes search results for a specific topic.

Input variables:
    - topic: Section title or research topic
    - search_results: Formatted search results from search engine

Output format:
    Plain text summary (300-500 words) integrating multiple sources.
"""


# =============================================================================
# Reflection and Gap Identification Prompt
# =============================================================================

REFLECT_PROMPT = """你是一个严谨的研究评审员。评估以下研究总结是否完整。

研究主题: {topic}
当前总结:
{summary}

请分析:
1. 是否有明显的信息缺口？
2. 是否需要补充搜索？

如果信息完整，输出: "COMPLETE"
如果需要补充，输出需要搜索的关键词（用于填补信息缺口）

只返回 "COMPLETE" 或一个搜索查询词，不要其他内容。
"""
"""
Evaluates summary completeness and identifies information gaps.

Input variables:
    - topic: Research topic being evaluated
    - summary: Current summary content to evaluate

Output format:
    Either "COMPLETE" or a single search query to fill the gap.
"""


# =============================================================================
# Final Report Generation Prompt
# =============================================================================

FINAL_REPORT_PROMPT = """基于以下各章节的研究总结，生成一份完整的研究报告。

报告标题: {title}

章节总结:
{sections_content}

来源列表:
{sources}

要求:
1. 使用 Markdown 格式
2. 包含执行摘要 (Executive Summary)
3. 每个章节有清晰的标题和内容
4. 综合分析，避免简单罗列
5. 在报告末尾列出所有参考来源
6. 保持专业的研究报告风格
7. 总结关键发现和建议

输出格式:
# {title}

## 执行摘要
[简洁概述研究目的、方法和主要发现]

## [章节1标题]
[章节内容]

## [章节2标题]
[章节内容]

...

## 结论与建议
[总结关键发现，提出建议]

## 参考来源
[列出所有引用来源]
"""

# =============================================================================
# Technical Implementation Report Prompt (BUILD_APP 意图专用)
# =============================================================================

FINAL_REPORT_PROMPT_TECH = """基于以下各章节的技术研究，生成一份**开发者可直接使用**的技术实施指南。

报告标题: {title}

章节总结:
{sections_content}

来源列表:
{sources}

⚠️ 这是一份技术实施指南，不是商业分析报告。内容必须对开发者有直接可操作价值。

要求:
1. 使用 Markdown 格式
2. 每个技术选择必须给出**具体的推荐方案**（如 "推荐使用 Next.js 14 + App Router"）
3. 包含**代码示例**（用 ```语言 代码块）
4. 包含**具体命令**（如 npm install, docker-compose up）
5. 使用**对比表格**展示技术选型
6. 提供**实施清单**（Day 1-7 任务）
7. 避免空洞的原则性描述，每一段都要有具体内容

输出格式:
# {title}

## 🎯 快速开始

**推荐技术栈:**
| 层级 | 技术选择 | 理由 |
|------|----------|------|
| 前端 | Next.js 14 | App Router, RSC 支持 |
| 后端 | Supabase | 免费额度, Auth 内置 |
| 数据库 | PostgreSQL | ACID, 关系型 |
| 部署 | Vercel | 零配置, 与 Next.js 最佳适配 |

**一键启动:**
```bash
npx create-next-app@latest my-app --typescript --tailwind --app
cd my-app && npm run dev
```

## 一、[技术栈详解]
[具体的框架对比和选择理由，包含代码示例]

## 二、[数据库设计]
[ER 图描述，SQL schema 示例，Prisma model 代码]

## 三、[核心功能实现]
[关键功能的代码实现，包含完整代码片段]

## 四、[第三方集成]
[支付/认证/存储的 SDK 接入代码]

## 五、[部署上线]
[部署配置文件示例，CI/CD 配置，安全检查清单]

## 📋 实施清单

### Day 1: 项目初始化
- [ ] 创建 Next.js 项目
- [ ] 配置 Supabase 连接
- [ ] 设计数据库 schema

### Day 2-3: 核心功能
- [ ] 实现用户认证
- [ ] 商品列表页面
- [ ] 购物车功能

### Day 4-5: 支付集成
- [ ] 接入 Stripe/支付宝
- [ ] 订单管理

### Day 6-7: 部署上线
- [ ] Vercel 部署
- [ ] 域名配置
- [ ] 安全检查

## 参考来源
[列出所有引用来源]
"""


# =============================================================================
# Tech Stack Decision Prompt (Stage 1 - runs first to lock the stack)
# =============================================================================

TECH_STACK_DECISION = """你是资深全栈架构师。根据研究结果，确定最适合该项目的技术栈。

项目需求: {title}

研究摘要:
{section_content}

请输出 JSON 格式的技术栈决策:
```json
{{
  "frontend": {{
    "framework": "框架名称 (如 Next.js 14)",
    "ui": "UI 库 (如 Tailwind + shadcn/ui)",
    "state": "状态管理 (如 Zustand)"
  }},
  "backend": {{
    "framework": "后端框架 (如 Next.js API Routes)",
    "orm": "ORM (如 Prisma)",
    "auth": "认证方案 (如 NextAuth.js)"
  }},
  "database": {{
    "primary": "主数据库 (如 PostgreSQL)",
    "provider": "数据库服务 (如 Supabase)"
  }},
  "deployment": {{
    "frontend": "前端部署 (如 Vercel)",
    "backend": "后端部署 (如 Vercel/Railway)",
    "ci": "CI/CD (如 GitHub Actions)"
  }},
  "summary": "一句话总结技术栈选择"
}}
```

要求:
- 选择 **一种** 技术方案，不要提供多个选项
- 优先选择现代、流行、文档完善的技术
- 技术栈内部要兼容 (如 Next.js + NextAuth.js，不要 Next.js + Spring Boot)
- summary 用中文，格式: "前端 + 后端 + 数据库"
"""


# =============================================================================
# Sectioned Technical Report Prompts (for parallel generation)
# All prompts include {tech_stack} to enforce consistency
# =============================================================================

TECH_SECTION_QUICK_START = """你是技术文档专家。根据研究结果，生成"快速开始"章节。

研究主题: {title}

**锁定技术栈 (必须使用):**
{tech_stack}

相关研究内容:
{section_content}

要求:
1. 技术栈表格必须使用上面锁定的技术，不要自行选择其他技术
2. 提供一键启动的 bash 命令 (3-5 行)
3. 用中文写作，技术术语保持英文
4. 控制在 500-800 字符

输出格式:
## 🎯 快速开始

**推荐技术栈:**
| 层级 | 技术选择 | 理由 |
|------|----------|------|
| 前端 | [使用锁定的 frontend] | ... |
| 后端 | [使用锁定的 backend] | ... |
| 数据库 | [使用锁定的 database] | ... |
| 部署 | [使用锁定的 deployment] | ... |

**一键启动:**
```bash
# 基于锁定技术栈的具体命令
```
"""

TECH_SECTION_STACK = """你是技术架构师。根据研究结果，生成"技术栈详解"章节。

研究主题: {title}

**锁定技术栈 (必须使用):**
{tech_stack}

相关研究内容:
{section_content}

要求:
1. 对比 2-3 种备选框架的优缺点，但最终推荐必须是锁定的技术栈
2. 提供配置代码示例 (package.json 或 config 片段)，必须基于锁定技术栈
3. 用中文写作，控制在 1000-1500 字符

输出格式:
## 一、技术栈详解

### 前端框架对比
| 框架 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| ... | ... | ... | ... |

**推荐选择**: [锁定的前端框架] - [理由]

```json
// package.json 关键依赖 (基于锁定技术栈)
{{ ... }}
```

### 后端/API 选型
[类似结构，推荐锁定的后端框架]
"""

TECH_SECTION_DATABASE = """你是数据库架构师。根据研究结果，生成"数据库设计"章节。

研究主题: {title}

**锁定技术栈 (必须使用):**
{tech_stack}

相关研究内容:
{section_content}

要求:
1. 描述核心数据模型 (用户、商品、订单等)
2. 使用锁定的数据库和 ORM 提供 schema 代码 (如 Prisma for PostgreSQL)
3. 说明表关系 (一对多、多对多)
4. 用中文写作，控制在 1000-1500 字符

输出格式:
## 二、数据库设计

### 数据模型概览
- **用户表 (users)**: 存储用户信息
- **商品表 (products)**: 商品基础信息
- **订单表 (orders)**: 订单主表
- **订单项 (order_items)**: 订单明细

### [锁定的 ORM] Schema
```prisma
model User {{
  id        String   @id @default(cuid())
  email     String   @unique
  // ...
}}

model Product {{
  // ...
}}
```

### 表关系
[描述外键关系]
"""

TECH_SECTION_FEATURES = """你是全栈开发工程师。根据研究结果，生成"核心功能实现"章节。

研究主题: {title}

**锁定技术栈 (必须使用):**
{tech_stack}

相关研究内容:
{section_content}

要求:
1. 列出 3-5 个核心功能模块
2. 代码必须使用锁定的技术栈 (如锁定 Next.js 就用 Next.js API Routes，不要用 Express)
3. 代码要可运行，不要用伪代码
4. 用中文写作，控制在 1500-2000 字符

输出格式:
## 三、核心功能实现

### 3.1 用户认证
```typescript
// 使用锁定的认证方案 (如 NextAuth.js)
...
```

### 3.2 商品列表
```tsx
// 使用锁定的前端框架
...
```

### 3.3 购物车
[基于锁定技术栈的代码示例]
"""

TECH_SECTION_INTEGRATIONS = """你是第三方集成专家。根据研究结果，生成"第三方集成"章节。

研究主题: {title}

**锁定技术栈 (必须使用):**
{tech_stack}

相关研究内容:
{section_content}

要求:
1. 覆盖支付、认证、存储等关键集成
2. 代码必须与锁定的技术栈兼容 (如锁定 Next.js 就用 next-auth，不要用 Spring Security)
3. 包含环境变量配置示例
4. 用中文写作，控制在 1000-1500 字符

输出格式:
## 四、第三方集成

### 4.1 支付集成
```typescript
// 基于锁定技术栈的支付集成代码
...
```

**.env.local 配置:**
```
# 环境变量
```

### 4.2 文件存储
[基于锁定技术栈的代码示例]
"""

TECH_SECTION_DEPLOYMENT = """你是 DevOps 工程师。根据研究结果，生成"部署上线"章节。

研究主题: {title}

**锁定技术栈 (必须使用):**
{tech_stack}

相关研究内容:
{section_content}

要求:
1. 使用锁定的部署平台 (如 Vercel/Railway)
2. 包含 CI/CD 配置示例 (GitHub Actions)
3. 列出上线前安全检查清单
4. 用中文写作，控制在 1000-1500 字符

输出格式:
## 五、部署上线

### 5.1 [锁定的部署平台] 部署
```bash
# 基于锁定技术栈的部署命令
```

**配置文件:**
```json
// 基于锁定技术栈的配置
```

### 5.2 GitHub Actions CI/CD
```yaml
# .github/workflows/deploy.yml
# 基于锁定技术栈的 CI/CD
```

### 5.3 上线检查清单
- [ ] 环境变量已配置
- [ ] HTTPS 已启用
- [ ] 数据库已迁移
- [ ] 错误监控已接入
"""

TECH_SECTION_CHECKLIST = """你是项目经理。根据研究结果，生成"实施清单"章节。

研究主题: {title}

**锁定技术栈 (必须使用):**
{tech_stack}

相关研究内容:
{section_content}

要求:
1. 按天/周分解实施步骤，步骤必须基于锁定的技术栈
2. 每个步骤可执行、可验证
3. 包含预估工时
4. 用中文写作，控制在 800-1000 字符

输出格式:
## 📋 实施清单

### Day 1: 项目初始化 (4h)
- [ ] 创建 [锁定的前端框架] 项目
- [ ] 配置 TypeScript + ESLint
- [ ] 接入 [锁定的数据库服务]

### Day 2-3: 数据库 & 认证 (8h)
- [ ] 设计 [锁定的 ORM] schema
- [ ] 实现 [锁定的认证方案] 登录
- [ ] 添加用户管理页面

### Day 4-5: 核心功能 (10h)
- [ ] 商品 CRUD
- [ ] 购物车逻辑
- [ ] 订单流程

### Day 6-7: 集成 & 部署 (8h)
- [ ] 接入支付服务
- [ ] [锁定的部署平台] 部署
- [ ] 安全检查
"""

__all__ = [
    "STRUCTURE_PROMPT",
    "STRUCTURE_PROMPT_TECH",
    "SUMMARIZE_PROMPT",
    "REFLECT_PROMPT",
    "FINAL_REPORT_PROMPT",
    "FINAL_REPORT_PROMPT_TECH",
    # Tech stack decision (Stage 1)
    "TECH_STACK_DECISION",
    # Sectioned prompts (Stage 2)
    "TECH_SECTION_QUICK_START",
    "TECH_SECTION_STACK",
    "TECH_SECTION_DATABASE",
    "TECH_SECTION_FEATURES",
    "TECH_SECTION_INTEGRATIONS",
    "TECH_SECTION_DEPLOYMENT",
    "TECH_SECTION_CHECKLIST",
]
