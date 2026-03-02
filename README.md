<p align="center">
  <img src="frontend/src/assets/branding/atoms-plus-logo.png" alt="Atoms Plus" width="120" />
</p>

<h1 align="center">Atoms Plus</h1>

<p align="center">
  <strong>🚀 AI-Powered Low-Code Development Platform</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#race-mode">Race Mode</a> •
  <a href="#agent-roles">Agent Roles</a> •
  <a href="#orchestrator">Orchestrator</a> •
  <a href="#deployment">Deployment</a>
</p>

---

## ✨ What is Atoms Plus?

Atoms Plus is a next-generation AI development platform that combines **multi-model racing**, **specialized agent roles**, and **intelligent task orchestration** to supercharge your development workflow.

> 💡 **Think of it as your AI development team** - with a Product Manager, Architect, Engineers, and more, all working together on your tasks.

---

## 🎯 Features

### 🏎️ Race Mode - Multi-Model Competition

Race multiple AI models simultaneously and pick the best result:

| Provider | Models |
|----------|--------|
| **Alibaba Cloud** | Qwen Plus, Qwen Max, Qwen Turbo |
| **DeepSeek** | DeepSeek V3, DeepSeek Coder |
| **Zhipu AI** | GLM-4 Plus, GLM-4 Flash, GLM-4 |
| **Anthropic** | Claude Sonnet 4, Claude Opus 4, Claude 3.5 Sonnet |
| **OpenAI** | GPT-4o, GPT-4o Mini, GPT-4 Turbo |
| **Google** | Gemini 2.0 Flash, Gemini 1.5 Pro |
| **Mistral** | Mistral Large |

### 👥 Agent Roles - Your AI Team

8 specialized AI agents, each with unique capabilities:

| Role | Name | Specialty |
|------|------|-----------|
| 🎯 **Team Leader** | Mike | Coordination, delegation, review |
| 📋 **Product Manager** | Emma | Requirements, user stories, PRD |
| 🏗️ **Architect** | Alex | System design, API design, tech selection |
| 📊 **Project Manager** | Sarah | Task breakdown, timeline, risk assessment |
| 💻 **Engineer** | Bob | Coding, debugging, testing |
| 📈 **Data Analyst** | Diana | Data analysis, visualization, ML |
| 🔬 **Deep Researcher** | Ryan | Research, synthesis, documentation |
| 🔍 **SEO Specialist** | Sophie | Keyword research, content optimization |

### 🎯 Orchestrator - Multi-Agent Coordination

Dispatch complex tasks to multiple agents working in parallel:

```
Your Task → Auto-Analysis → Multi-Role Dispatch → Parallel Execution → Aggregated Result
                    ↓
        ┌───────────┼───────────┐
        ↓           ↓           ↓
   Product Mgr   Architect   Engineer
        ↓           ↓           ↓
   Requirements  Design     Implementation
        └───────────┼───────────┘
                    ↓
            Complete Solution
```

### 💳 Credits System

- Real-time cost tracking per model
- Token usage statistics
- Balance management via Supabase

### 🛠️ Developer Tools

- **Terminal** - Execute commands directly
- **Browser** - Automated web interactions
- **Code Editor** - Full editing with diff view
- **Git Integration** - Branch, commit, push, PR
- **File Management** - Browse and edit project files

---

## 🚀 Quick Start

### Prerequisites

- Node.js 22+
- Python 3.12+
- Poetry

### Installation

```bash
# Clone the repository
git clone https://github.com/Alenryuichi/atoms-plus.git
cd atoms-plus

# Install dependencies
make build

# Start the application
make run
```

### Environment Variables

```bash
# Backend (.env)
LLM_API_KEY=your-api-key
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_MODEL=qwen-plus

# Frontend (.env)
VITE_BACKEND_BASE_URL=your-backend-url
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-key
```

---

## 📡 API Reference

### Race Mode API

```bash
# Start a race
POST /api/v1/race/start
{
  "prompt": "Write a React component",
  "models": ["gpt-4o", "claude-sonnet-4", "qwen-plus"]
}

# Get available models
GET /api/v1/race/models
```

### Orchestrator API

```bash
# Dispatch to multiple roles
POST /api/v1/orchestrator/dispatch
{
  "subtasks": [
    {"role": "product_manager", "task": "Write requirements"},
    {"role": "architect", "task": "Design system"},
    {"role": "engineer", "task": "Implement feature"}
  ],
  "parallel": true
}

# Get role suggestion
POST /api/v1/orchestrator/suggest-role
{
  "task": "Build a REST API for user management"
}
```

### Roles API

```bash
# List all roles
GET /api/v1/roles/

# Get role details
GET /api/v1/roles/{role_id}

# Get role system prompt
GET /api/v1/roles/{role_id}/prompt
```

---

## 🌐 Deployment

### Frontend (Vercel)

```bash
cd frontend
npm run build
npx vercel deploy --prod
```

### Backend (Railway)

```bash
# Set start command
uvicorn atoms_plus.atoms_server:app --host 0.0.0.0 --port $PORT
```

---

## 📊 Architecture

```
atoms-plus/
├── atoms_plus/           # Core extension
│   ├── race_mode/        # Multi-model racing
│   ├── roles/            # Agent role system
│   ├── orchestrator/     # Multi-agent coordination
│   └── atoms_server.py   # Server entry
├── frontend/             # React frontend
│   ├── src/components/   # UI components
│   └── src/api/          # API services
└── ...
```

---

---

## 🗺️ Roadmap

- [x] Race Mode - Multi-model competition
- [x] Agent Roles - 8 specialized AI agents
- [x] Orchestrator - Multi-agent coordination
- [x] Credits System - Supabase integration
- [ ] One-Click Deployment - Auto-hosting
- [ ] Stripe Integration - Payment processing
- [ ] Team Collaboration - Multi-user workspaces

---

## 🔗 Links

- **Production**: https://frontend-ten-beta-79.vercel.app
- **API Docs**: `/docs` (Swagger UI)
- **Health Check**: `/atoms-plus/health`

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Made with ❤️ by the Atoms Plus Team
</p>

