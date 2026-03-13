import { create } from "zustand";

// ─── sessionStorage persistence helpers ──────────────────────────────────────

const STORAGE_KEY = "atoms_research_state";

interface PersistedResearchState {
  phase: ResearchPhase;
  query: string;
  progress: number;
  progressMessage: string | null;
  progressEvents: ResearchProgressEvent[];
  sections: SectionProgress[];
  streamingReport: string;
  error: string | null;
}

function persistToSession(state: PersistedResearchState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded or private mode — ignore
  }
}

function restoreFromSession(): Partial<PersistedResearchState> | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedResearchState;
    // Only restore if research was in progress or in an error/awaiting state
    if (
      parsed.phase === "researching" ||
      parsed.phase === "error" ||
      parsed.phase === "awaiting_confirmation"
    ) {
      // Downgrade "researching" to "error" since WS is gone after refresh
      if (parsed.phase === "researching") {
        parsed.phase = "error";
        parsed.error = "Page refreshed — research connection lost. Progress preserved.";
      }
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function clearPersistedSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type ResearchPhase =
  | "idle"
  | "connecting"
  | "researching"
  | "completed"
  | "awaiting_confirmation"
  | "error";

export interface ResearchProgressEvent {
  event: string;
  session_id?: string;
  current_section?: string | null;
  current_round?: number | null;
  total_sections?: number | null;
  message?: string | null;
  progress?: number;
  section_index?: number;
  section_title?: string;
  section_status?: string;
  data?: Record<string, unknown>;
}

export interface SectionProgress {
  index: number;
  title: string;
  status: "queued" | "running" | "done" | "error";
  progress: number;
  currentStep: string | null;
  events: ResearchProgressEvent[];
  sources: string[];
}

export interface ResearchResult {
  session_id: string;
  report: string;
  total_sources: number;
  execution_time: number;
  search_engine_used: string;
}

interface ResearchState {
  isResearchMode: boolean;
  phase: ResearchPhase;
  query: string;
  progress: number;
  currentSection: string | null;
  progressMessage: string | null;
  progressEvents: ResearchProgressEvent[];
  sections: SectionProgress[];
  result: ResearchResult | null;
  error: string | null;
  streamingReport: string;

  setResearchMode: (enabled: boolean) => void;
  startResearch: (query: string) => void;
  addProgressEvent: (event: ResearchProgressEvent) => void;
  appendReportChunk: (chunk: string) => void;
  setResult: (result: ResearchResult) => void;
  confirmResearch: () => void;
  setError: (error: string) => void;
  setPhase: (phase: ResearchPhase) => void;
  reset: () => void;
}

function computeGlobalProgress(sections: SectionProgress[]): number {
  if (sections.length === 0) return 0;
  const sum = sections.reduce((acc, s) => acc + s.progress, 0);
  return (sum / sections.length) * 0.9 + 0.05;
}

const restoredState = restoreFromSession();

export const useResearchStore = create<ResearchState>()((set) => ({
  isResearchMode: false,
  phase: restoredState?.phase ?? "idle",
  query: restoredState?.query ?? "",
  progress: restoredState?.progress ?? 0,
  currentSection: null,
  progressMessage: restoredState?.progressMessage ?? null,
  progressEvents: restoredState?.progressEvents ?? [],
  sections: restoredState?.sections ?? [],
  result: null,
  error: restoredState?.error ?? null,
  streamingReport: restoredState?.streamingReport ?? "",

  setResearchMode: (enabled) => set({ isResearchMode: enabled }),

  startResearch: (query) => {
    clearPersistedSession();
    return set({
      phase: "connecting",
      query,
      progress: 0,
      currentSection: null,
      progressMessage: null,
      progressEvents: [],
      sections: [],
      result: null,
      error: null,
      streamingReport: "",
    });
  },

  addProgressEvent: (event) =>
    set((state) => {
      if (event.event === "report_chunk") return {};

      const MAX_EVENTS = 100;
      const globalEvents = [...state.progressEvents, event];

      // Handle structure_ready: initialize section lanes
      if (event.event === "structure_ready" && event.data) {
        const sectionData = (event.data as { sections?: { index: number; title: string }[] }).sections;
        if (sectionData) {
          const sections: SectionProgress[] = sectionData.map((s) => ({
            index: s.index,
            title: s.title,
            status: "queued" as const,
            progress: 0,
            currentStep: null,
            events: [],
            sources: [],
          }));
          const trimmed = globalEvents.length > MAX_EVENTS ? globalEvents.slice(-MAX_EVENTS) : globalEvents;
          const next = {
            phase: "researching" as const,
            sections,
            progressMessage: event.message ?? state.progressMessage,
            progressEvents: trimmed,
          };
          persistToSession({ ...state, ...next });
          return next;
        }
      }

      // Route section-specific events
      if (event.section_index != null) {
        const sections = [...state.sections];
        const idx = event.section_index;

        if (idx >= 0 && idx < sections.length) {
          const sec = { ...sections[idx] };
          sec.events = [...sec.events, event];

          if (event.section_status === "running") sec.status = "running";
          if (event.section_status === "done") {
            sec.status = "done";
            sec.progress = 1;
            const evtSources = (event.data as { sources?: string[] } | undefined)?.sources;
            if (evtSources && evtSources.length > 0) {
              sec.sources = evtSources;
            }
          }
          if (event.section_status === "error") sec.status = "error";

          if (event.progress != null && event.progress > sec.progress && sec.status !== "done") {
            sec.progress = event.progress;
          }

          if (event.message) sec.currentStep = event.message;

          sections[idx] = sec;

          const globalProgress = computeGlobalProgress(sections);
          const trimmed = globalEvents.length > MAX_EVENTS ? globalEvents.slice(-MAX_EVENTS) : globalEvents;

          const next = {
            phase: "researching" as const,
            sections,
            progress: Math.max(globalProgress, state.progress),
            currentSection: event.section_title ?? event.current_section ?? state.currentSection,
            progressMessage: event.message ?? state.progressMessage,
            progressEvents: trimmed,
          };
          persistToSession({ ...state, ...next });
          return next;
        }
      }

      // Global events (started, rewriting, rewrite_complete, generating_report, completed)
      const newProgress =
        event.progress != null && event.progress > state.progress
          ? event.progress
          : state.progress;

      const trimmed = globalEvents.length > MAX_EVENTS ? globalEvents.slice(-MAX_EVENTS) : globalEvents;
      const next = {
        phase: "researching" as const,
        progress: newProgress,
        currentSection: event.current_section ?? state.currentSection,
        progressMessage: event.message ?? state.progressMessage,
        progressEvents: trimmed,
      };
      persistToSession({ ...state, ...next });
      return next;
    }),

  appendReportChunk: (chunk) =>
    set((state) => {
      const next = state.streamingReport + chunk;
      // Persist periodically (every ~2KB of new content)
      if (next.length % 2048 < chunk.length) {
        persistToSession({ ...state, streamingReport: next });
      }
      return { streamingReport: next };
    }),

  setResult: (result) => {
    clearPersistedSession();
    return set({
      phase: "awaiting_confirmation",
      progress: 1,
      result,
      streamingReport: "",
    });
  },

  confirmResearch: () => {
    clearPersistedSession();
    return set({ phase: "completed" });
  },

  setError: (error) =>
    set((state) => {
      persistToSession({ ...state, phase: "error", error });
      return { phase: "error" as const, error };
    }),

  setPhase: (phase) => set({ phase }),

  reset: () => {
    clearPersistedSession();
    return set({
      phase: "idle",
      query: "",
      progress: 0,
      currentSection: null,
      progressMessage: null,
      progressEvents: [],
      sections: [],
      result: null,
      error: null,
      streamingReport: "",
    });
  },
}));
