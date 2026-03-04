---
name: atoms-plus
type: repo
version: 2.0.0
agent: CodeActAgent
---

# Atoms Plus Development Guide

You are working in the Atoms Plus repository, an AI-assisted development platform built on OpenHands.

## Project Structure

```
atoms-plus/
├── atoms_plus/           # Backend extensions
│   ├── atoms_server.py   # Entry point (Railway runs this)
│   ├── scaffolding/      # Project scaffolding API
│   ├── race_mode/        # Multi-model racing
│   └── roles/            # Agent role system
├── frontend/             # React frontend (Vercel)
├── openhands/            # OpenHands core (don't modify)
└── .openhands/microagents/  # Custom skills
```

## Quick Commands

### Backend Development

```bash
# Run backend locally
uvicorn atoms_plus.atoms_server:app --host 0.0.0.0 --port 3000 --reload

# Run tests
poetry run pytest tests/unit/test_xxx.py

# Lint before commit
pre-commit run --config ./dev_config/python/.pre-commit-config.yaml
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev          # Start dev server
npm run lint:fix     # Fix lint issues
npm run build        # Production build
```

## Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | https://frontend-ten-beta-79.vercel.app |
| Backend | Railway | https://openhands-production-c7c2.up.railway.app |
| Database | Supabase | https://akvsldogobzimfbtrdha.supabase.co |

## Key APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/atoms-plus` | GET | Version info |
| `/api/v1/scaffolding/templates` | GET | Project templates |
| `/api/v1/scaffolding/generate` | POST | Generate project |
| `/api/v1/roles/auto-detect` | POST | Detect best role |
| `/api/v1/race/start` | POST | Start model race |

## Development Rules

1. **V1 Architecture** - Modify `openhands/app_server/`, not `openhands/server/`
2. **Runtime** - Use `ProcessSandboxService` when `RUNTIME=local`
3. **CORS** - Always set `PERMITTED_CORS_ORIGINS` in Railway
4. **Pre-commit** - Run hooks before pushing any changes
