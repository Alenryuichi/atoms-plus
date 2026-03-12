import React from "react";
import { usePostHog } from "posthog-js/react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { convertImageToBase64 } from "#/utils/convert-image-to-base-64";
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
import { isMessageEvent, isActionEvent } from "#/types/v1/type-guards";
import { parseMessageFromEvent as parseV0MessageFromEvent } from "./event-content-helpers/parse-message-from-event";
import { parseMessageFromEvent as parseV1MessageFromEvent } from "#/components/v1/chat/event-content-helpers/parse-message-from-event";
import { parseAssistantSuggestions } from "#/utils/assistant-suggestions";
import type { OHEvent } from "#/stores/use-event-store";

import { RuntimeBootstrapProgress } from "./runtime-bootstrap-progress";
import type { RuntimeStatus } from "#/types/runtime-status";

function getEntryPoint(
  hasRepository: boolean | null,
  hasReplayJson: boolean | null,
): string {
  if (hasRepository) return "github";
  if (hasReplayJson) return "replay";
  return "direct";
}

const getLatestAssistantTextFromV0 = (events: OHEvent[]): string => {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    if (!("action" in event) || event.source !== "agent") continue;

    if (event.action === "message") {
      return parseV0MessageFromEvent(event);
    }

    if (
      event.action === "finish" &&
      "args" in event &&
      event.args &&
      typeof event.args === "object" &&
      "final_thought" in event.args &&
      typeof event.args.final_thought === "string"
    ) {
      return event.args.final_thought.trim();
    }
  }

  return "";
};

const getLatestAssistantTextFromV1 = (events: OHEvent[]): string => {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];

    if (isMessageEvent(event) && event.llm_message.role === "assistant") {
      return parseV1MessageFromEvent(event);
    }

    if (
      isActionEvent(event) &&
      event.action.kind === "FinishAction" &&
      typeof event.action.message === "string"
    ) {
      return event.action.message.trim();
    }
  }

  return "";
};

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

  // Disable Build button while agent is running (streaming)
  const isAgentRunning =
    curAgentState === AgentState.RUNNING ||
    curAgentState === AgentState.LOADING;

  // Global keyboard shortcut for Build button (Cmd+Enter / Ctrl+Enter)
  React.useEffect(() => {
    if (isAgentRunning) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
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
  const { selectedRepository, replayJson } = useInitialQueryStore();
  const params = useParams();
  const { mutateAsync: uploadFiles } = useUnifiedUploadFiles();

  const optimisticUserMessage = getOptimisticUserMessage();

  const isV1Conversation = conversation?.conversation_version === "V1";
  const latestAssistantText = React.useMemo(
    () =>
      isV1Conversation
        ? getLatestAssistantTextFromV1(v1FullEvents)
        : getLatestAssistantTextFromV0(v0Events),
    [isV1Conversation, v0Events, v1FullEvents],
  );
  const suggestionChips = React.useMemo(
    () => parseAssistantSuggestions(latestAssistantText),
    [latestAssistantText],
  );

  const showV1Messages =
    v1FullEvents.length > 0 || !conversationWebSocket?.isLoadingHistory;

  const isReturningToConversation = !!params.conversationId;
  const isHistoryLoading =
    (isLoadingMessages && !isV1Conversation && v0Events.length === 0) ||
    (isV1Conversation && !showV1Messages);
  const isChatLoading = isHistoryLoading && !isTask;

  // P0 Fix: Detect transition state from task to conversation
  // This happens when:
  // - We just navigated from task-xxx to real conversation URL (!isTask)
  // - No events have arrived yet (!userEventsExist)
  // - We have an optimistic user message (user just submitted from home page)
  // - WebSocket is still connecting or loading history
  const isTransitioningFromTask =
    !isTask && !userEventsExist && !!optimisticUserMessage;

  const handleSendMessage = async (
    content: string,
    originalImages: File[],
    originalFiles: File[],
  ) => {
    const images = [...originalImages];
    const files = [...originalFiles];
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

    const allFiles = [...images, ...files];
    const validation = validateFiles(allFiles);

    if (!validation.isValid) {
      displayErrorToast(`Error: ${validation.errorMessage}`);
      return;
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

  React.useEffect(() => {
    if (autoScroll) {
      scrollDomToBottom();
    }
  }, [
    v1UiEvents.length,
    v0Events.length,
    optimisticUserMessage,
    scrollDomToBottom,
  ]);

  const scrollProviderValue = {
    scrollRef,
    autoScroll,
    setAutoScroll,
    scrollDomToBottom,
    hitBottom,
    setHitBottom,
    onChatBodyScroll,
  };

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
      <div className="h-full flex flex-col relative min-h-0 overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.05),_transparent_44%)]">
        <div
          ref={scrollRef}
          onScroll={(e) => onChatBodyScroll(e.currentTarget)}
          className="atoms-chat-scroll custom-scrollbar flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 pt-8 pb-3 md:px-8 md:pt-10"
        >
          {isChatLoading && isReturningToConversation && (
            <ChatMessagesSkeleton />
          )}

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

          {/* P0 Fix: Show transition state when navigating from task to conversation */}
          {/* This bridges the gap between task completion and WebSocket connection */}
          {isTransitioningFromTask && (
            <RuntimeBootstrapProgress
              runtimeStatus={conversation?.runtime_status as RuntimeStatus}
              userMessage={optimisticUserMessage || undefined}
              taskStatus="READY"
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

          {showV1Messages && v1UserEventsExist && (
            <V1Messages messages={v1UiEvents} allEvents={v1FullEvents} />
          )}

          {/* Typing indicator - placed inside message area for better flow */}
          {curAgentState === AgentState.RUNNING && (
            <div className="mb-8 pl-11">
              <TypingIndicator />
            </div>
          )}
        </div>

        <div className="mx-4 mb-4 mt-2 flex flex-col gap-3 px-1 py-2 md:mx-6">
          {!isAgentRunning && suggestionChips.length > 0 && (
            <div className="flex flex-wrap gap-2 px-1">
              {suggestionChips.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(suggestion, [], [])}
                  className="workbench-chip cursor-pointer rounded-full px-3 py-1.5 text-[11px] font-medium"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              {isStartingStatus && (
                <ChatStatusIndicator
                  statusColor={serverStatusColor}
                  status={serverStatusText}
                />
              )}
              <ConfirmationModeEnabled />
            </div>

            {!hitBottom && <ScrollToBottomButton onClick={scrollDomToBottom} />}
          </div>

          {errorMessage && (
            <ErrorMessageBanner
              message={errorMessage}
              onDismiss={removeErrorMessage}
            />
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
