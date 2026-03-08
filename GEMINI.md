# 🚀 Atoms Plus - AI-Powered Low-Code Development Platform

Atoms Plus is a next-generation AI development platform built as an extension of **OpenHands** (formerly All-Hands-AI). It combines multi-model racing, specialized agent roles, and intelligent task orchestration to create an autonomous AI development team.

## 🏗️ Project Overview

- **Core Technology**: Based on [OpenHands](https://github.com/OpenHands/OpenHands), extending it with custom features.
- **Backend**: Python 3.12, FastAPI, Uvicorn, Poetry.
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, Framer Motion.
- **Database**: Supabase (for credit system and user data).
- **Deployment**: Vercel (Frontend), Railway (Backend), Supabase (DB).
- **Key Features**:
  - **🏎️ Race Mode**: Multi-model competition (17+ models) to find the best result.
  - **👥 Agent Roles**: 8 specialized AI agents (Product Manager, Architect, Engineer, etc.) via OpenHands Microagents.
  - **🎯 Orchestrator**: Multi-agent coordination for complex task dispatch.
  - **🛠️ Scaffolding**: One-click project generation for React, Next.js, Vue, and Nuxt.

## 🚀 Building and Running

The project uses a `Makefile` for streamlined development.

### 📋 Prerequisites
- **Node.js**: 22.12.0+
- **Python**: 3.12+
- **Poetry**: 1.8+
- **Docker**: Optional (required for Docker-based runtime)

### 🛠️ Key Commands
- **Build All**: `make build` (installs backend & frontend dependencies, builds frontend)
- **Run Application**: `make run` (starts backend on port 3000 and frontend on port 3001)
- **Start Backend Only**: `make start-backend` or `python -m atoms_plus.atoms_server`
- **Start Frontend Only**: `cd frontend && npm run dev`
- **Linting**: `make lint` (runs backend and frontend linters)
- **Testing**: `make test` (runs frontend vitest tests)

## 📁 Directory Structure

```text
atoms-plus/
├── atoms_plus/           # Core Atoms Plus extension logic
│   ├── race_mode/        # Multi-model racing implementation
│   ├── roles/            # Agent role API and management
│   ├── orchestrator/     # Multi-agent coordination engine
│   ├── scaffolding/      # Project generation templates and logic
│   └── atoms_server.py   # Main server entry point (extends OpenHands)
├── openhands/            # OpenHands core source code
│   ├── app_server/       # V1 Application Server (Current Architecture)
│   └── server/           # V0 Legacy Server (Scheduled for removal 2026-04-01)
├── frontend/             # React/Vite/TypeScript frontend
│   └── src/components/   # UI components including Atoms Plus features
├── .openhands/           # OpenHands configuration
│   └── microagents/      # Role-based and domain-specific AI logic (15+ agents)
├── enterprise/           # Enterprise-specific features and migrations
├── docs/                 # Architecture, research, and deep-dive documentation
└── Makefile              # Project-wide build and automation script
```

## 🛠️ Development Conventions

### ⚠️ Architecture: V1 vs V0
- **Always use V1 Architecture**: V0 is legacy code. V1 is the current standard.
- **Conversation Management**: Look in `openhands/app_server/`.
- **Runtime**: `RUNTIME=local` uses `ProcessSandboxService` in V1, not the old `LocalRuntime`.
- **Sandboxes**: Working directories are typically in `/tmp/openhands-sandboxes/{id}` or Daytona Cloud.

### 🤖 Microagents and Roles
- Roles are defined as **Microagents** in `.openhands/microagents/role-*.md`.
- These agents use `triggers` to automatically inject specific system prompts into the AI context.
- The `atoms_plus/roles` API is primarily used for UI synchronization with these microagents.

### 🔌 Extension Pattern
- Atoms Plus follows the **Enterprise Extension Pattern**:
  - Do not modify `openhands/` core files unless necessary.
  - Register new routes in `atoms_plus/atoms_server.py`.
  - Import the base app from `openhands.server.app` and wrap it with custom logic.

## 📄 Key Configuration Files
- `CLAUDE.md`: Detailed deployment status, environment variables, and V0/V1 architecture guide.
- `pyproject.toml`: Backend dependencies and Poetry configuration.
- `frontend/package.json`: Frontend dependencies and scripts.
- `config.atoms-plus.toml`: Specific configuration for the Atoms Plus extension.
- `Makefile`: Source of truth for build and run workflows.

## 📡 Essential Environment Variables
- `LLM_API_KEY`: API key for the primary model (e.g., Aliyun Qwen).
- `LLM_BASE_URL`: Base URL for the LLM provider.
- `RUNTIME`: `local` or `daytona` (cloud sandbox).
- `VITE_BACKEND_BASE_URL`: Frontend configuration for the backend URL.
- `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`: Supabase integration for credits and auth.
