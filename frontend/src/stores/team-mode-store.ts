import { create } from "zustand";
import {
  AgentRole,
  AgentThought,
  TeamSessionStatus,
} from "#/api/team-mode-service/team-mode-service.types";

interface TeamModeState {
  // Team Mode enabled state
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  toggleEnabled: () => void;

  // Current session
  sessionId: string | null;
  setSessionId: (id: string | null) => void;

  // Session status
  status: TeamSessionStatus | null;
  setStatus: (status: TeamSessionStatus | null) => void;

  // Current active agent
  currentAgent: AgentRole | null;
  setCurrentAgent: (agent: AgentRole | null) => void;

  // Agent thoughts (streaming)
  thoughts: AgentThought[];
  addThought: (thought: AgentThought) => void;
  clearThoughts: () => void;

  // Work products
  plan: string | null;
  code: string | null;
  review: string | null;
  setWorkProducts: (plan: string, code: string, review: string) => void;

  // Loading state
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;

  // Error state
  error: string | null;
  setError: (error: string | null) => void;

  // WebSocket connection
  ws: WebSocket | null;
  setWs: (ws: WebSocket | null) => void;

  // Reset state
  reset: () => void;
}

const initialState = {
  isEnabled: false,
  sessionId: null,
  status: null,
  currentAgent: null,
  thoughts: [] as AgentThought[],
  plan: null,
  code: null,
  review: null,
  isRunning: false,
  error: null,
  ws: null,
};

export const useTeamModeStore = create<TeamModeState>((set, get) => ({
  ...initialState,

  setEnabled: (enabled) => set({ isEnabled: enabled }),
  toggleEnabled: () => set((state) => ({ isEnabled: !state.isEnabled })),

  setSessionId: (id) => set({ sessionId: id }),

  setStatus: (status) => set({ status }),

  setCurrentAgent: (agent) => set({ currentAgent: agent }),

  addThought: (thought) =>
    set((state) => ({
      thoughts: [...state.thoughts, thought],
      currentAgent: thought.role,
    })),

  clearThoughts: () => set({ thoughts: [] }),

  setWorkProducts: (plan, code, review) => set({ plan, code, review }),

  setIsRunning: (running) => set({ isRunning: running }),

  setError: (error) => set({ error }),

  setWs: (ws) => {
    // Close existing connection if any
    const currentWs = get().ws;
    if (currentWs && currentWs.readyState === WebSocket.OPEN) {
      currentWs.close();
    }
    set({ ws });
  },

  reset: () => {
    const currentWs = get().ws;
    if (currentWs && currentWs.readyState === WebSocket.OPEN) {
      currentWs.close();
    }
    set(initialState);
  },
}));
