import React from "react";
import { usePostHog } from "posthog-js/react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { convertImageToBase64 } from "#/utils/convert-image-to-base-64";
import { TrajectoryActions } from "../trajectory/trajectory-actions";
import { createChatMessage } from "#/services/chat-service";
import { InteractiveChatBox } from "./interactive-chat-box";
import { AgentState } from "#/types/agent-state";
import { useFilteredEvents } from "#/hooks/use-filtered-events";
import { FeedbackModal } from "../feedback/feedback-modal";
import { useScrollToBottom } from "#/hooks/use-scroll-to-bottom";
import { TypingIndicator } from "./typing-indicator";
import { useWsClient } from "#/context/ws-client-provider";
import { Messages as V0Messages } from "./messages";
import { ScrollProvider } from "#/context/scroll-context";
import { useInitialQueryStore } from "#/stores/initial-query-store";
import { useSendMessage } from "#/hooks/use-send-message";
import { useAgentState } from "#/hooks/use-agent-state";
import { useHandleBuildPlanClick } from "#/hooks/use-handle-build-plan-click";

import { ScrollToBottomButton } from "#/components/shared/buttons/scroll-to-bottom-button";
import { ChatMessagesSkeleton } from "./chat-messages-skeleton";
import { displayErrorToast } from "#/utils/custom-toast-handlers";
import { useErrorMessageStore } from "#/stores/error-message-store";
import { useOptimisticUserMessageStore } from "#/stores/optimistic-user-message-store";
import { ErrorMessageBanner } from "./error-message-banner";
import { Messages as V1Messages } from "#/components/v1/chat";
import { useUnifiedUploadFiles } from "#/hooks/mutation/use-unified-upload-files";
import { useConfig } from "#/hooks/query/use-config";
import { validateFiles } from "#/utils/file-validation";
import { useConversationStore } from "#/stores/conversation-store";
import ConfirmationModeEnabled from "./confirmation-mode-enabled";
import { useActiveConversation } from "#/hooks/query/use-active-conversation";
import { useTaskPolling } from "#/hooks/query/use-task-polling";
import { useConversationWebSocket } from "#/contexts/conversation-websocket-context";
import ChatStatusIndicator from "./chat-status-indicator";
import { getStatusColor, getStatusText } from "#/utils/utils";
import { AutoRoleIndicator } from "#/components/features/auto-role";
import { RuntimeBootstrapProgress } from "./runtime-bootstrap-progress";
import type { RuntimeStatus } from "#/types/runtime-status";
import {
  TeamModeToggle,
  TeamModeThoughts,
  useTeamModeWebSocket,
} from "#/components/features/team-mode";
import {
  ClarificationPanel,
  type UserAnswer,
} from "#/components/features/team-mode/clarification";
import { useTeamModeStore } from "#/stores/team-mode-store";
import { useCreateTeamSession } from "#/hooks/mutation/use-create-team-session";
import { AGENT_DISPLAY_INFO } from "#/api/team-mode-service/team-mode-service.types";

function getEntryPoint(
  hasRepository: boolean | null,
  hasReplayJson: boolean | null,
): string {
  if (hasRepository) return "github";
  if (hasReplayJson) return "replay";
  return "direct";
}

export function ChatInterface() {
  const posthog = usePostHog();
  const { setMessageToSend } = useConversationStore();
  const { data: conversation } = useActiveConversation();
  const { errorMessage, removeErrorMessage } = useErrorMessageStore();
  const { isLoadingMessages } = useWsClient();
  const { isTask, taskStatus, taskDetail } = useTaskPolling();
  const conversationWebSocket = useConversationWebSocket();
  const { send } = useSendMessage();
  const {
    v0Events,
    v1UiEvents,
    v1FullEvents,
    totalEvents,
    v0UserEventsExist,
    v1UserEventsExist,
    userEventsExist,
  } = useFilteredEvents();
  const { setOptimisticUserMessage, getOptimisticUserMessage } =
    useOptimisticUserMessageStore();
  const { t } = useTranslation();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const {
    scrollDomToBottom,
    onChatBodyScroll,
    hitBottom,
    autoScroll,
    setAutoScroll,
    setHitBottom,
  } = useScrollToBottom(scrollRef);
  const { data: config } = useConfig();

  const { curAgentState } = useAgentState();
  const { handleBuildPlanClick } = useHandleBuildPlanClick();

  // Team Mode integration
  // Use individual selectors to prevent re-renders when unrelated state changes
  const isTeamModeEnabled = useTeamModeStore((state) => state.isEnabled);
  const isTeamModeRunning = useTeamModeStore((state) => state.isRunning);
  const teamModeCurrentAgent = useTeamModeStore((state) => state.currentAgent);
  const teamModeError = useTeamModeStore((state) => state.error);
  const setTeamModeError = useTeamModeStore((state) => state.setError);
  const createTeamSession = useCreateTeamSession();

  // Initialize Team Mode WebSocket connection when session exists
  // This hook auto-connects when sessionId changes in the store
  const { sendClarificationAnswer } = useTeamModeWebSocket();

  // Handle clarification submission from HITL panel
  const handleClarificationSubmit = React.useCallback(
    (answers: UserAnswer[], skipped: boolean) => {
      sendClarificationAnswer(answers, skipped);
    },
    [sendClarificationAnswer],
  );

  // Show Team Mode errors as toast
  React.useEffect(() => {
    if (teamModeError) {
      displayErrorToast(`Team Mode: ${teamModeError}`);
      setTeamModeError(null); // Clear after showing
    }
  }, [teamModeError, setTeamModeError]);

  // Disable Build button while agent is running (streaming)
  const isAgentRunning =
    curAgentState === AgentState.RUNNING ||
    curAgentState === AgentState.LOADING;

  // Global keyboard shortcut for Build button (Cmd+Enter / Ctrl+Enter)
  // This is placed here instead of PlanPreview to avoid duplicate listeners
  // when multiple PlanPreview components exist in the chat
  React.useEffect(() => {
    if (isAgentRunning) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        handleBuildPlanClick(event);
        scrollDomToBottom();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAgentRunning, handleBuildPlanClick, scrollDomToBottom]);

  const [feedbackPolarity, setFeedbackPolarity] = React.useState<
    "positive" | "negative"
  >("positive");
  const [feedbackModalIsOpen, setFeedbackModalIsOpen] = React.useState(false);
  const { selectedRepository, replayJson, initialPrompt, clearInitialPrompt } =
    useInitialQueryStore();
  const params = useParams();
  const { mutateAsync: uploadFiles } = useUnifiedUploadFiles();

  // Team Mode: Handle initial query from home page
  // When user submits a query from AtomsHome with Team Mode enabled,
  // the query is stored in initialQueryStore instead of being sent via conversation creation.
  // This effect triggers the Team Mode API once the conversation is ready.
  //
  // IMPORTANT: For V1 conversations, the URL initially contains a "task-{uuid}" format
  // which is a start task ID, NOT the conversation ID. We must wait for the task to
  // complete and the URL to be updated to the actual conversation ID before calling
  // the Team Mode API, otherwise we get "Conversation not found" errors.
  const hasTriggeredInitialQuery = React.useRef(false);
  React.useEffect(() => {
    // Skip if no initial prompt or no conversation ID yet
    if (!initialPrompt || !params.conversationId || !isTeamModeEnabled) {
      return;
    }

    // CRITICAL: Skip if this is a task ID (format: "task-{uuid}")
    // The task polling hook (useTaskPolling) will navigate to the real conversation ID
    // once the task is READY. Wait for that navigation before triggering Team Mode.
    if (isTask) {
      return;
    }

    // Skip if already triggered (prevent double execution)
    if (hasTriggeredInitialQuery.current) {
      return;
    }
    hasTriggeredInitialQuery.current = true;

    // At this point, params.conversationId is the real conversation ID (not task-{uuid})
    // For V0, it might be a hex string or UUID; for V1 after navigation, it's the app_conversation_id
    const { conversationId } = params;

    // Trigger Team Mode with the stored query
    posthog.capture("team_mode_session_started", {
      query_character_length: initialPrompt.length,
      conversation_id: conversationId,
      source: "initial_prompt",
    });

    createTeamSession.mutate({
      task: initialPrompt,
      conversationId,
    });

    setOptimisticUserMessage(initialPrompt);
    clearInitialPrompt();
  }, [
    initialPrompt,
    params.conversationId,
    isTeamModeEnabled,
    isTask, // Add isTask to dependencies
    createTeamSession,
    setOptimisticUserMessage,
    clearInitialPrompt,
    posthog,
  ]);

  const optimisticUserMessage = getOptimisticUserMessage();

  const isV1Conversation = conversation?.conversation_version === "V1";

  // Show V1 messages immediately if events exist in store (e.g., remount),
  // or once loading completes. This replaces the old transition-observation
  // pattern (useState + useEffect watching loading→loaded) which always showed
  // skeleton on remount because local state initialized to false.
  const showV1Messages =
    v1FullEvents.length > 0 || !conversationWebSocket?.isLoadingHistory;

  const isReturningToConversation = !!params.conversationId;
  // Only show loading skeleton when genuinely loading AND no events in store yet.
  // If events exist (e.g., remount after data was already fetched), skip skeleton.
  const isHistoryLoading =
    (isLoadingMessages && !isV1Conversation && v0Events.length === 0) ||
    (isV1Conversation && !showV1Messages);
  const isChatLoading = isHistoryLoading && !isTask;

  const handleSendMessage = async (
    content: string,
    originalImages: File[],
    originalFiles: File[],
  ) => {
    // Create mutable copies of the arrays
    const images = [...originalImages];
    const files = [...originalFiles];

    // Team Mode: When enabled, create a Team Mode session with conversation binding
    // This enables the Handoff mechanism to execute code via CodeActAgent
    // Note: isTask check not needed here since handleSendMessage is only called from
    // an active conversation (user typing in chat), not during initial task creation.
    if (isTeamModeEnabled && params.conversationId && !isTask) {
      // At this point, params.conversationId is the real conversation ID
      const { conversationId } = params;

      posthog.capture("team_mode_session_started", {
        query_character_length: content.length,
        conversation_id: conversationId,
      });

      createTeamSession.mutate({
        task: content,
        conversationId,
      });

      setOptimisticUserMessage(content);
      setMessageToSend("");
      return;
    }

    // Normal message flow (Team Mode disabled)
    if (totalEvents === 0) {
      posthog.capture("initial_query_submitted", {
        entry_point: getEntryPoint(
          selectedRepository !== null,
          replayJson !== null,
        ),
        query_character_length: content.length,
        replay_json_size: replayJson?.length,
      });
    } else {
      posthog.capture("user_message_sent", {
        session_message_count: totalEvents,
        current_message_length: content.length,
      });
    }

    // Validate file sizes before any processing
    const allFiles = [...images, ...files];
    const validation = validateFiles(allFiles);

    if (!validation.isValid) {
      displayErrorToast(`Error: ${validation.errorMessage}`);
      return; // Stop processing if validation fails
    }

    const promises = images.map((image) => convertImageToBase64(image));
    const imageUrls = await Promise.all(promises);

    const timestamp = new Date().toISOString();

    const { skipped_files: skippedFiles, uploaded_files: uploadedFiles } =
      files.length > 0
        ? await uploadFiles({ conversationId: params.conversationId!, files })
        : { skipped_files: [], uploaded_files: [] };

    skippedFiles.forEach((f) => displayErrorToast(f.reason));

    const filePrompt = `${t("CHAT_INTERFACE$AUGMENTED_PROMPT_FILES_TITLE")}: ${uploadedFiles.join("\n\n")}`;
    const prompt =
      uploadedFiles.length > 0 ? `${content}\n\n${filePrompt}` : content;

    send(createChatMessage(prompt, imageUrls, uploadedFiles, timestamp));
    setOptimisticUserMessage(content);
    setMessageToSend("");
  };

  const onClickShareFeedbackActionButton = async (
    polarity: "positive" | "negative",
  ) => {
    setFeedbackModalIsOpen(true);
    setFeedbackPolarity(polarity);
  };

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (autoScroll) {
      scrollDomToBottom();
    }
    // Note: We intentionally exclude autoScroll from deps because we only want
    // to scroll when message content changes, not when autoScroll state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    v1UiEvents.length,
    v0Events.length,
    optimisticUserMessage,
    scrollDomToBottom,
  ]);

  // Create a ScrollProvider with the scroll hook values
  const scrollProviderValue = {
    scrollRef,
    autoScroll,
    setAutoScroll,
    scrollDomToBottom,
    hitBottom,
    setHitBottom,
    onChatBodyScroll,
  };

  // Get server status indicator props
  const isStartingStatus =
    curAgentState === AgentState.LOADING || curAgentState === AgentState.INIT;
  const isStopStatus = curAgentState === AgentState.STOPPED;
  const isPausing = curAgentState === AgentState.PAUSED;
  const serverStatusColor = getStatusColor({
    isPausing,
    isTask,
    taskStatus,
    isStartingStatus,
    isStopStatus,
    curAgentState,
  });
  const serverStatusText = getStatusText({
    isPausing,
    isTask,
    taskStatus,
    taskDetail,
    isStartingStatus,
    isStopStatus,
    curAgentState,
    errorMessage,
    t,
  });

  return (
    <ScrollProvider value={scrollProviderValue}>
      {/* Atoms Plus: Transparent chat interface - parent card handles background */}
      <div className="h-full flex flex-col relative bg-transparent min-h-0">
        {/* Atoms Plus: Message area - flex-grow to fill space */}
        <div
          ref={scrollRef}
          onScroll={(e) => onChatBodyScroll(e.currentTarget)}
          className="atoms-chat-scroll flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 pt-4 gap-4"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(212,168,85,0.3) transparent",
          }}
        >
          {isChatLoading && isReturningToConversation && (
            <ChatMessagesSkeleton />
          )}

          {/* Atoms Plus: Show RuntimeBootstrapProgress during task startup (before messages arrive) */}
          {isTask &&
            !userEventsExist &&
            taskStatus !== "READY" &&
            taskStatus !== "ERROR" && (
              <RuntimeBootstrapProgress
                runtimeStatus={conversation?.runtime_status as RuntimeStatus}
                userMessage={optimisticUserMessage || undefined}
                taskStatus={taskStatus}
              />
            )}

          {(!isLoadingMessages || v0Events.length > 0) && v0UserEventsExist && (
            <V0Messages
              messages={v0Events}
              isAwaitingUserConfirmation={
                curAgentState === AgentState.AWAITING_USER_CONFIRMATION
              }
            />
          )}

          {/* Render V1Messages if:
              1. showV1Messages is true AND
              2. Either v1UserEventsExist OR we have an optimisticUserMessage
                 (to display the initial prompt while waiting for first event) */}
          {showV1Messages && (v1UserEventsExist || optimisticUserMessage) && (
            <V1Messages messages={v1UiEvents} allEvents={v1FullEvents} />
          )}

          {/* Team Mode: Show agent thoughts during collaboration */}
          {isTeamModeEnabled && <TeamModeThoughts />}
        </div>

        {/* Atoms Plus: Bottom control area - transparent background */}
        <div className="flex flex-col gap-2 px-3 pb-3 pt-2 bg-transparent">
          {/* Atoms Plus: Unified status bar - Role + Status aligned */}
          <div className="flex items-center justify-between relative">
            {/* Left: Role + Status indicators (same height h-8) */}
            <div className="flex items-center gap-2">
              {/* Auto Role Indicator - Shows current responding role
                  Hidden when Team Mode is enabled to avoid confusion with
                  Team Mode's own role indicators */}
              {!isTeamModeEnabled && <AutoRoleIndicator showDetails={false} />}

              {/* Team Mode Toggle - compact inline version */}
              <TeamModeToggle compact />

              {/* Status Indicator - Shows agent state or Team Mode status */}
              {isTeamModeRunning && teamModeCurrentAgent ? (
                // Team Mode: Show current agent status
                <ChatStatusIndicator
                  statusColor="#f59e0b"
                  status={`${AGENT_DISPLAY_INFO[teamModeCurrentAgent].icon} ${AGENT_DISPLAY_INFO[teamModeCurrentAgent].name} 处理中...`}
                />
              ) : (
                // Normal mode: Show OpenHands agent status
                isStartingStatus && (
                  <ChatStatusIndicator
                    statusColor={serverStatusColor}
                    status={serverStatusText}
                  />
                )
              )}

              <ConfirmationModeEnabled />

              {totalEvents > 0 && !isV1Conversation && (
                <TrajectoryActions
                  onPositiveFeedback={() =>
                    onClickShareFeedbackActionButton("positive")
                  }
                  onNegativeFeedback={() =>
                    onClickShareFeedbackActionButton("negative")
                  }
                  isSaasMode={config?.app_mode === "saas"}
                />
              )}
            </div>

            {/* Center: Typing indicator */}
            <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0">
              {curAgentState === AgentState.RUNNING && <TypingIndicator />}
            </div>

            {/* Right: Scroll to bottom */}
            {!hitBottom && <ScrollToBottomButton onClick={scrollDomToBottom} />}
          </div>

          {errorMessage && (
            <ErrorMessageBanner
              message={errorMessage}
              onDismiss={removeErrorMessage}
            />
          )}

          {/* Team Mode: HITL Clarification Panel */}
          {isTeamModeEnabled && (
            <ClarificationPanel onSubmit={handleClarificationSubmit} />
          )}

          <InteractiveChatBox onSubmit={handleSendMessage} />
        </div>

        {config?.app_mode !== "saas" && !isV1Conversation && (
          <FeedbackModal
            isOpen={feedbackModalIsOpen}
            onClose={() => setFeedbackModalIsOpen(false)}
            polarity={feedbackPolarity}
          />
        )}
      </div>
    </ScrollProvider>
  );
}
