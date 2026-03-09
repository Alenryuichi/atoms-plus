import { useEffect, useRef, useCallback } from "react";
import { useEventStore, type OHEvent } from "#/stores/use-event-store";
import { useConversationStore } from "#/stores/conversation-store";
import { useSelectConversationTab } from "#/hooks/use-select-conversation-tab";
import { getPreviewPanelRef } from "#/routes/preview-tab";
import {
  isActionEvent,
  isConversationStateUpdateEvent,
  isAgentStatusConversationStateUpdateEvent,
} from "#/types/v1/type-guards";
import { AgentState } from "#/types/agent-state";

// File extensions that indicate previewable web content
const PREVIEWABLE_EXTENSIONS = [
  ".tsx",
  ".jsx",
  ".ts",
  ".js",
  ".html",
  ".htm",
  ".css",
  ".vue",
  ".svelte",
];

// Action kinds that indicate file write operations
const FILE_WRITE_ACTIONS = [
  "FileEditorAction",
  "StrReplaceEditorAction",
  "FileWriteAction",
];

/**
 * Check if a file path is previewable (web content)
 */
function isPreviewableFile(path: string | undefined): boolean {
  if (!path) return false;
  const lowerPath = path.toLowerCase();
  return PREVIEWABLE_EXTENSIONS.some((ext) => lowerPath.endsWith(ext));
}

/**
 * Hook to automatically switch to Preview tab when agent completes
 * and refresh preview when files are written.
 *
 * Features:
 * 1. Auto-switch to Preview tab when agent finishes with previewable files
 * 2. Auto-refresh Preview panel when files are written
 * 3. Debounced refresh to avoid excessive updates
 */
export function useAutoPreview() {
  const events = useEventStore((state) => state.events);
  const { selectedTab } = useConversationStore();
  const { navigateToTab } = useSelectConversationTab();

  // Track if we've written previewable files in this session
  const hasWrittenPreviewableFiles = useRef(false);
  // Debounce timer for refresh
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Last processed event index to avoid re-processing
  const lastProcessedIndex = useRef(-1);

  /**
   * Refresh the preview panel with debouncing
   */
  const refreshPreview = useCallback(() => {
    // Clear existing timer
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
    }

    // Debounce refresh by 500ms to batch multiple file writes
    refreshTimer.current = setTimeout(() => {
      const previewRef = getPreviewPanelRef();
      if (previewRef) {
        previewRef.refresh();
      }
    }, 500);
  }, []);

  /**
   * Switch to preview tab
   */
  const switchToPreview = useCallback(() => {
    if (selectedTab !== "preview") {
      navigateToTab("preview");
    }
  }, [selectedTab, navigateToTab]);

  useEffect(() => {
    if (events.length === 0) {
      return undefined;
    }

    // Process only new events
    const startIndex = Math.max(0, lastProcessedIndex.current + 1);
    const newEvents = events.slice(startIndex);

    newEvents.forEach((event: OHEvent, index: number) => {
      // Update last processed index
      lastProcessedIndex.current = startIndex + index;

      // Check for file write actions
      if (isActionEvent(event)) {
        const { action } = event;
        if (
          FILE_WRITE_ACTIONS.includes(action.kind) &&
          "path" in action &&
          isPreviewableFile(action.path as string)
        ) {
          hasWrittenPreviewableFiles.current = true;
          // Auto-refresh preview when on preview tab
          if (selectedTab === "preview") {
            refreshPreview();
          }
        }
      }

      // Check for agent completion
      if (isConversationStateUpdateEvent(event)) {
        if (isAgentStatusConversationStateUpdateEvent(event)) {
          const agentState = event.value;
          if (
            agentState === AgentState.FINISHED ||
            agentState === AgentState.AWAITING_USER_INPUT
          ) {
            // Agent completed - switch to preview if we wrote previewable files
            if (hasWrittenPreviewableFiles.current) {
              switchToPreview();
              refreshPreview();
              // Reset for next task
              hasWrittenPreviewableFiles.current = false;
            }
          }
        }
      }
    });

    // Cleanup timer on unmount
    return () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }
    };
  }, [events, selectedTab, refreshPreview, switchToPreview]);

  return {
    refreshPreview,
    switchToPreview,
  };
}
