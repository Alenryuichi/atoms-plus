import { OpenHandsEvent } from "#/types/v1/core";
import { EventMessage } from "./event-message";
import { ChatMessage } from "../../features/chat/chat-message";
import { useOptimisticUserMessageStore } from "#/stores/optimistic-user-message-store";
import { usePlanPreviewEvents } from "./hooks/use-plan-preview-events";
// TODO: Implement microagent functionality for V1 when APIs support V1 event IDs
// import { AgentState } from "#/types/agent-state";
// import MemoryIcon from "#/icons/memory_icon.svg?react";

interface MessagesProps {
  messages: OpenHandsEvent[]; // UI events (actions replaced by observations)
  allEvents: OpenHandsEvent[]; // Full event history (for action lookup)
}

/**
 * Messages component for V1 events.
 *
 * NOTE: We intentionally don't use React.memo with a custom comparison function here.
 * The previous implementation only compared messages.length, which caused bugs:
 * - optimisticUserMessage changes (from Zustand store) were ignored
 * - The initial prompt would not display until the first event arrived
 *
 * React.memo's default shallow comparison is sufficient for our needs:
 * - messages and allEvents arrays maintain referential stability via useMemo in useFilteredEvents
 * - Store-based state (optimisticUserMessage) needs to trigger re-renders when it changes
 */
export function Messages({ messages, allEvents }: MessagesProps) {
  // Use Zustand selector pattern for optimistic message to ensure re-renders
  const optimisticUserMessage = useOptimisticUserMessageStore(
    (state) => state.optimisticUserMessage,
  );

  // Get the set of event IDs that should render PlanPreview
  // This ensures only one preview per user message "phase"
  const planPreviewEventIds = usePlanPreviewEvents(allEvents);

  // TODO: Implement microagent functionality for V1 if needed
  // For now, we'll skip microagent features

  return (
    <>
      {/* Show optimistic user message first (appears at top while waiting for events) */}
      {optimisticUserMessage && (
        <ChatMessage type="user" message={optimisticUserMessage} />
      )}

      {messages.map((message, index) => (
        <EventMessage
          key={message.id}
          event={message}
          messages={allEvents}
          isLastMessage={messages.length - 1 === index}
          isInLast10Actions={messages.length - 1 - index < 10}
          planPreviewEventIds={planPreviewEventIds}
          // Microagent props - not implemented yet for V1
          // microagentStatus={undefined}
          // microagentConversationId={undefined}
          // microagentPRUrl={undefined}
          // actions={undefined}
        />
      ))}
    </>
  );
}

Messages.displayName = "Messages";
