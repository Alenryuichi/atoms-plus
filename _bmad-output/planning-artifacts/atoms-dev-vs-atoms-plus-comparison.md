# atoms.dev vs atoms_plus: Detailed Comparison

**Date:** 2026-03-05  
**Purpose:** Feature-by-feature comparison of reference product vs implementation

---

## 📋 Feature Comparison Table

### Core Features (atoms.dev Baseline)

| Feature | atoms.dev | atoms_plus | Status | Notes |
|---------|-----------|-----------|--------|-------|
| **Vibe Coding** | ✅ | ✅ | 🟢 Match | Natural language → working app |
| **Race Mode** | ✅ | ✅ | 🟡 90% | Backend complete, UI in progress |
| **Auto-Role** | ✅ | ✅ | 🟡 75% | Detection works, integration partial |
| **Scaffolding** | ✅ | ✅ | 🟢 Match | 4 frameworks supported |
| **One-Click Deploy** | ✅ | ❌ | 🔴 0% | Requires cloud infrastructure |
| **GitHub Integration** | ✅ | ✅ | 🟢 Match | Full Git support |
| **Stripe Payment** | ✅ | 🟡 | 🟡 70% | Credit system done, Stripe pending |

### Unique Features (atoms_plus Only)

| Feature | atoms.dev | atoms_plus | Status | Notes |
|---------|-----------|-----------|--------|-------|
| **Orchestrator** | ❌ | ✅ | 🟡 50% | Multi-agent coordination, UI pending |
| **Terminal** | ❌ | ✅ | 🟢 100% | Execute commands directly |
| **Browser** | ❌ | ✅ | 🟢 100% | Automated web interactions |
| **Code Editor** | ❌ | ✅ | 🟢 100% | Full editing with diff view |
| **File Manager** | ❌ | ✅ | 🟢 100% | Browse and edit project files |

---

## 🏗️ Architecture Comparison

### atoms.dev Architecture
```
Frontend Layer:
  Nuxt.js 3 + PrimeVue + Pinia + TypeScript
  ↓
API Layer:
  MetaGPT REST API
  ↓
Backend Layer:
  MetaGPT (Python) + FastAPI
  ↓
Data Layer:
  Supabase (PostgreSQL)
  ↓
External Services:
  Stripe (Payment)
  atoms.world (Hosting)
```

### atoms_plus Architecture
```
Frontend Layer:
  React 18 + TypeScript + TanStack Query + Tailwind
  ↓
API Layer:
  OpenHands REST API + Atoms Plus Extensions
  ↓
Backend Layer:
  OpenHands (Python) + FastAPI + LiteLLM
  ↓
Data Layer:
  Supabase (PostgreSQL)
  ↓
External Services:
  Stripe (Payment - pending)
  Railway (Backend Hosting)
  Vercel (Frontend Hosting)
```

---

## 🤖 AI Agent System Comparison

### atoms.dev Agents (8 Roles)
| Role | Name | Specialty |
|------|------|-----------|
| Team Leader | Mike | Coordination, delegation, review |
| Product Manager | Emma | PRD, requirements, user stories |
| Architect | Bob | System design, API design |
| Project Manager | Eve | Task breakdown, timeline, risk |
| Engineer | Alex | Game, app, web development |
| Data Analyst | David | Data analysis, ML, web scraping |
| Deep Researcher | Iris | Research, synthesis, information |
| SEO Specialist | Sarah | Keyword research, content optimization |

### atoms_plus Agents (8 Roles)
| Role | Name | Specialty |
|------|------|-----------|
| Team Leader | Mike | Coordination, delegation, review |
| Product Manager | Emma | PRD, requirements, user stories |
| Architect | Alex | System design, API design |
| Project Manager | Sarah | Task breakdown, timeline, risk |
| Engineer | Bob | Code implementation, debugging |
| Data Analyst | Diana | Data analysis, visualization, ML |
| Deep Researcher | Ryan | Research, synthesis, documentation |
| SEO Specialist | Sophie | Keyword research, content optimization |

**Difference:** Same 8 roles, slightly different names/assignments

---

## 🚀 Model Support Comparison

### atoms.dev Models (15+)

**Claude (Anthropic)**
- Claude Opus 4.6
- Claude Sonnet 4.6, 4.5, 4, 3.7

**GPT (OpenAI)**
- GPT-5, GPT-5-Chat
- GPT-4o, GPT-4o-mini

**Gemini (Google)**
- Gemini 3.1 Pro Preview
- Gemini 3 Pro Preview, 3 Flash Preview
- Gemini 2.5 Pro, 2.5 Flash

**Other**
- DeepSeek V3.2, V3.2-Exp, V3
- Qwen3 Coder Plus
- GLM-5, GLM-4.7

### atoms_plus Models (17)

**Alibaba Cloud**
- qwen-plus
- qwen-max
- qwen-turbo

**DeepSeek**
- deepseek-chat
- deepseek-coder

**Zhipu AI**
- glm-4-plus
- glm-4-flash
- glm-4

**Anthropic**
- claude-sonnet-4
- claude-opus-4
- claude-3.5-sonnet

**OpenAI**
- gpt-4o
- gpt-4o-mini
- gpt-4-turbo

**Google**
- gemini-2.0-flash
- gemini-1.5-pro

**Mistral**
- mistral-large-latest

**Comparison:**
- atoms_plus: 17 models (2 more than atoms.dev)
- atoms_plus: Better Chinese model support (Qwen, GLM, DeepSeek)
- atoms.dev: More recent Claude/GPT versions

---

## 💰 Pricing Model Comparison

### atoms.dev Pricing Structure
```
Free Tier:
  - $0/month
  - 15 daily credits
  - 2.5M monthly credits
  - Basic features

Pro Tier:
  - $20-70/month
  - 15 daily credits
  - 10M-35M monthly credits
  - 10GB storage

Max Tier:
  - $100-3000/month
  - 15 daily credits
  - 50M-1500M monthly credits
  - Race Mode (Max 100+)
  - 100GB storage

Annual Discount: ~18% off
```

### atoms_plus Pricing Structure
```
🟡 IN DEVELOPMENT

Planned:
  - Similar tiered model
  - Free tier with basic features
  - Pro tier with Race Mode
  - Max tier with Orchestrator
  - Stripe integration pending

Current Status:
  - Credit system backend: ✅ Ready
  - Stripe integration: ❌ Pending
```

---

## 🎯 Feature Depth Comparison

### Race Mode Implementation

**atoms.dev:**
- Parallel execution of multiple models
- Real-time streaming results
- User selects best output
- Integrated into main chat interface

**atoms_plus:**
- ✅ Parallel execution (17 models)
- ✅ Real-time streaming
- ✅ Result selection logic
- 🟡 UI needs refinement
- ✅ Dedicated API endpoints
- ✅ Result comparison framework

**Winner:** atoms_plus (more models, dedicated API)

---

### Auto-Role Implementation

**atoms.dev:**
- Automatic role detection based on task
- Role influences agent behavior
- Seamless integration into workflow

**atoms_plus:**
- ✅ Automatic role detection
- ✅ Microagent-based role system
- 🟡 UI shows detected role
- 🟡 Role integration partial
- ✅ Extensible role system

**Winner:** atoms.dev (fully integrated), atoms_plus (more extensible)

---

### Scaffolding Implementation

**atoms.dev:**
- Multiple framework templates
- Complete project structure
- Build configuration included
- Starter code provided

**atoms_plus:**
- ✅ 4 framework templates
- ✅ Complete project structure
- ✅ Build configuration
- ✅ Starter code
- ✅ API-driven generation

**Winner:** Tie (both complete)

---

### Deployment Implementation

**atoms.dev:**
- One-click deployment to atoms.world
- Custom domain support
- Automatic CI/CD
- Hosting included

**atoms_plus:**
- ❌ One-click deployment not implemented
- ✅ Manual deployment to Vercel/Railway
- ✅ Git integration for CI/CD
- ❌ Hosting not included

**Winner:** atoms.dev (complete solution)

---

## 🔧 Technology Stack Comparison

### Frontend

| Aspect | atoms.dev | atoms_plus |
|--------|-----------|-----------|
| Framework | Nuxt.js 3 | React 18 |
| Language | TypeScript | TypeScript |
| State Management | Pinia | TanStack Query |
| UI Library | PrimeVue | Radix UI / Tailwind |
| Styling | CSS Variables | Tailwind CSS |
| Build Tool | Vite | Vite |

**Verdict:** atoms.dev more mature, atoms_plus more modern

### Backend

| Aspect | atoms.dev | atoms_plus |
|--------|-----------|-----------|
| Framework | FastAPI | FastAPI |
| Language | Python | Python |
| LLM Integration | MetaGPT | LiteLLM |
| Agent System | MetaGPT | OpenHands |
| Async Support | ✅ | ✅ |
| Extensibility | Limited | High |

**Verdict:** atoms_plus more extensible

### Database

| Aspect | atoms.dev | atoms_plus |
|--------|-----------|-----------|
| Database | Supabase | Supabase |
| Auth | Supabase Auth | Supabase Auth |
| Realtime | ✅ | ✅ |
| Storage | ✅ | ✅ |

**Verdict:** Identical

### Deployment

| Aspect | atoms.dev | atoms_plus |
|--------|-----------|-----------|
| Frontend | atoms.world | Vercel |
| Backend | atoms.world | Railway |
| CDN | Cloudflare | Vercel CDN |
| CI/CD | Custom | GitHub Actions |

**Verdict:** atoms.dev integrated, atoms_plus modular

---

## 📊 Completion Status by Feature

### atoms.dev (Reference)
```
Vibe Coding:        ████████████████████ 100%
Race Mode:          ████████████████████ 100%
Auto-Role:          ████████████████████ 100%
Scaffolding:        ████████████████████ 100%
One-Click Deploy:   ████████████████████ 100%
GitHub Integration: ████████████████████ 100%
Stripe Payment:     ████████████████████ 100%
```

### atoms_plus (Current)
```
Vibe Coding:        ████████████████████ 100%
Race Mode:          ██████████████████░░  90%
Auto-Role:          ███████████████░░░░░  75%
Scaffolding:        ████████████████████ 100%
One-Click Deploy:   ░░░░░░░░░░░░░░░░░░░░   0%
GitHub Integration: ████████████████████ 100%
Stripe Payment:     ██████████████░░░░░░  70%
Orchestrator:       ██████████░░░░░░░░░░  50%
Terminal/Browser:   ████████████████████ 100%
Code Editor:        ████████████████████ 100%
```

---

## 🎯 Strategic Positioning

### atoms.dev Strengths
1. **Complete Product** - All features fully implemented
2. **Proven Market** - $31M funding, established user base
3. **Polished UI/UX** - Nuxt + PrimeVue maturity
4. **One-Click Deployment** - Unique hosting solution
5. **Integrated Payment** - Stripe fully working

### atoms.dev Weaknesses
1. **Limited Dev Tools** - No terminal/browser/editor
2. **Fewer Models** - 15 vs 17 models
3. **Limited Chinese Model Support** - Weak on Qwen/GLM/DeepSeek
4. **Closed Source** - MetaGPT proprietary
5. **No Orchestrator** - Limited multi-agent coordination

### atoms_plus Strengths
1. **Orchestrator** - Unique multi-agent coordination
2. **Full Dev Environment** - Terminal, browser, editor, file manager
3. **More Models** - 17 models with better Chinese support
4. **Open Source Foundation** - Built on OpenHands
5. **Extensible Architecture** - Easy to add new features
6. **Advanced Code Editing** - Diff view, real-time collaboration

### atoms_plus Weaknesses
1. **Incomplete Features** - Race Mode UI, Auto-Role integration pending
2. **No One-Click Deploy** - Requires manual setup
3. **No Stripe Integration** - Payment system incomplete
4. **Newer Product** - Less proven in market
5. **UI/UX Polish** - Needs refinement vs atoms.dev

---

## 🚀 Competitive Analysis

### If atoms_plus Completes All Features
```
atoms_plus would have:
✅ All atoms.dev features (except one-click deploy)
✅ Orchestrator (unique)
✅ Full dev environment (unique)
✅ More models (17 vs 15)
✅ Better Chinese model support
✅ Open source foundation

atoms_plus would be SUPERIOR in:
- Developer experience (full IDE)
- Model diversity
- Multi-agent coordination
- Extensibility
- Transparency (open source)

atoms_plus would be INFERIOR in:
- One-click deployment
- UI/UX polish
- Market maturity
- Brand recognition
```

### Timeline to Feature Parity
- **Week 1:** Race Mode UI + Auto-Role Integration (2-3 days)
- **Week 2:** Orchestrator UI + Stripe Integration (3-5 days)
- **Week 3:** One-Click Deploy MVP (1-2 weeks)
- **Total:** 2-3 weeks with focused effort

---

## 📈 Recommendation

### For atoms_plus to Win Market
1. **Complete Race Mode UI** (highest impact)
2. **Integrate Auto-Role** (core feature)
3. **Build Orchestrator UI** (unique differentiator)
4. **Implement Stripe** (monetization)
5. **Polish UI/UX** (user experience)
6. **Market Orchestrator** (competitive advantage)

### Key Message
> "atoms_plus is atoms.dev + Orchestrator + Full Dev Environment + Better Models"

---

## 🔗 Reference Links

### atoms.dev
- Official: https://atoms.dev
- Docs: https://docs.atoms.dev
- GitHub: https://github.com/geekan/MetaGPT
- Twitter: https://x.com/MetaGPT_

### atoms_plus
- Demo: https://frontend-ten-beta-79.vercel.app
- GitHub: https://github.com/Alenryuichi/atoms-plus
- Backend: https://openhands-production-c7c2.up.railway.app
- Database: https://akvsldogobzimfbtrdha.supabase.co

---

*Comparison Document v1.0*  
*Last Updated: 2026-03-05*  
*Next Update: After Race Mode UI completion*
