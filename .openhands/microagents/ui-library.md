---
name: ui_library
type: knowledge
version: 1.0.0
agent: CodeActAgent
triggers:
- shadcn
- tailwind
- primevue
- ui library
- 组件库
- 样式
---

# UI 库使用指南

Atoms Plus 支持多种现代 UI 库，根据项目需求选择合适的方案。

## Tailwind CSS

### 基础配置

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,vue}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
      },
    },
  },
  plugins: [],
};
```

### 常用模式

```jsx
// 响应式布局
<div className="flex flex-col md:flex-row gap-4">

// 暗色模式
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">

// 悬停和焦点状态
<button className="bg-blue-500 hover:bg-blue-600 focus:ring-2">
```

## shadcn/ui (React)

### 安装

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input
```

### 使用组件

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>标题</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default">点击</Button>
        <Button variant="outline">次要</Button>
        <Button variant="destructive">危险</Button>
      </CardContent>
    </Card>
  );
}
```

### 主题定制

```css
/* globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
  }
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
  }
}
```

## PrimeVue (Vue 3)

### 安装

```bash
npm install primevue primeicons
```

### 配置

```typescript
// main.ts
import PrimeVue from 'primevue/config';
import 'primevue/resources/themes/lara-light-blue/theme.css';

app.use(PrimeVue);
```

### 使用组件

```vue
<script setup>
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
</script>

<template>
  <Button label="提交" icon="pi pi-check" />
  
  <DataTable :value="products">
    <Column field="name" header="名称" />
    <Column field="price" header="价格" />
  </DataTable>
</template>
```

## Radix UI (React)

### 安装

```bash
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
```

### 使用示例

```tsx
import * as Dialog from '@radix-ui/react-dialog';

export function Modal() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button>打开</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg">
          <Dialog.Title>标题</Dialog.Title>
          <Dialog.Description>描述内容</Dialog.Description>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

## 选择建议

| 场景 | 推荐方案 |
|------|----------|
| React 项目 | shadcn/ui + Tailwind |
| Vue 项目 | PrimeVue 或 Nuxt UI |
| 需要高度定制 | Radix UI + Tailwind |
| 快速原型 | Tailwind + DaisyUI |
| 企业应用 | PrimeVue / Ant Design |

