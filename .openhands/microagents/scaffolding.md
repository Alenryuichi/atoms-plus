---
name: one-sentence-app
type: repo
version: 2.0.0
agent: CodeActAgent
---

# 一句话生成 Web 应用

当用户用自然语言描述想要的应用时（如"创建一个待办事项应用"），你应该自动完成整个流程。

## 触发场景

当用户的消息包含以下意图时激活：
- "创建一个...应用/网站/项目"
- "帮我做一个..."
- "我想要一个..."
- "Create a ... app"
- "Build me a ..."
- "Make a ..."

## 执行流程

### 第 1 步：理解需求（不超过 2 轮对话）

如果用户需求不够清晰，**最多问 1-2 个问题**：

```
必须明确的：
- 应用的核心功能是什么？

可以推断的（用户没说就用默认值）：
- 框架：默认 React + Vite
- 样式：默认 Tailwind CSS
- 语言：默认 TypeScript
```

**不要过度询问**。用户说"待办事项应用"，你就知道需要：添加、删除、标记完成。

### 第 2 步：创建项目

使用 Vite 创建项目（最快的方式）：

```bash
# React 项目
npm create vite@latest my-app -- --template react-ts
cd my-app

# 安装 Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 配置 tailwind.config.js
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
EOF

# 配置 src/index.css
cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF
```

### 第 3 步：实现功能

直接编写代码实现用户需要的功能。**不要只生成模板，要生成完整可用的代码。**

示例 - 待办事项应用的 `src/App.tsx`：

```tsx
import { useState } from 'react'

interface Todo {
  id: number
  text: string
  completed: boolean
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState('')

  const addTodo = () => {
    if (!input.trim()) return
    setTodos([...todos, { id: Date.now(), text: input, completed: false }])
    setInput('')
  }

  const toggleTodo = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(t => t.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">待办事项</h1>
        <div className="flex gap-2 mb-4">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTodo()}
            placeholder="添加新任务..."
            className="flex-1 px-3 py-2 border rounded"
          />
          <button onClick={addTodo} className="px-4 py-2 bg-blue-500 text-white rounded">
            添加
          </button>
        </div>
        <ul className="space-y-2">
          {todos.map(todo => (
            <li key={todo.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
              />
              <span className={todo.completed ? 'line-through text-gray-400' : ''}>
                {todo.text}
              </span>
              <button onClick={() => deleteTodo(todo.id)} className="ml-auto text-red-500">
                删除
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

### 第 4 步：安装依赖并启动

```bash
npm install
npm run dev
```

### 第 5 步：告诉用户结果

```
✅ 应用已创建完成！

📁 项目位置: /workspace/my-app
🚀 开发服务器: http://localhost:5173

功能：
- ✅ 添加待办事项
- ✅ 标记完成
- ✅ 删除任务

下一步你可以：
- 修改样式
- 添加数据持久化（localStorage 或 Supabase）
- 添加更多功能
```

## 框架选择指南

| 用户说的 | 使用的框架 |
|---------|-----------|
| "简单应用"、"小工具" | React + Vite |
| "需要 SEO"、"博客"、"官网" | Next.js |
| "后台管理"、"Dashboard" | React + Vite + shadcn/ui |
| "Vue" | Vue 3 + Vite |

## 关键原则

1. **快速交付** - 用户说一句话，你就开始做，不要问太多
2. **完整可用** - 生成的代码是能运行的，不是半成品
3. **启动服务** - 最后一定要运行 `npm run dev`
4. **告知结果** - 明确告诉用户预览地址和已实现的功能

