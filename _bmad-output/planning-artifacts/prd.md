---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments:
  - path: '_bmad-output/planning-artifacts/RESEARCH_SUMMARY.md'
    type: 'research'
    description: 'Atoms.dev feature mapping and implementation status'
  - path: '_bmad-output/planning-artifacts/research/market-multi-agent-frameworks-research-2026-03-05.md'
    type: 'research'
    description: 'LangGraph framework selection for Team Mode'
  - path: '_bmad-output/planning-artifacts/research/domain-high-fidelity-ui-cloning-research-2026-03-04.md'
    type: 'research'
    description: 'UI cloning strategies and tool comparison'
  - path: 'docs/research/atoms-dev-analysis.md'
    type: 'reference'
    description: 'Competitor analysis (atoms.dev)'
  - path: 'docs/architecture/system-design.md'
    type: 'architecture'
    description: 'Existing system architecture'
classification:
  projectType: 'feature-enhancement'
  domain: 'ai-development-tools'
  complexity: 'medium'
  projectContext: 'brownfield'
workflowType: 'prd'
lastStep: 'step-11-polish'
projectContext: 'brownfield'
userName: 'Ryuichi'
date: '2026-03-06'
---

# Product Requirements Document
## Team Mode: Human-in-the-Loop Requirement Clarification

**Version:** 1.0.0  
**Status:** ✅ Complete  
**Date:** 2026-03-06  
**Author:** Ryuichi (via BMAD Workflow)

---

# Executive Summary

## Vision Statement

**Transform Atoms Plus Team Mode from a "hope it understands" experience into a collaborative dialogue that ensures requirements are crystal clear before a single line of code is written.**

Team Mode currently operates with a critical flaw: the PM agent executes once and immediately hands off to Architect, making assumptions without validation. This leads to wasted development cycles when the AI builds the wrong thing.

By implementing **Human-in-the-Loop (HITL) Requirement Clarification** based on the ClarifyGPT framework, we will:
- **Detect ambiguous requirements** before code generation begins
- **Ask targeted clarifying questions** (2-4 max, never overwhelming)
- **Allow users to skip** with AI making reasonable assumptions
- **Iterate until confident** that requirements are understood

## Problem Statement

> "PM 只执行一次么？ 没有澄清需求？"

**Current State:**
- PM agent runs once → outputs requirements → hands to Architect
- No validation of understanding
- Assumptions are implicit and often wrong
- Users discover misalignment only after code is generated

**Impact:**
- 40%+ of generated code requires significant rework
- User frustration with "the AI doesn't understand me"
- Wasted compute credits on wrong implementations

## Solution Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    HITL Clarification Flow                       │
│                                                                  │
│  User Input → [PM Analyzes] → Ambiguous? ─────No───→ [Architect] │
│                                   │                              │
│                                  Yes                             │
│                                   ↓                              │
│                         [Generate Questions]                     │
│                                   ↓                              │
│                         [Present to User]                        │
│                                   ↓                              │
│                    ┌──────────────┴──────────────┐              │
│                    ↓                             ↓              │
│              [User Answers]              [User Skips]           │
│                    ↓                             ↓              │
│              [Refine Requirements]    [AI Assumes]              │
│                    ↓                             ↓              │
│                    └──────────────┬──────────────┘              │
│                                   ↓                              │
│                         [Architect Proceeds]                     │
└─────────────────────────────────────────────────────────────────┘
```

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| **Requirement Accuracy** | ~60% | 85%+ | User satisfaction survey post-generation |
| **First-Time Success Rate** | ~40% | 70%+ | % of tasks requiring no rework |
| **Clarification Efficiency** | N/A | 1.5 rounds avg | Average questions per task |
| **User Satisfaction** | Unknown | 4.2+/5.0 | NPS survey |
| **Time to First Code** | Immediate | +45s max | Time delta from input to Architect |

---

# User Journeys

## Journey 1: Ambiguous Requirement (Happy Path)

**Persona:** Developer Dave - Wants to build a dashboard but hasn't specified details

```
1. Dave: "Build me a dashboard for tracking sales"
   
2. PM Agent Detects Ambiguity:
   - What data sources? (Database, API, CSV?)
   - What visualizations? (Charts, tables, KPIs?)
   - What time ranges? (Real-time, daily, monthly?)
   
3. PM Presents Questions (WebSocket → UI):
   ┌─────────────────────────────────────────────────┐
   │ 🤔 I have a few questions to make sure I       │
   │    build exactly what you need:                 │
   │                                                 │
   │ 1. Where does your sales data come from?        │
   │    ○ Supabase database                          │
   │    ○ External API                               │
   │    ○ CSV uploads                                │
   │    ○ Let me type...                             │
   │                                                 │
   │ 2. What visualizations do you need?             │
   │    ☑ Line charts (trends)                       │
   │    ☑ Bar charts (comparisons)                   │
   │    ☐ Pie charts                                 │
   │    ☑ KPI cards                                  │
   │                                                 │
   │ 3. What time ranges should be supported?        │
   │    [Today] [Week] [Month] [Year] [Custom]       │
   │                                                 │
   │ [Skip - Let AI Decide]        [Submit Answers]  │
   └─────────────────────────────────────────────────┘

4. Dave Answers Questions
   
5. PM Refines Requirements:
   "Build a sales dashboard with:
   - Data source: Supabase 'sales' table
   - Visualizations: Line chart (daily trends), 
     bar chart (product comparison), KPI cards
   - Time ranges: Today, Week, Month, Year, Custom
   - Filters: Product category, region"
   
6. Architect Receives Clear Requirements → Designs System
```

## Journey 2: Clear Requirement (Fast Path)

**Persona:** Expert Emma - Knows exactly what she wants

```
1. Emma: "Create a React component that displays a paginated 
         table with sorting, using TanStack Table, fetching 
         from /api/users with columns: name, email, role, 
         created_at. Use shadcn/ui DataTable pattern."

2. PM Agent Analyzes:
   - Data source: ✅ Specified (/api/users)
   - Columns: ✅ Specified (4 columns)
   - Features: ✅ Specified (pagination, sorting)
   - Tech stack: ✅ Specified (TanStack Table, shadcn/ui)
   - Ambiguity score: LOW (< 20%)

3. PM Skips Clarification:
   "Requirements are clear. Proceeding to architecture..."

4. Architect Receives Requirements Immediately
```

## Journey 3: User Skips Clarification

**Persona:** Impatient Ian - Wants to see something fast

```
1. Ian: "Build a todo app"

2. PM Detects High Ambiguity (many unknowns)

3. PM Presents 4 Questions

4. Ian Clicks [Skip - Let AI Decide]

5. PM Makes Reasonable Assumptions:
   ┌─────────────────────────────────────────────────┐
   │ ℹ️ I'll make these assumptions:                 │
   │                                                 │
   │ • Storage: Local storage (can upgrade to DB)   │
   │ • Features: Add, complete, delete tasks        │
   │ • UI: Simple list with checkboxes              │
   │ • No user authentication                       │
   │                                                 │
   │ You can always refine later!                   │
   └─────────────────────────────────────────────────┘

6. Architect Proceeds with Assumptions
```

---

# Domain Model

## Core Entities

```typescript
// Clarification Session
interface ClarificationSession {
  id: string;
  conversationId: string;
  originalInput: string;
  ambiguityScore: number;          // 0-100
  questions: ClarifyingQuestion[];
  answers: UserAnswer[];
  assumptions: Assumption[];
  refinedRequirements: string;
  status: 'pending' | 'answered' | 'skipped' | 'complete';
  createdAt: Date;
  completedAt?: Date;
}

// Clarifying Question
interface ClarifyingQuestion {
  id: string;
  sessionId: string;
  questionText: string;
  questionType: 'single-choice' | 'multi-choice' | 'free-text' | 'range';
  options?: QuestionOption[];
  priority: 'critical' | 'important' | 'nice-to-have';
  category: 'data' | 'ui' | 'behavior' | 'integration' | 'constraints';
  aiSuggestion?: string;          // What AI would assume if skipped
}

// User Answer
interface UserAnswer {
  questionId: string;
  answerType: 'selected' | 'typed' | 'skipped';
  selectedOptions?: string[];
  freeTextAnswer?: string;
  timestamp: Date;
}

// Assumption (when user skips)
interface Assumption {
  questionId: string;
  assumedValue: string;
  confidence: number;              // 0-100
  reasoning: string;
}
```

## State Extensions (LangGraph)

```typescript
// Extended TeamState for HITL
interface TeamState {
  // Existing fields...
  messages: BaseMessage[];
  currentRole: Role;
  thoughts: Thought[];
  
  // New HITL fields
  clarification: {
    isRequired: boolean;
    session: ClarificationSession | null;
    waitingForUser: boolean;
    maxRounds: number;
    currentRound: number;
  };
}
```

---

# Functional Requirements

## FR-1: Ambiguity Detection

**Priority:** Must Have (M)

**Description:** PM agent analyzes user input to detect ambiguous or underspecified requirements.

**Acceptance Criteria:**
1. PM uses ClarifyGPT-inspired multi-interpretation check
2. Ambiguity score calculated (0-100)
3. Threshold configurable (default: 40)
4. If score > threshold → trigger clarification
5. If score ≤ threshold → proceed directly

**Technical Approach:**
```python
async def detect_ambiguity(user_input: str, context: dict) -> AmbiguityResult:
    """
    ClarifyGPT-inspired ambiguity detection:
    1. Generate 3 different code interpretations
    2. Compare semantic similarity
    3. Low similarity = high ambiguity
    """
    interpretations = await generate_interpretations(user_input, n=3)
    similarity = calculate_pairwise_similarity(interpretations)
    
    return AmbiguityResult(
        score=100 - (similarity * 100),
        ambiguous_aspects=identify_divergent_aspects(interpretations),
        suggested_questions=generate_questions(ambiguous_aspects)
    )
```

---

## FR-2: Question Generation

**Priority:** Must Have (M)

**Description:** Generate targeted, actionable clarifying questions based on detected ambiguity.

**Acceptance Criteria:**
1. Maximum 4 questions per round
2. Questions are specific, not generic
3. Each question has:
   - Clear text
   - Type (single/multi choice, free text)
   - Options where applicable
   - AI suggestion (what it would assume)
4. Questions prioritized by impact on implementation

**Question Categories:**
| Category | Example Questions |
|----------|-------------------|
| **Data** | Where does the data come from? What fields are needed? |
| **UI** | What layout/style? What components? Mobile support? |
| **Behavior** | What happens when X? How should errors be handled? |
| **Integration** | What APIs/services? Authentication method? |
| **Constraints** | Performance requirements? Browser support? |

---

## FR-3: User Interaction UI

**Priority:** Must Have (M)

**Description:** Frontend component for displaying questions and collecting answers.

**Acceptance Criteria:**
1. Questions displayed in modal/panel overlay
2. Support for all question types (single, multi, free-text)
3. "Skip All" button with assumption preview
4. "Submit" button enabled when at least one answer provided
5. Real-time WebSocket integration
6. Mobile-responsive design

**Component Structure:**
```
ClarificationPanel/
├── ClarificationHeader.tsx      # "Help me understand..."
├── QuestionList.tsx             # Maps questions
├── QuestionItem.tsx             # Single question + options
│   ├── SingleChoiceQuestion.tsx
│   ├── MultiChoiceQuestion.tsx
│   └── FreeTextQuestion.tsx
├── AssumptionPreview.tsx        # Shows what AI assumes if skipped
├── ClarificationActions.tsx     # Skip / Submit buttons
└── useClarification.ts          # WebSocket + state hook
```

---

## FR-4: Skip with Assumptions

**Priority:** Must Have (M)

**Description:** Allow users to skip clarification with AI making reasonable assumptions.

**Acceptance Criteria:**
1. "Skip" button always visible
2. Before skipping, show assumption preview
3. Assumptions logged for transparency
4. User can return to clarify later (future iteration)
5. Assumptions influence but don't lock decisions

**Assumption Display:**
```
┌─────────────────────────────────────────────────────────┐
│ If you skip, I'll assume:                               │
│                                                         │
│ • Data source: Local state (can add database later)    │
│ • Styling: Tailwind CSS with shadcn/ui components      │
│ • Auth: No authentication required                      │
│ • Deployment: Development environment only              │
│                                                         │
│ Confidence: 72% based on similar projects              │
│                                                         │
│ [Go Back to Questions]              [Skip & Continue]  │
└─────────────────────────────────────────────────────────┘
```

---

## FR-5: Refined Requirements Output

**Priority:** Must Have (M)

**Description:** PM produces enhanced, detailed requirements after clarification.

**Acceptance Criteria:**
1. Original input preserved
2. Clarification Q&A summarized
3. Explicit requirements listed
4. Assumptions documented
5. Format compatible with Architect node input

**Output Format:**
```markdown
## Refined Requirements

### Original Request
"Build me a dashboard for tracking sales"

### Clarified Details
- **Data Source:** Supabase 'sales' table with columns: 
  id, product_name, amount, region, created_at
- **Visualizations:** 
  - Line chart: Daily revenue trend
  - Bar chart: Revenue by product
  - KPI cards: Total revenue, Orders, Avg order value
- **Time Ranges:** Today, This Week, This Month, This Year, Custom
- **Filters:** Product category, Region

### Assumptions Made
- Real-time updates not required (polling every 5 minutes)
- Single-user dashboard (no role-based access)
- English language only

### Technical Constraints
- Must use existing Supabase connection
- shadcn/ui components preferred
- Mobile-responsive required
```

---

## FR-6: Multi-Round Clarification

**Priority:** Should Have (S)

**Description:** Support multiple rounds of clarification for complex requirements.

**Acceptance Criteria:**
1. Maximum 3 rounds configurable
2. Each round surfaces new questions based on previous answers
3. Round counter displayed to user
4. "Enough, let's proceed" option always available
5. Diminishing questions per round (4 → 2 → 1)

---

## FR-7: Clarification Analytics

**Priority:** Could Have (C)

**Description:** Track clarification patterns to improve question generation.

**Acceptance Criteria:**
1. Log all sessions (questions, answers, skips)
2. Track time to answer
3. Track question usefulness (was answer used?)
4. Weekly aggregation for model fine-tuning
5. Dashboard for admin review

---

# Non-Functional Requirements

## NFR-1: Performance

| Metric | Requirement |
|--------|-------------|
| **Ambiguity detection** | < 3 seconds |
| **Question generation** | < 2 seconds |
| **UI render** | < 100ms |
| **Total added latency** | < 45 seconds (including user think time) |

## NFR-2: Reliability

| Metric | Requirement |
|--------|-------------|
| **Availability** | 99.5% |
| **Error rate** | < 1% of sessions |
| **Graceful degradation** | If detection fails, proceed without clarification |

## NFR-3: Usability

| Metric | Requirement |
|--------|-------------|
| **Question clarity** | 90%+ users understand on first read |
| **Skip path** | Always accessible, never more than 1 click |
| **Mobile support** | Full functionality on mobile devices |

## NFR-4: Security

| Requirement | Implementation |
|-------------|----------------|
| **Input sanitization** | All user answers sanitized before processing |
| **Rate limiting** | Max 10 clarification sessions per minute per user |
| **Data retention** | Clarification data retained for 30 days |

## NFR-5: Scalability

| Scenario | Requirement |
|----------|-------------|
| **Concurrent sessions** | Support 100 simultaneous clarifications |
| **Question storage** | Efficient storage for analytics |
| **LLM calls** | Batch where possible, cache similar patterns |

---

# Technical Architecture

## Backend Changes

### New Files
```
atoms_plus/team_mode/
├── clarification/
│   ├── __init__.py
│   ├── detector.py          # Ambiguity detection logic
│   ├── generator.py         # Question generation
│   ├── models.py            # Pydantic models
│   └── prompts.py           # LLM prompts for clarification
├── nodes/
│   ├── pm_clarify.py        # New PM clarification node
│   └── pm_refine.py         # PM refinement after answers
└── graph.py                  # Updated graph with HITL edges
```

### Graph Modifications
```python
# Updated LangGraph structure
graph = StateGraph(TeamState)

# Existing nodes
graph.add_node("pm", pm_node)
graph.add_node("architect", architect_node)
graph.add_node("engineer", engineer_node)

# New HITL nodes
graph.add_node("pm_detect_ambiguity", pm_detect_ambiguity_node)
graph.add_node("pm_await_clarification", pm_await_clarification_node)
graph.add_node("pm_refine_requirements", pm_refine_requirements_node)

# Updated edges
graph.set_entry_point("pm_detect_ambiguity")

graph.add_conditional_edges(
    "pm_detect_ambiguity",
    should_clarify,
    {
        "clarify": "pm_await_clarification",
        "proceed": "pm"
    }
)

graph.add_edge("pm_await_clarification", "pm_refine_requirements")
graph.add_edge("pm_refine_requirements", "pm")
graph.add_edge("pm", "architect")
# ... rest of graph
```

## Frontend Changes

### New Components
```
frontend/src/components/features/team-mode/
├── clarification/
│   ├── ClarificationPanel.tsx
│   ├── QuestionList.tsx
│   ├── QuestionItem.tsx
│   ├── AssumptionPreview.tsx
│   └── ClarificationActions.tsx
├── hooks/
│   └── useClarification.ts
└── types/
    └── clarification.ts
```

### WebSocket Events
```typescript
// New WebSocket message types
type ClarificationMessage = 
  | { type: 'clarification:questions'; payload: ClarifyingQuestion[] }
  | { type: 'clarification:assumptions'; payload: Assumption[] }
  | { type: 'clarification:complete'; payload: { refinedRequirements: string } };

// User responses
type ClarificationResponse =
  | { type: 'clarification:answer'; payload: UserAnswer[] }
  | { type: 'clarification:skip'; payload: { confirm: boolean } };
```

---

# Implementation Plan

## Phase 1: Core Detection (Week 1)

| Task | Effort | Owner |
|------|--------|-------|
| Implement `detector.py` with ambiguity scoring | 2 days | Backend |
| Create `generator.py` for question generation | 2 days | Backend |
| Add prompts for ClarifyGPT-style detection | 1 day | Backend |
| Unit tests for detection logic | 1 day | Backend |

## Phase 2: Graph Integration (Week 2)

| Task | Effort | Owner |
|------|--------|-------|
| Add HITL nodes to LangGraph | 2 days | Backend |
| Implement WebSocket events for clarification | 1 day | Backend |
| Update SQLite checkpointer for HITL state | 1 day | Backend |
| Integration tests for full flow | 2 days | Backend |

## Phase 3: Frontend UI (Week 2-3)

| Task | Effort | Owner |
|------|--------|-------|
| `ClarificationPanel` component | 2 days | Frontend |
| Question type components | 1 day | Frontend |
| WebSocket hook integration | 1 day | Frontend |
| Assumption preview UI | 1 day | Frontend |
| Mobile responsive styling | 1 day | Frontend |

## Phase 4: Polish & Testing (Week 3)

| Task | Effort | Owner |
|------|--------|-------|
| End-to-end testing | 2 days | QA |
| Performance optimization | 1 day | Backend |
| Documentation | 1 day | All |
| User acceptance testing | 2 days | Product |

---

# Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **LLM latency** | Medium | High | Cache similar patterns, timeout fallback |
| **Question quality** | Medium | Medium | Iterative prompt engineering, user feedback |
| **User frustration** | Low | High | Always allow skip, limit to 4 questions |
| **State complexity** | Medium | Medium | Comprehensive testing, clear state transitions |
| **WebSocket reliability** | Low | High | Fallback to polling, reconnection logic |

---

# Appendix

## A. ClarifyGPT Research Summary

**Source:** FSE 2024 - "ClarifyGPT: Surpassing Human-Level Requirement Clarification"

**Key Insights:**
1. Code consistency check: Generate 3+ interpretations, measure divergence
2. Targeted questions: Focus on divergent aspects only
3. Results: 70.96% → 80.80% Pass@1 improvement (GPT-4)

## B. Competitor Analysis

**Cursor IDE:**
- Uses inline clarification in Composer mode
- Questions integrated into chat flow
- No separate clarification UI

**Lovable:**
- Guided wizard for project setup
- Pre-defined question templates
- Design-focused clarification

**Bolt.new:**
- Minimal clarification
- Heavy on auto-assumptions
- Fast but less accurate

## C. Glossary

| Term | Definition |
|------|------------|
| **HITL** | Human-in-the-Loop - pausing automated flow for user input |
| **Ambiguity Score** | 0-100 measure of requirement clarity |
| **ClarifyGPT** | Academic framework for requirement clarification |
| **Vibe Coding** | Natural language to working software paradigm |

---

# Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-03-06 | Ryuichi | Initial complete PRD via BMAD workflow |

---

*Generated by BMAD Workflow: create-prd*  
*Mode: --yolo (autonomous)*  
*All 11 steps completed*
