import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  getConversationState,
  setConversationState,
} from "#/utils/conversation-local-storage";

// Check if running in mock mode - default to preview tab for testing
const isMockMode = import.meta.env.VITE_MOCK_API === "true";

export type ConversationTab =
  | "editor"
  | "browser"
  | "served"
  | "vscode"
  | "terminal"
  | "planner"
  | "preview";

export type ConversationMode = "code" | "plan";

export type PreviewViewMode = "split" | "editor" | "preview";

// Panel width constants
const PANEL_WIDTH_STORAGE_KEY = "desktop-layout-panel-width";
const DEFAULT_PANEL_LEFT_WIDTH = 50;
const MIN_PANEL_LEFT_WIDTH = 30;
const MAX_PANEL_LEFT_WIDTH = 80;

export interface IMessageToSend {
  text: string;
  timestamp: number;
}

interface ConversationState {
  isRightPanelShown: boolean;
  selectedTab: ConversationTab | null;
  images: File[];
  files: File[];
  loadingFiles: string[]; // File names currently being processed
  loadingImages: string[]; // Image names currently being processed
  messageToSend: IMessageToSend | null;
  shouldShownAgentLoading: boolean;
  submittedMessage: string | null;
  shouldHideSuggestions: boolean; // New state to hide suggestions when input expands
  hasRightPanelToggled: boolean;
  planContent: string | null;
  conversationMode: ConversationMode;
  subConversationTaskId: string | null; // Task ID for sub-conversation creation
  previewViewMode: PreviewViewMode; // Preview panel view mode (split/editor/preview)
  // Panel width state - shared between TopNavbar and ConversationMain
  panelLeftWidth: number; // Left panel width as percentage (30-80)
  panelIsDragging: boolean; // Whether user is currently dragging the resize handle
}

interface ConversationActions {
  setIsRightPanelShown: (isRightPanelShown: boolean) => void;
  setSelectedTab: (selectedTab: ConversationTab | null) => void;
  setShouldShownAgentLoading: (shouldShownAgentLoading: boolean) => void;
  setShouldHideSuggestions: (shouldHideSuggestions: boolean) => void;
  addImages: (images: File[]) => void;
  addFiles: (files: File[]) => void;
  removeImage: (index: number) => void;
  removeFile: (index: number) => void;
  clearImages: () => void;
  clearFiles: () => void;
  clearAllFiles: () => void;
  addFileLoading: (fileName: string) => void;
  removeFileLoading: (fileName: string) => void;
  addImageLoading: (imageName: string) => void;
  removeImageLoading: (imageName: string) => void;
  clearAllLoading: () => void;
  setMessageToSend: (text: string) => void;
  setSubmittedMessage: (message: string | null) => void;
  resetConversationState: () => void;
  setHasRightPanelToggled: (hasRightPanelToggled: boolean) => void;
  setConversationMode: (conversationMode: ConversationMode) => void;
  setSubConversationTaskId: (taskId: string | null) => void;
  setPlanContent: (planContent: string | null) => void;
  setPreviewViewMode: (previewViewMode: PreviewViewMode) => void;
  // Panel width actions
  setPanelLeftWidth: (width: number) => void;
  setPanelIsDragging: (isDragging: boolean) => void;
  persistPanelWidth: () => void; // Save to localStorage when drag ends
}

type ConversationStore = ConversationState & ConversationActions;

const getConversationIdFromLocation = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const match = window.location.pathname.match(/\/conversations\/([^/]+)/);
  return match ? match[1] : null;
};

const parseStoredBoolean = (value: string | null): boolean | null => {
  if (value === null) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const getInitialRightPanelState = (): boolean => {
  if (typeof window === "undefined") {
    return true;
  }

  const conversationId = getConversationIdFromLocation();
  const keysToCheck = conversationId
    ? [`conversation-right-panel-shown-${conversationId}`]
    : [];

  // Fallback to legacy global key for users who haven't switched tabs yet
  keysToCheck.push("conversation-right-panel-shown");

  for (const key of keysToCheck) {
    const parsed = parseStoredBoolean(localStorage.getItem(key));
    if (parsed !== null) {
      return parsed;
    }
  }

  return true;
};

const getInitialConversationMode = (): ConversationMode => {
  if (typeof window === "undefined") {
    return "code";
  }

  const conversationId = getConversationIdFromLocation();
  if (!conversationId) {
    return "code";
  }

  const state = getConversationState(conversationId);
  return state.conversationMode;
};

const getInitialPanelWidth = (): number => {
  if (typeof window === "undefined") {
    return DEFAULT_PANEL_LEFT_WIDTH;
  }

  const stored = localStorage.getItem(PANEL_WIDTH_STORAGE_KEY);
  if (stored) {
    const parsed = parseFloat(stored);
    if (!Number.isNaN(parsed)) {
      return Math.max(
        MIN_PANEL_LEFT_WIDTH,
        Math.min(MAX_PANEL_LEFT_WIDTH, parsed),
      );
    }
  }
  return DEFAULT_PANEL_LEFT_WIDTH;
};

export const useConversationStore = create<ConversationStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      isRightPanelShown: getInitialRightPanelState(),
      // In mock mode, default to "preview" tab for testing the Preview panel
      selectedTab: (isMockMode ? "preview" : "editor") as ConversationTab,
      images: [],
      files: [],
      loadingFiles: [],
      loadingImages: [],
      messageToSend: null,
      shouldShownAgentLoading: false,
      submittedMessage: null,
      shouldHideSuggestions: false,
      hasRightPanelToggled: true,
      planContent: null,
      conversationMode: getInitialConversationMode(),
      subConversationTaskId: null,
      previewViewMode: "preview" as PreviewViewMode, // Default to preview mode
      // Panel width state - synced between TopNavbar and ConversationMain
      panelLeftWidth: getInitialPanelWidth(),
      panelIsDragging: false,

      // Actions
      setIsRightPanelShown: (isRightPanelShown) =>
        set({ isRightPanelShown }, false, "setIsRightPanelShown"),

      setSelectedTab: (selectedTab) =>
        set({ selectedTab }, false, "setSelectedTab"),

      setShouldShownAgentLoading: (shouldShownAgentLoading) =>
        set({ shouldShownAgentLoading }, false, "setShouldShownAgentLoading"),

      setShouldHideSuggestions: (shouldHideSuggestions) =>
        set({ shouldHideSuggestions }, false, "setShouldHideSuggestions"),

      addImages: (images) =>
        set(
          (state) => ({ images: [...state.images, ...images] }),
          false,
          "addImages",
        ),

      addFiles: (files) =>
        set(
          (state) => ({ files: [...state.files, ...files] }),
          false,
          "addFiles",
        ),

      removeImage: (index) =>
        set(
          (state) => {
            const newImages = [...state.images];
            newImages.splice(index, 1);
            return { images: newImages };
          },
          false,
          "removeImage",
        ),

      removeFile: (index) =>
        set(
          (state) => {
            const newFiles = [...state.files];
            newFiles.splice(index, 1);
            return { files: newFiles };
          },
          false,
          "removeFile",
        ),

      clearImages: () => set({ images: [] }, false, "clearImages"),

      clearFiles: () => set({ files: [] }, false, "clearFiles"),

      clearAllFiles: () =>
        set(
          {
            images: [],
            files: [],
            loadingFiles: [],
            loadingImages: [],
          },
          false,
          "clearAllFiles",
        ),

      addFileLoading: (fileName) =>
        set(
          (state) => {
            if (!state.loadingFiles.includes(fileName)) {
              return { loadingFiles: [...state.loadingFiles, fileName] };
            }
            return state;
          },
          false,
          "addFileLoading",
        ),

      removeFileLoading: (fileName) =>
        set(
          (state) => ({
            loadingFiles: state.loadingFiles.filter(
              (name) => name !== fileName,
            ),
          }),
          false,
          "removeFileLoading",
        ),

      addImageLoading: (imageName) =>
        set(
          (state) => {
            if (!state.loadingImages.includes(imageName)) {
              return { loadingImages: [...state.loadingImages, imageName] };
            }
            return state;
          },
          false,
          "addImageLoading",
        ),

      removeImageLoading: (imageName) =>
        set(
          (state) => ({
            loadingImages: state.loadingImages.filter(
              (name) => name !== imageName,
            ),
          }),
          false,
          "removeImageLoading",
        ),

      clearAllLoading: () =>
        set({ loadingFiles: [], loadingImages: [] }, false, "clearAllLoading"),

      setMessageToSend: (text) =>
        set(
          {
            messageToSend: {
              text,
              timestamp: Date.now(),
            },
          },
          false,
          "setMessageToSend",
        ),

      setSubmittedMessage: (submittedMessage) =>
        set({ submittedMessage }, false, "setSubmittedMessage"),

      resetConversationState: () =>
        set(
          {
            shouldHideSuggestions: false,
            conversationMode: getInitialConversationMode(),
            subConversationTaskId: null,
            planContent: null,
          },
          false,
          "resetConversationState",
        ),

      setHasRightPanelToggled: (hasRightPanelToggled) =>
        set({ hasRightPanelToggled }, false, "setHasRightPanelToggled"),

      setConversationMode: (conversationMode) => {
        const conversationId = getConversationIdFromLocation();
        if (conversationId) {
          setConversationState(conversationId, { conversationMode });
        }
        set({ conversationMode }, false, "setConversationMode");
      },

      setSubConversationTaskId: (subConversationTaskId) =>
        set({ subConversationTaskId }, false, "setSubConversationTaskId"),

      setPlanContent: (planContent) =>
        set({ planContent }, false, "setPlanContent"),

      setPreviewViewMode: (previewViewMode) =>
        set({ previewViewMode }, false, "setPreviewViewMode"),

      // Panel width actions - for synchronized resizable panels
      setPanelLeftWidth: (width) => {
        const clamped = Math.max(
          MIN_PANEL_LEFT_WIDTH,
          Math.min(MAX_PANEL_LEFT_WIDTH, width),
        );
        set({ panelLeftWidth: clamped }, false, "setPanelLeftWidth");
      },

      setPanelIsDragging: (isDragging) =>
        set({ panelIsDragging: isDragging }, false, "setPanelIsDragging"),

      persistPanelWidth: () => {
        const { panelLeftWidth } = get();
        if (typeof window !== "undefined") {
          localStorage.setItem(
            PANEL_WIDTH_STORAGE_KEY,
            JSON.stringify(panelLeftWidth),
          );
        }
      },
    }),
    {
      name: "conversation-store",
    },
  ),
);
