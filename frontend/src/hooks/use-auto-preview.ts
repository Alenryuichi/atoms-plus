import { useEffect, useRef, useCallback } from "react";
import { useEventStore, type OHEvent } from "#/stores/use-event-store";
import { useConversationStore } from "#/stores/conversation-store";
import { useSelectConversationTab } from "#/hooks/use-select-conversation-tab";
import {
  isActionEvent,
  isConversationStateUpdateEvent,
  isAgentStatusConversationStateUpdateEvent,
} from "#/types/v1/type-guards";
import { AgentState } from "#/types/agent-state";

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

const FILE_WRITE_ACTIONS = [
  "FileEditorAction",
  "StrReplaceEditorAction",
  "FileWriteAction",
];

function isPreviewableFile(path: string | undefined): boolean {
  if (!path) return false;
  const lowerPath = path.toLowerCase();
  return PREVIEWABLE_EXTENSIONS.some((ext) => lowerPath.endsWith(ext));
}

/**
 * Hook to automatically switch to the App (served) tab when the agent
 * completes a task that wrote previewable web files.
 */
export function useAutoPreview() {
  const events = useEventStore((state) => state.events);
  const { selectedTab } = useConversationStore();
  const { navigateToTab } = useSelectConversationTab();

  const hasWrittenPreviewableFiles = useRef(false);
  const lastProcessedIndex = useRef(-1);

  const switchToServed = useCallback(() => {
    if (selectedTab !== "served") {
      navigateToTab("served");
    }
  }, [selectedTab, navigateToTab]);

  useEffect(() => {
    if (events.length === 0) {
      return undefined;
    }

    const startIndex = Math.max(0, lastProcessedIndex.current + 1);
    const newEvents = events.slice(startIndex);

    newEvents.forEach((event: OHEvent, index: number) => {
      lastProcessedIndex.current = startIndex + index;

      if (isActionEvent(event)) {
        const { action } = event;
        if (
          FILE_WRITE_ACTIONS.includes(action.kind) &&
          "path" in action &&
          isPreviewableFile(action.path as string)
        ) {
          hasWrittenPreviewableFiles.current = true;
        }
      }

      if (isConversationStateUpdateEvent(event)) {
        if (isAgentStatusConversationStateUpdateEvent(event)) {
          const agentState = event.value;
          if (
            agentState === AgentState.FINISHED ||
            agentState === AgentState.AWAITING_USER_INPUT
          ) {
            if (hasWrittenPreviewableFiles.current) {
              switchToServed();
              hasWrittenPreviewableFiles.current = false;
            }
          }
        }
      }
    });

    return undefined;
  }, [events, selectedTab, switchToServed]);
}
