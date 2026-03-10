---
name: component-generator
type: task
version: 2.0.0
agent: CodeActAgent
triggers:
- create component
- generate component
- make component
- build component
- add component
- 创建组件
- 生成组件
- 写组件
- 添加组件
- 新建组件
---

# Component Generator

When the user asks to create a UI component, generate a complete, styled, accessible component.

## Smart Defaults

- **Framework**: React (default) or Vue 3
- **Styling**: Tailwind CSS (always)
- **Language**: TypeScript (always)
- **Location**: `src/components/` or `components/`

## Workflow

### Step 1: Clarify (Max 1 question)

If component purpose is unclear, ask: "What should this component do?"

Infer from name:
- "Button" → clickable, variants (primary/secondary/danger)
- "Card" → container with header/content/footer
- "Modal" → overlay dialog with close button
- "Form" → inputs with validation and submit

### Step 2: Generate Component

**React Component:**

```tsx
// components/ComponentName.tsx
import { useState } from 'react';

interface ComponentNameProps {
  // Define props
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

export function ComponentName({ 
  children, 
  variant = 'primary',
  onClick 
}: ComponentNameProps) {
  return (
    <div 
      className={`
        rounded-lg p-4 
        ${variant === 'primary' ? 'bg-blue-500 text-white' : 'bg-gray-100'}
        hover:opacity-90 transition-opacity
      `}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      {children}
    </div>
  );
}
```

**Vue Component:**

```vue
<!-- components/ComponentName.vue -->
<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary'
});

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <div 
    :class="[
      'rounded-lg p-4 hover:opacity-90 transition-opacity',
      variant === 'primary' ? 'bg-blue-500 text-white' : 'bg-gray-100'
    ]"
    @click="emit('click')"
  >
    <slot />
  </div>
</template>
```

### Step 3: Add to Index (if exists)

```typescript
// components/index.ts
export { ComponentName } from './ComponentName';
```

### Step 4: Create Usage Example

```tsx
// Example usage:
import { ComponentName } from '@/components/ComponentName';

<ComponentName variant="primary" onClick={() => console.log('clicked')}>
  Click me
</ComponentName>
```

### Step 5: Report

```
✅ Component created!

📁 File: components/ComponentName.tsx

Features:
- ✅ TypeScript props interface
- ✅ Tailwind styling
- ✅ Variant support
- ✅ Accessibility (role, tabIndex)
- ✅ Hover states

Usage:
import { ComponentName } from '@/components/ComponentName';
<ComponentName variant="primary">Content</ComponentName>
```

## Accessibility Checklist

Always include:
- `role` attribute for interactive elements
- `tabIndex={0}` for keyboard navigation
- `aria-label` for icon-only buttons
- Sufficient color contrast
- Focus states (`focus:ring-2`)
