---
name: api-generator
type: task
version: 2.0.0
agent: CodeActAgent
triggers:
- create api
- generate api
- add endpoint
- rest api
- api route
- 创建api
- 创建接口
- 接口
- 端点
- api接口
- 后端接口
---

# API Generator

When the user asks to create an API endpoint, generate a complete, working implementation.

## Smart Defaults

- **Framework**: Next.js API Routes (default) or Nuxt Server Routes
- **Validation**: Zod (always include)
- **Database**: Supabase (default) or none
- **Language**: TypeScript (always)

## Workflow

### Step 1: Clarify (Max 1 question)

If unclear, ask: "What resource/data does this API manage?"

Infer from context:
- CRUD operations → generate all 5 endpoints
- "get" or "list" → read-only endpoint
- "create" or "add" → create endpoint

### Step 2: Generate Files

**Next.js API Route:**

```typescript
// app/api/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  // Define based on resource
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  // Implement list/read
  return NextResponse.json({ data: [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validated = schema.parse(body);
  // Implement create
  return NextResponse.json({ data: validated }, { status: 201 });
}
```

```typescript
// app/api/[resource]/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Implement read single
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Implement update
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Implement delete
}
```

### Step 3: Add Supabase (if needed)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// In handler:
const { data, error } = await supabase
  .from('resource')
  .select('*');
```

### Step 4: Test the API

```bash
# Test with curl
curl http://localhost:3000/api/resource
curl -X POST http://localhost:3000/api/resource -H "Content-Type: application/json" -d '{"name":"test"}'
```

### Step 5: Report

```
✅ API created!

📁 Files:
- app/api/[resource]/route.ts (GET, POST)
- app/api/[resource]/[id]/route.ts (GET, PATCH, DELETE)

🔗 Endpoints:
- GET    /api/resource      - List all
- POST   /api/resource      - Create
- GET    /api/resource/:id  - Get one
- PATCH  /api/resource/:id  - Update
- DELETE /api/resource/:id  - Delete

Test: curl http://localhost:3000/api/resource
```
