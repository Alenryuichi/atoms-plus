# Atoms-Plus 系统架构设计

## 1. 系统概览

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Nuxt.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐│
│  │  Landing │  │  Pricing │  │   Blog   │  │   App Builder    ││
│  │   Page   │  │   Page   │  │  System  │  │   (Chat UI)      ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                    PrimeVue Components + Pinia                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Layer (Server Routes)                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐│
│  │   Auth   │  │  Credits │  │   Chat   │  │      Deploy      ││
│  │   API    │  │   API    │  │   API    │  │       API        ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Backend Services                         │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│   Supabase   │    Stripe    │  LLM APIs    │   Deploy Service   │
│  (Database)  │  (Payments)  │  (AI/ML)     │   (Containers)     │
└──────────────┴──────────────┴──────────────┴────────────────────┘
```

## 2. 目录结构

```
atoms-plus/
├── app/                          # Nuxt app 目录
│   ├── components/               # Vue 组件
│   │   ├── ui/                   # 基础UI组件
│   │   ├── chat/                 # 聊天相关组件
│   │   ├── agent/                # 智能体组件
│   │   ├── pricing/              # 定价组件
│   │   └── common/               # 通用组件
│   ├── layouts/                  # 布局
│   │   ├── default.vue
│   │   ├── auth.vue
│   │   └── app.vue
│   ├── pages/                    # 页面路由
│   │   ├── index.vue             # 首页
│   │   ├── pricing.vue           # 定价页
│   │   ├── blog/
│   │   ├── video/
│   │   └── app/
│   ├── composables/              # 组合式函数
│   └── middleware/               # 中间件
├── server/                       # 服务端
│   ├── api/                      # API 路由
│   │   ├── auth/
│   │   ├── chat/
│   │   ├── credits/
│   │   └── deploy/
│   ├── utils/                    # 工具函数
│   └── middleware/               # 服务端中间件
├── stores/                       # Pinia stores
│   ├── auth.ts
│   ├── chat.ts
│   ├── plan.ts
│   └── settings.ts
├── types/                        # TypeScript 类型
├── utils/                        # 客户端工具
├── assets/                       # 静态资源
├── public/                       # 公共文件
├── docs/                         # 文档
│   ├── research/                 # 调研文档
│   └── architecture/             # 架构文档
├── nuxt.config.ts
├── package.json
└── README.md
```

## 3. 数据库设计 (Supabase)

### 用户表 (users)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  plan_id TEXT DEFAULT 'free',
  credits_daily INT DEFAULT 15,
  credits_monthly BIGINT DEFAULT 2500000,
  credits_bonus BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 对话表 (chats)
```sql
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  access_mode TEXT DEFAULT 'private',
  model TEXT DEFAULT 'claude-opus-4.6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 消息表 (messages)
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' | 'assistant' | 'system'
  agent TEXT,         -- 'Mike' | 'Emma' | 'Bob' | etc.
  content TEXT NOT NULL,
  tokens_used INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 计划表 (plans)
```sql
CREATE TABLE plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'free' | 'pro' | 'max'
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  credits_monthly BIGINT,
  storage_gb INT,
  features JSONB,
  stripe_price_id TEXT,
  enabled BOOLEAN DEFAULT true
);
```

## 4. API 设计

### 认证 API
```
POST /api/auth/register    - 注册
POST /api/auth/login       - 登录
POST /api/auth/logout      - 登出
GET  /api/auth/me          - 获取当前用户
```

### 聊天 API
```
GET    /api/chat           - 获取对话列表
POST   /api/chat           - 创建对话
GET    /api/chat/:id       - 获取对话详情
DELETE /api/chat/:id       - 删除对话
POST   /api/chat/:id/message - 发送消息
```

### 积分 API
```
GET  /api/credits          - 获取积分余额
POST /api/credits/use      - 消耗积分
GET  /api/credits/history  - 积分历史
```

### 计划 API
```
GET  /api/plans            - 获取所有计划
POST /api/plans/subscribe  - 订阅计划
POST /api/plans/upgrade    - 升级计划
POST /api/plans/downgrade  - 降级计划
```

## 5. 智能体系统设计

### Agent 基类
```typescript
interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  avatar: string;
  capabilities: string[];
  model: string;
  systemPrompt: string;
}

type AgentRole =
  | 'TeamLeader'
  | 'ProductManager'
  | 'Architect'
  | 'ProjectManager'
  | 'Engineer'
  | 'DataAnalyst'
  | 'DeepResearcher'
  | 'SEOSpecialist';
```

### 智能体配置
```typescript
const agents: Agent[] = [
  {
    id: 'mike',
    name: 'Mike',
    role: 'TeamLeader',
    description: 'Coordinate the team to handle requests.',
    capabilities: ['planning', 'coordination', 'delegation'],
    systemPrompt: '...'
  },
  // ... 其他智能体
];
```

### 工作流引擎
```typescript
interface Workflow {
  id: string;
  steps: WorkflowStep[];
  currentStep: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

interface WorkflowStep {
  agent: AgentRole;
  action: string;
  input: any;
  output?: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
}
```

## 6. Race Mode 实现

```typescript
interface RaceSession {
  id: string;
  chatId: string;
  prompt: string;
  agents: string[];
  results: RaceResult[];
  winner?: string;
  status: 'racing' | 'voting' | 'completed';
}

interface RaceResult {
  agentId: string;
  response: string;
  tokensUsed: number;
  completedAt: Date;
  score?: number;
}

// Race Mode 流程
async function startRace(prompt: string, agents: string[]) {
  // 1. 并行调用多个 AI 模型
  const results = await Promise.all(
    agents.map(agent => generateResponse(agent, prompt))
  );

  // 2. 评估结果质量
  const scores = await evaluateResults(results);

  // 3. 选择最佳结果
  const winner = selectBestResult(results, scores);

  return winner;
}
```

## 7. 部署架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         Cloudflare                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │     DNS     │  │     CDN     │  │    DDoS Protection      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Vercel / Cloudflare Pages                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Nuxt.js Application                    │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────────────────────┐  │   │
│  │  │   SSR   │  │   API   │  │    Static Assets        │  │   │
│  │  │ Server  │  │  Routes │  │    (Edge Cached)        │  │   │
│  │  └─────────┘  └─────────┘  └─────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   Supabase    │    │    Stripe     │    │   LLM APIs    │
│  (Database)   │    │  (Payments)   │    │   (AI/ML)     │
└───────────────┘    └───────────────┘    └───────────────┘
```

## 8. 安全考虑

### 认证
- Supabase Auth (OAuth + Email/Password)
- JWT Token 验证
- Session 管理

### API 安全
- Rate Limiting
- CORS 配置
- API Key 管理
- 输入验证

### 数据安全
- RLS (Row Level Security)
- 数据加密
- 敏感信息脱敏

