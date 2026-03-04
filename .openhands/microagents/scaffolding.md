---
name: vibe-coding
type: repo
version: 2.0.0
agent: CodeActAgent
---

# Vibe Coding: One-Sentence Web App Generation

When the user describes an app in natural language (e.g., "Create a todo app"), you execute the complete workflow autonomously.

## Core Philosophy

1. **Fast delivery** — Start building immediately, ask minimal questions
2. **Fully functional** — Generate working code, not templates
3. **Instant feedback** — Always run `npm run dev` and report the preview URL
4. **Smart defaults** — React + Vite + TypeScript + Tailwind unless user specifies otherwise

## Execution Workflow

### Step 1: Clarify (Max 1-2 questions)

If the user's request is vague, ask **at most 1-2 clarifying questions**:

```
MUST clarify:
- What is the core functionality?

INFER from context (use defaults if not specified):
- Framework: React + Vite (default)
- Styling: Tailwind CSS (default)
- Language: TypeScript (default)
```

**Do NOT over-ask.** "Todo app" implies: add, delete, mark complete. Start building.

### Step 2: Create Project

Use Vite for the fastest setup:

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app

npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
EOF

cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF
```

### Step 3: Implement Features

Write complete, functional code. **Not boilerplate — real features.**

Example `src/App.tsx` for a todo app:

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
        <h1 className="text-2xl font-bold mb-4">Todo List</h1>
        <div className="flex gap-2 mb-4">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTodo()}
            placeholder="Add a task..."
            className="flex-1 px-3 py-2 border rounded"
          />
          <button onClick={addTodo} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Add
          </button>
        </div>
        <ul className="space-y-2">
          {todos.map(todo => (
            <li key={todo.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(todo.id)} />
              <span className={todo.completed ? 'line-through text-gray-400' : ''}>{todo.text}</span>
              <button onClick={() => deleteTodo(todo.id)} className="ml-auto text-red-500 hover:text-red-700">Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

### Step 4: Install & Run

```bash
npm install
npm run dev
```

### Step 5: Report Results

```
✅ App created successfully!

📁 Location: /workspace/my-app
🚀 Dev server: http://localhost:5173

Features implemented:
- ✅ Add tasks
- ✅ Mark complete
- ✅ Delete tasks

Next steps:
- Customize styling
- Add persistence (localStorage or Supabase)
- Add more features
```

## Framework Selection

| User Intent | Framework |
|-------------|-----------|
| "simple app", "small tool", "utility" | React + Vite |
| "needs SEO", "blog", "landing page" | Next.js |
| "admin panel", "dashboard" | React + Vite + shadcn/ui |
| "Vue" mentioned | Vue 3 + Vite |

## Best Practices (from Vibe Coding research)

1. **Efficient onboarding** — Use least tokens to convey maximum context
2. **Automatic feedback loop** — Run `npm run build` or `npm run dev` after changes
3. **Don't re-scan** — Go directly to the directories you need
4. **Complete the loop** — Always end with a running dev server and clear summary

