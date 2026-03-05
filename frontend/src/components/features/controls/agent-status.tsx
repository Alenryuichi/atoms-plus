import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useStatusStore } from "#/stores/status-store";
import { useActiveConversation } from "#/hooks/query/use-active-conversation";
import { getStatusCode } from "#/utils/status";
import { ChatStopButton } from "../chat/chat-stop-button";
import { AgentState } from "#/types/agent-state";
import ClockIcon from "#/icons/u-clock-three.svg?react";
import { ChatResumeAgentButton } from "../chat/chat-play-button";
import { cn, isTaskPolling } from "#/utils/utils";
import { AgentLoading } from "./agent-loading";
import { useConversationStore } from "#/stores/conversation-store";
import CircleErrorIcon from "#/icons/circle-error.svg?react";
import { useAgentState } from "#/hooks/use-agent-state";
import { useUnifiedWebSocketStatus } from "#/hooks/use-unified-websocket-status";
import { useTaskPolling } from "#/hooks/query/use-task-polling";
import { useSubConversationTaskPolling } from "#/hooks/query/use-sub-conversation-task-polling";

// Check if running in mock mode - skip loading state for testing
const isMockMode = import.meta.env.VITE_MOCK_API === "true";

export interface AgentStatusProps {
  className?: string;
  handleStop: () => void;
  handleResumeAgent: () => void;
  disabled?: boolean;
  isPausing?: boolean;
}

export function AgentStatus({
  className = "",
  handleStop,
  handleResumeAgent,
  disabled = false,
  isPausing = false,
}: AgentStatusProps) {
  const { t } = useTranslation();
  const { setShouldShownAgentLoading } = useConversationStore();
  const { curAgentState } = useAgentState();
  const { curStatusMessage } = useStatusStore();
  const webSocketStatus = useUnifiedWebSocketStatus();
  const { data: conversation } = useActiveConversation();
  const { taskStatus } = useTaskPolling();

  const { subConversationTaskId } = useConversationStore();

  // Poll sub-conversation task to track its loading state
  const { taskStatus: subConversationTaskStatus } =
    useSubConversationTaskPolling(
      subConversationTaskId,
      conversation?.conversation_id || null,
    );

  const statusCode = getStatusCode(
    curStatusMessage,
    webSocketStatus,
    conversation?.status || null,
    conversation?.runtime_status || null,
    curAgentState,
    taskStatus,
    subConversationTaskStatus,
  );

  // In mock mode, skip loading state to allow testing Preview panel
  const shouldShownAgentLoading = isMockMode
    ? false
    : curAgentState === AgentState.INIT ||
      curAgentState === AgentState.LOADING ||
      (webSocketStatus === "CONNECTING" && taskStatus !== "ERROR") ||
      isTaskPolling(taskStatus) ||
      isTaskPolling(subConversationTaskStatus);

  // For UI rendering - includes pause state
  const isLoading = shouldShownAgentLoading || isPausing;

  const shouldShownAgentError =
    curAgentState === AgentState.ERROR ||
    curAgentState === AgentState.RATE_LIMITED ||
    webSocketStatus === "DISCONNECTED" ||
    taskStatus === "ERROR";

  const shouldShownAgentStop = curAgentState === AgentState.RUNNING;

  const shouldShownAgentResume =
    curAgentState === AgentState.STOPPED || curAgentState === AgentState.PAUSED;

  // Update global state when agent loading condition changes
  useEffect(() => {
    setShouldShownAgentLoading(!!shouldShownAgentLoading);
  }, [shouldShownAgentLoading, setShouldShownAgentLoading]);

  return (
    <div className={cn("flex items-center gap-2 min-w-0", className)}>
      <span
        className="text-xs text-neutral-400 font-medium flex-1 min-w-0 max-w-full whitespace-normal break-words"
        title={t(statusCode)}
      >
        {t(statusCode)}
      </span>
      <div
        className={cn(
          // Atoms Plus: Glass effect control button
          "bg-black/40 backdrop-blur-sm border border-white/10",
          "box-border flex items-center justify-center",
          "rounded-full shrink-0 size-7",
          "transition-all duration-200 active:scale-95",
          !isLoading &&
            (shouldShownAgentStop || shouldShownAgentResume) &&
            "hover:bg-black/60 hover:border-amber-500/30 cursor-pointer",
        )}
      >
        {isLoading && <AgentLoading />}
        {!isLoading && shouldShownAgentStop && (
          <ChatStopButton handleStop={handleStop} />
        )}
        {!isLoading && shouldShownAgentResume && (
          <ChatResumeAgentButton
            onAgentResumed={handleResumeAgent}
            disabled={disabled}
          />
        )}
        {!isLoading && shouldShownAgentError && (
          <CircleErrorIcon
            className="w-4 h-4 text-red-400"
            data-testid="circle-error-icon"
          />
        )}
        {!isLoading &&
          !shouldShownAgentStop &&
          !shouldShownAgentResume &&
          !shouldShownAgentError && <ClockIcon className="w-4 h-4 text-neutral-400" />}
      </div>
    </div>
  );
}

export default AgentStatus;
