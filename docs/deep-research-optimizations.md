# Deep Research Optimizations

Tracking document for incremental improvements to the Deep Research pipeline.
Created: 2026-03-12

## High Priority

### 1. Markdown Incremental Rendering
- **Problem**: Every 150ms flush re-renders the entire `streamingReport` via `MarkdownRenderer`. At 20k+ chars, parsing + rendering full Markdown every cycle causes jank.
- **Solution**: During streaming, render only as plain `<pre>` text. On completion (`result` event), switch to full `MarkdownRenderer`.
- **Files**: `frontend/src/routes/research-tab.tsx`
- **Status**: DONE

### 2. WebSocket Heartbeat
- **Problem**: During non-streaming Stage 2 parallel section generation, there can be 30-60s gaps with no data over WebSocket, risking idle timeout.
- **Solution**: Backend sends `{"event":"ping"}` every 15s during research. Frontend ignores it for state but it keeps the connection alive.
- **Files**: `atoms_plus/deep_research/api.py`, `frontend/src/hooks/use-research-websocket.ts`
- **Status**: DONE

### 3. Research State Persistence (sessionStorage)
- **Problem**: Browser refresh or Vite HMR wipes Zustand state, losing 3+ minutes of research progress.
- **Solution**: On each significant state change, serialize key fields to `sessionStorage`. On mount, check for saved state and restore. Researching phase downgrades to "error" after refresh since WS is gone.
- **Files**: `frontend/src/stores/research-store.ts`
- **Status**: DONE

## Medium Priority

### 4. React.memo on SectionLane
- **Problem**: When any section updates, all `SectionLane` components re-render because the parent `ResearchDashboard` re-renders.
- **Solution**: Wrap `SectionLane` with `React.memo` and ensure stable prop references.
- **Files**: `frontend/src/routes/research-tab.tsx`
- **Status**: DONE

### 5. Report TOC Navigation
- **Problem**: Long reports (5-7 sections) require manual scrolling to find content.
- **Solution**: Parse H2/H3 headings from the report, render a sticky TOC bar at the top of the preview panel with anchor links. Added `id` attributes to heading components. IntersectionObserver highlights active section.
- **Files**: `frontend/src/routes/research-tab.tsx`, `frontend/src/components/features/markdown/headings.tsx`
- **Status**: DONE

### 6. Search Source Preview per Section
- **Problem**: Source URLs only appear at the end of the final report; user can't verify sources during research.
- **Solution**: Backend sends source URLs in `section_completed` events via `data.sources`. Frontend shows expandable URL list in each SectionLane with external link icons.
- **Files**: `atoms_plus/deep_research/research.py`, `frontend/src/routes/research-tab.tsx`, `frontend/src/stores/research-store.ts`
- **Status**: DONE

### 7. Per-Section Retry
- **Problem**: If one section fails, user must restart entire research.
- **Solution**: Deferred — requires backend to maintain session state across requests. Current architecture uses a single WebSocket session per research. Will revisit when backend supports persistent research sessions.
- **Status**: DEFERRED

## Low Priority

### 8. Adaptive Chunk Buffer Interval
- **Problem**: Fixed 150ms buffer may be too slow when chunks arrive infrequently or too fast under high throughput.
- **Solution**: Track inter-chunk timing. If avg gap < 50ms, extend to max 400ms. If > 200ms, reduce to min 80ms. Resets on new connection.
- **Files**: `frontend/src/hooks/use-research-websocket.ts`
- **Status**: DONE

### 9. Report Export
- **Problem**: No way to download the research report.
- **Solution**: Added "Download as .md" button in the report toolbar. Uses Blob URL for client-side download with timestamped filename.
- **Files**: `frontend/src/routes/research-tab.tsx`
- **Status**: DONE

### 10. Research History
- **Problem**: Research reports are lost once the conversation ends.
- **Solution**: Deferred — requires backend database schema changes and a new API endpoint. Will implement alongside conversation persistence improvements.
- **Status**: DEFERRED

### 11. True LLM Call Cancellation
- **Problem**: Cancelling research closes WebSocket but in-flight `litellm.acompletion` calls continue, wasting API quota.
- **Solution**: Research runs as an explicit `asyncio.Task`. On WebSocket disconnect, `task.cancel()` is called, propagating `CancelledError` through the call stack and aborting in-flight LLM calls.
- **Files**: `atoms_plus/deep_research/api.py`
- **Status**: DONE
