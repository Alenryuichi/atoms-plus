---
name: typescript-validation
type: knowledge
triggers:
  - build
  - 构建
  - vite
  - react
  - vue
  - nextjs
  - nuxt
  - typescript
  - ts
  - npm run dev
  - 启动
  - start
  - run
---

# TypeScript Validation Guide

**CRITICAL: Always validate TypeScript code before starting dev servers.**

## Pre-Flight Checklist

Before running `npm run dev`, ALWAYS run build first:

```bash
# 1. Run build to catch ALL errors
npm run build

# 2. If build fails, FIX THE ERRORS!
# 3. Only start dev server after build succeeds
npm run dev -- --host 0.0.0.0 --port 8011
```

**⚠️ CRITICAL: Why `npm run build` instead of `tsc --noEmit`?**

| Command | Catches TypeScript Errors | Catches ESM Errors | Fails Fast |
|---------|--------------------------|-------------------|------------|
| `tsc --noEmit` | ✅ | ❌ | ✅ |
| `npm run dev` | ❌ | ❌ (only in browser) | ❌ |
| `npm run build` | ✅ | ✅ | ✅ |

Agent cannot see browser console errors, so `npm run build` is the only reliable way to catch ALL errors before starting dev server.

## Common Export Patterns

### ✅ Correct: Named Exports

```typescript
// src/models/Post.ts
export interface Post {
  id: number;
  title: string;
  content: string;
}

export const samplePosts: Post[] = [
  { id: 1, title: 'Hello', content: 'World' }
];

export function getPostById(id: number): Post | undefined {
  return samplePosts.find(p => p.id === id);
}
```

### ✅ Correct: Import Named Exports

```typescript
// src/pages/BlogPage.tsx
import { Post, samplePosts, getPostById } from '../models/Post';
```

### ❌ Wrong: Missing Export

```typescript
// src/models/Post.ts
interface Post {  // ❌ No export keyword!
  id: number;
  title: string;
}

const samplePosts: Post[] = [];  // ❌ No export keyword!
```

### ❌ Wrong: Default vs Named Confusion

```typescript
// src/models/Post.ts
export default interface Post { ... }  // Default export

// src/pages/BlogPage.tsx
import { Post } from '../models/Post';  // ❌ Wrong! This is named import
import Post from '../models/Post';      // ✅ Correct default import
```

## Quick Fixes

| Error Message | Fix |
|--------------|-----|
| `does not provide an export named 'X'` | Add `export` keyword: `export interface X` |
| `Module has no exported member 'X'` | Check export syntax matches import |
| `Cannot find module 'X'` | Verify file exists at path |
| `Cannot use namespace 'X' as a type` | Use `import type { X }` |

## Vite-Specific Tips

1. **File Extensions**: Don't include `.ts` in imports
   ```typescript
   import { Post } from './Post';     // ✅ Correct
   import { Post } from './Post.ts';  // ❌ Wrong
   ```

2. **Path Aliases**: Use configured aliases
   ```typescript
   import { Post } from '@/models/Post';  // If @ is configured
   import { Post } from '../models/Post'; // Relative path
   ```

3. **Hot Reload**: If types don't update, restart dev server

## Validation Script

Add to `package.json`:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "dev:safe": "npm run typecheck && npm run dev"
  }
}
```

Then use:

```bash
npm run dev:safe -- --host 0.0.0.0 --port 5173
```

