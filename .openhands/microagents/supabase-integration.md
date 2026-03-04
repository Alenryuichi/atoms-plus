---
name: supabase
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
- supabase
- database
- 数据库
- auth
- 认证
- 用户登录
---

# Supabase 集成指南

Atoms Plus 深度集成 Supabase，提供数据库、认证和存储服务。

## 环境配置

在项目根目录创建 `.env.local` 文件：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # 仅服务端使用
```

## 客户端初始化

### Next.js / React

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Nuxt 3

```typescript
// plugins/supabase.ts
import { createClient } from '@supabase/supabase-js';

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseKey
  );
  
  return {
    provide: { supabase }
  };
});
```

## 数据库操作

### 查询数据

```typescript
// 获取所有记录
const { data, error } = await supabase
  .from('products')
  .select('*');

// 带条件查询
const { data } = await supabase
  .from('products')
  .select('id, name, price')
  .eq('category', 'electronics')
  .order('created_at', { ascending: false })
  .limit(10);
```

### 插入数据

```typescript
const { data, error } = await supabase
  .from('products')
  .insert({ name: 'New Product', price: 99.99 })
  .select();
```

### 更新数据

```typescript
const { data, error } = await supabase
  .from('products')
  .update({ price: 149.99 })
  .eq('id', productId)
  .select();
```

### 删除数据

```typescript
const { error } = await supabase
  .from('products')
  .delete()
  .eq('id', productId);
```

## 用户认证

### 邮箱登录

```typescript
// 注册
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});

// 登录
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// 登出
await supabase.auth.signOut();
```

### OAuth 登录

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
});
```

### 获取当前用户

```typescript
const { data: { user } } = await supabase.auth.getUser();
```

## Row Level Security (RLS)

在 Supabase Dashboard 中启用 RLS 并创建策略：

```sql
-- 用户只能查看自己的数据
CREATE POLICY "Users can view own data" ON products
  FOR SELECT USING (auth.uid() = user_id);

-- 用户只能创建自己的数据
CREATE POLICY "Users can insert own data" ON products
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 最佳实践

1. **始终启用 RLS** - 保护数据安全
2. **使用服务端 API** - 敏感操作在服务端执行
3. **处理错误** - 检查所有操作的 `error` 返回值
4. **类型安全** - 使用 `supabase gen types` 生成 TypeScript 类型

