import { useCallback } from "react";
import {
  useResearchStore,
  type ResearchProgressEvent,
  type ResearchResult,
} from "#/stores/research-store";

let globalWs: WebSocket | null = null;
let globalIntentionalClose = false;
let globalPendingQuery: string | null = null;

let chunkBuffer = "";
let chunkFlushTimer: ReturnType<typeof setTimeout> | null = null;
let lastChunkTime = 0;
let chunkIntervalMs = 150;
const MIN_FLUSH_INTERVAL = 80;
const MAX_FLUSH_INTERVAL = 400;

function flushChunkBuffer() {
  if (chunkBuffer) {
    useResearchStore.getState().appendReportChunk(chunkBuffer);
    chunkBuffer = "";
  }
  chunkFlushTimer = null;
}

function bufferReportChunk(chunk: string) {
  const now = Date.now();
  if (lastChunkTime > 0) {
    const gap = now - lastChunkTime;
    // Adapt: fast chunks → longer flush interval; slow chunks → shorter
    if (gap < 50) {
      chunkIntervalMs = Math.min(chunkIntervalMs + 30, MAX_FLUSH_INTERVAL);
    } else if (gap > 200) {
      chunkIntervalMs = Math.max(chunkIntervalMs - 30, MIN_FLUSH_INTERVAL);
    }
  }
  lastChunkTime = now;

  chunkBuffer += chunk;
  if (!chunkFlushTimer) {
    chunkFlushTimer = setTimeout(flushChunkBuffer, chunkIntervalMs);
  }
}

function getResearchWsUrl(): string {
  const host =
    import.meta.env.VITE_BACKEND_BASE_URL || window.location.host;
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${host}/api/v1/research/stream`;
}

export function useResearchWebSocket() {
  const {
    startResearch,
    addProgressEvent,
    setResult,
    setError,
    setPhase,
  } = useResearchStore();

  const connectInternal = useCallback(
    (query: string) => {
      if (globalWs) {
        globalIntentionalClose = true;
        globalWs.close();
      }

      globalIntentionalClose = false;
      globalPendingQuery = query;
      chunkBuffer = "";
      lastChunkTime = 0;
      chunkIntervalMs = 150;
      if (chunkFlushTimer) {
        clearTimeout(chunkFlushTimer);
        chunkFlushTimer = null;
      }
      const ws = new WebSocket(getResearchWsUrl());
      globalWs = ws;

      ws.onopen = () => {
        setPhase("researching");
        ws.send(
          JSON.stringify({
            query,
            max_rounds: 2,
            search_engine: "auto",
            language: "auto",
          }),
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.event === "ping") {
            return; // heartbeat — ignore
          }

          if (data.event === "result") {
            flushChunkBuffer();
            const result: ResearchResult = {
              session_id: data.session_id,
              report: data.report,
              total_sources: data.total_sources,
              execution_time: data.execution_time,
              search_engine_used: data.search_engine_used,
            };
            useResearchStore.getState().setResult(result);
          } else if (data.event === "report_chunk") {
            const chunk = data.data?.chunk;
            if (typeof chunk === "string") {
              bufferReportChunk(chunk);
            }
          } else if (data.event === "error") {
            useResearchStore.getState().setError(data.message || "Research failed");
          } else {
            const progress: ResearchProgressEvent = {
              event: data.event,
              session_id: data.session_id,
              current_section: data.current_section,
              current_round: data.current_round,
              total_sections: data.total_sections,
              message: data.message,
              progress: data.progress,
              section_index: data.section_index,
              section_title: data.section_title,
              section_status: data.section_status,
              data: data.data,
            };
            useResearchStore.getState().addProgressEvent(progress);
          }
        } catch {
          // ignore JSON parse errors for malformed frames
        }
      };

      ws.onerror = () => {
        // onerror is always followed by onclose; reconnect logic lives there
      };

      ws.onclose = (ev) => {
        globalWs = null;
        flushChunkBuffer();

        if (globalIntentionalClose) return;

        const { phase } = useResearchStore.getState();
        if (phase === "completed" || phase === "awaiting_confirmation" || phase === "error" || phase === "idle") {
          return;
        }

        // Don't attempt reconnect -- it would restart research from scratch
        // and wipe the accumulated progress data. Instead, just log the error
        // while keeping all collected state (sections, events, progress) intact.
        useResearchStore.getState().setError("Connection lost. Please try again.");
      };
    },
    [setPhase],
  );

  const connect = useCallback(
    (query: string) => {
      startResearch(query);
      connectInternal(query);
    },
    [startResearch, connectInternal],
  );

  const disconnect = useCallback(() => {
    globalIntentionalClose = true;
    globalPendingQuery = null;
    chunkBuffer = "";
    lastChunkTime = 0;
    chunkIntervalMs = 150;
    if (chunkFlushTimer) {
      clearTimeout(chunkFlushTimer);
      chunkFlushTimer = null;
    }
    if (globalWs) {
      globalWs.close();
      globalWs = null;
    }
  }, []);

  return { connect, disconnect };
}
