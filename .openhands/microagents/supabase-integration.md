---
name: supabase
type: task
version: 2.0.0
agent: CodeActAgent
triggers:
- supabase
- database
- auth
- login
- signup
- user authentication
---

# Supabase Integration

When the user needs database or authentication, set up Supabase integration.

## Smart Defaults

- **Client**: `@supabase/supabase-js` (always)
- **Auth**: Email/password (default), add OAuth if requested
- **RLS**: Always enable Row Level Security

## Workflow

### Step 1: Install & Configure

```bash
npm install @supabase/supabase-js
```

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 2: Create Client

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Step 3: Database Operations

```typescript
// Create
const { data, error } = await supabase
  .from('items')
  .insert({ name: 'New Item' })
  .select()
  .single();

// Read
const { data } = await supabase
  .from('items')
  .select('*')
  .order('created_at', { ascending: false });

// Update
const { data } = await supabase
  .from('items')
  .update({ name: 'Updated' })
  .eq('id', itemId)
  .select()
  .single();

// Delete
await supabase
  .from('items')
  .delete()
  .eq('id', itemId);
```

### Step 4: Authentication (if needed)

```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// Sign out
await supabase.auth.signOut();

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// OAuth (GitHub example)
await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: { redirectTo: `${window.location.origin}/auth/callback` }
});
```

### Step 5: Row Level Security

```sql
-- Enable RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Users can only see their own items
CREATE POLICY "Users view own items" ON items
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own items
CREATE POLICY "Users insert own items" ON items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own items
CREATE POLICY "Users update own items" ON items
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own items
CREATE POLICY "Users delete own items" ON items
  FOR DELETE USING (auth.uid() = user_id);
```

### Step 6: Report

```
✅ Supabase integrated!

📁 Files created:
- lib/supabase.ts (client)
- .env.local (config)

🔐 Security:
- ✅ RLS policies recommended
- ✅ Anon key for client (safe)
- ⚠️ Service role key for server only

📚 Next steps:
1. Create tables in Supabase Dashboard
2. Enable RLS on all tables
3. Add auth callback route (if using OAuth)
```

## React Hooks Pattern

```typescript
// hooks/useItems.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('items')
      .select('*')
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, []);

  return { items, loading };
}
```
