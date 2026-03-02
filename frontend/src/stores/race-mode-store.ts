import { create } from "zustand";
import {
  RaceSessionResponse,
  RaceResult,
} from "#/api/race-mode-service/race-mode-service.types";

interface RaceModeState {
  // Race Mode enabled state
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  toggleEnabled: () => void;

  // Selected models for racing
  selectedModels: string[];
  setSelectedModels: (models: string[]) => void;
  toggleModel: (model: string) => void;

  // Current race session
  currentSession: RaceSessionResponse | null;
  setCurrentSession: (session: RaceSessionResponse | null) => void;

  // Loading state
  isRacing: boolean;
  setIsRacing: (racing: boolean) => void;

  // Selected winner
  selectedWinner: string | null;
  setSelectedWinner: (winner: string | null) => void;

  // Get result by model name
  getResultByModel: (modelName: string) => RaceResult | undefined;

  // Reset race state
  resetRace: () => void;
}

export const useRaceModeStore = create<RaceModeState>((set, get) => ({
  isEnabled: false,
  setEnabled: (enabled) => set({ isEnabled: enabled }),
  toggleEnabled: () => set((state) => ({ isEnabled: !state.isEnabled })),

  selectedModels: [],
  setSelectedModels: (models) => set({ selectedModels: models }),
  toggleModel: (model) =>
    set((state) => {
      const models = state.selectedModels.includes(model)
        ? state.selectedModels.filter((m) => m !== model)
        : [...state.selectedModels, model];
      return { selectedModels: models };
    }),

  currentSession: null,
  setCurrentSession: (session) => set({ currentSession: session }),

  isRacing: false,
  setIsRacing: (racing) => set({ isRacing: racing }),

  selectedWinner: null,
  setSelectedWinner: (winner) => set({ selectedWinner: winner }),

  getResultByModel: (modelName) => {
    const session = get().currentSession;
    if (!session) return undefined;
    return session.results.find((r) => r.model_name === modelName);
  },

  resetRace: () =>
    set({
      currentSession: null,
      isRacing: false,
      selectedWinner: null,
    }),
}));
