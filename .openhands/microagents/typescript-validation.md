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

**Use `vite-plugin-checker` for real-time TypeScript error detection.**

## Setup: vite-plugin-checker (REQUIRED for Vite projects)

```bash
npm install -D vite-plugin-checker
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import checker from 'vite-plugin-checker'

export default defineConfig({
  plugins: [
    react(),
    checker({
      typescript: true,  // Real-time type checking
      overlay: true,     // Show errors in browser
      terminal: true,    // Show errors in terminal (Agent can see!)
    }),
  ],
})
```

## Why vite-plugin-checker?

| Without Plugin | With Plugin |
|----------------|-------------|
| `npm run dev` starts successfully even with errors | Errors appear in **terminal** immediately |
| Errors only in browser console (Agent can't see) | Agent sees errors and can fix them |
| Need `npm run build` before every dev run | Real-time feedback during development |

## Workflow

```bash
npm install
npm run dev -- --host 0.0.0.0
# If errors appear in terminal → fix them → dev server auto-reloads
```

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

## Summary

With `vite-plugin-checker`:
1. **No need for `npm run build` before dev** - errors show in real-time
2. **Agent can see errors** - they appear in terminal output
3. **Auto-reload on fix** - dev server updates when you fix errors
