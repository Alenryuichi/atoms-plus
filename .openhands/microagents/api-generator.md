---
name: api_generator
type: task
version: 1.0.0
agent: CodeActAgent
triggers:
- /api
inputs:
- name: API_NAME
  description: "API 名称或资源名（如 users, products, orders）"
- name: OPERATIONS
  description: "CRUD 操作: create, read, update, delete, list（逗号分隔）"
- name: DATABASE
  description: "数据库类型: supabase | prisma | drizzle | none"
---

# API 接口生成器

你是一个专业的后端 API 生成专家。请根据用户需求生成符合 RESTful 规范的 API 接口。

## 用户输入

- **API/资源名称**: ${API_NAME}
- **操作类型**: ${OPERATIONS}
- **数据库集成**: ${DATABASE}

## API 设计规范

### RESTful 端点设计

| 操作 | 方法 | 端点 | 说明 |
|------|------|------|------|
| list | GET | `/api/${API_NAME}` | 获取列表 |
| create | POST | `/api/${API_NAME}` | 创建资源 |
| read | GET | `/api/${API_NAME}/:id` | 获取单个 |
| update | PATCH | `/api/${API_NAME}/:id` | 更新资源 |
| delete | DELETE | `/api/${API_NAME}/:id` | 删除资源 |

### Next.js API Route 示例

```typescript
// app/api/${API_NAME}/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // 实现 list 或 read
}

export async function POST(request: NextRequest) {
  // 实现 create
}
```

### Nuxt Server Route 示例

```typescript
// server/api/${API_NAME}/index.get.ts
export default defineEventHandler(async (event) => {
  // 实现 list
});

// server/api/${API_NAME}/index.post.ts
export default defineEventHandler(async (event) => {
  // 实现 create
});
```

## Supabase 集成

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// 查询示例
const { data, error } = await supabase
  .from('${API_NAME}')
  .select('*');
```

## 数据验证

使用 Zod 进行请求体验证：

```typescript
import { z } from 'zod';

const ${API_NAME}Schema = z.object({
  // 定义字段验证规则
});

// 在 handler 中使用
const body = await request.json();
const validated = ${API_NAME}Schema.parse(body);
```

## 错误处理

```typescript
try {
  // 业务逻辑
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Validation failed', details: error.errors },
      { status: 400 }
    );
  }
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

## 生成步骤

1. 确认 API 需求和数据结构
2. 创建数据模型/Schema
3. 生成 API 路由文件
4. 实现 CRUD 操作
5. 添加数据验证
6. 添加错误处理
7. 生成 API 文档（可选）

