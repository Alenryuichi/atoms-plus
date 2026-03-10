---
name: ui-library
type: task
version: 2.0.0
agent: CodeActAgent
triggers:
- shadcn
- ui library
- component library
- primevue
- radix
- design system
- ui库
- 组件库
- 设计系统
- ui组件
- 界面库
---

# UI Library Setup

When the user wants to add a UI component library, install and configure it.

## Smart Defaults

- **React**: shadcn/ui (default) - best DX, fully customizable
- **Vue**: PrimeVue (default) - most complete
- **Headless**: Radix UI - when full control needed

## Workflow

### Step 1: Detect Framework

Check `package.json` for:
- `react` → Use shadcn/ui
- `vue` → Use PrimeVue
- Neither → Ask user

### Step 2A: Install shadcn/ui (React)

```bash
# Initialize shadcn/ui
npx shadcn@latest init

# Answer prompts:
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes

# Add common components
npx shadcn@latest add button card input dialog
```

**Usage:**
```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Button variant="default">Primary</Button>
    <Button variant="outline">Secondary</Button>
    <Button variant="destructive">Danger</Button>
  </CardContent>
</Card>
```

### Step 2B: Install PrimeVue (Vue)

```bash
npm install primevue primeicons
```

**Configure:**
```typescript
// main.ts
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';

app.use(PrimeVue, {
  theme: { preset: Aura }
});
```

**Usage:**
```vue
<script setup>
import Button from 'primevue/button';
import Card from 'primevue/card';
</script>

<template>
  <Card>
    <template #title>Title</template>
    <template #content>
      <Button label="Primary" />
      <Button label="Secondary" severity="secondary" />
    </template>
  </Card>
</template>
```

### Step 2C: Install Radix UI (Headless)

```bash
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-popover
```

**Usage:**
```tsx
import * as Dialog from '@radix-ui/react-dialog';

<Dialog.Root>
  <Dialog.Trigger asChild>
    <button>Open</button>
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 bg-black/50" />
    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg">
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Description>Description</Dialog.Description>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### Step 3: Report

```
✅ UI library installed!

📦 Package: shadcn/ui (or PrimeVue/Radix)

📁 Components added:
- button
- card
- input
- dialog

🎨 Theming:
- Edit globals.css for colors
- Edit tailwind.config.js for design tokens

📚 Docs:
- shadcn/ui: https://ui.shadcn.com
- PrimeVue: https://primevue.org
- Radix: https://radix-ui.com
```

## Comparison Guide

| Feature | shadcn/ui | PrimeVue | Radix UI |
|---------|-----------|----------|----------|
| Framework | React | Vue | React |
| Styling | Tailwind | CSS/Tailwind | Unstyled |
| Customization | Full source | Theme API | Full control |
| Components | 40+ | 90+ | 28 primitives |
| Best for | Custom design | Rapid dev | Accessibility |
