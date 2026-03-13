import React from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { useConversationId } from "#/hooks/use-conversation-id";
import { useCommandStore } from "#/stores/command-store";
import { useConversationStore } from "#/stores/conversation-store";
import { useAgentStore } from "#/stores/agent-store";
import { AgentState } from "#/types/agent-state";

import { useBatchFeedback } from "#/hooks/query/use-batch-feedback";
import { EventHandler } from "../wrapper/event-handler";
import { useConversationConfig } from "#/hooks/query/use-conversation-config";

import { useActiveConversation } from "#/hooks/query/use-active-conversation";
import { useTaskPolling } from "#/hooks/query/use-task-polling";

import { displayErrorToast } from "#/utils/custom-toast-handlers";
import { useIsAuthed } from "#/hooks/query/use-is-authed";
import { ConversationSubscriptionsProvider } from "#/context/conversation-subscriptions-provider";
import { useUserProviders } from "#/hooks/use-user-providers";

import { ConversationMain } from "#/components/features/conversation/conversation-main/conversation-main";

import { WebSocketProviderWrapper } from "#/contexts/websocket-provider-wrapper";
import { useErrorMessageStore } from "#/stores/error-message-store";
import { useUnifiedResumeConversationSandbox } from "#/hooks/mutation/use-unified-start-conversation";
import { I18nKey } from "#/i18n/declaration";
import { useEventStore } from "#/stores/use-event-store";
import { useResearchStore } from "#/stores/research-store";
import { ResearchService } from "#/api/research-service/research-service.api";

const REPORT_SAVE_RETRY_DELAY_MS = 1500;
const REPORT_SAVE_MAX_RETRIES = 5;

const isNonRetryableReportSaveError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("not supported") || message.includes("invalid sandbox id");
};

function AppContent() {
  useConversationConfig();
  const { t } = useTranslation();
  const { conversationId } = useConversationId();
  const clearEvents = useEventStore((state) => state.clearEvents);

  // Handle both task IDs (task-{uuid}) and regular conversation IDs
  const { isTask, taskStatus, taskDetail } = useTaskPolling();

  const { data: conversation, isFetched, refetch } = useActiveConversation();
  const { mutate: startConversation, isPending: isStarting } =
    useUnifiedResumeConversationSandbox();
  const { data: isAuthed } = useIsAuthed();
  const { providers } = useUserProviders();
  const { resetConversationState, setResearchReport, setSelectedTab, setIsRightPanelShown } = useConversationStore();
  const navigate = useNavigate();
  const clearTerminal = useCommandStore((state) => state.clearTerminal);
  const setCurrentAgentState = useAgentStore(
    (state) => state.setCurrentAgentState,
  );
  const removeErrorMessage = useErrorMessageStore(
    (state) => state.removeErrorMessage,
  );

  // Deep Research state — watch for completion to inject report + show tab
  const researchPhase = useResearchStore((s) => s.phase);
  const researchResult = useResearchStore((s) => s.result);
  const [reportSaveRetryCount, setReportSaveRetryCount] = React.useState(0);

  // Track the last successfully auto-saved research run, keyed by conversation + sandbox + session
  const lastAutoSavedReportKey = React.useRef<string | null>(null);
  const reportSaveRetryTimeout = React.useRef<number | null>(null);

  // Track which conversation ID we've auto-started to prevent auto-restart after manual stop
  const processedConversationId = React.useRef<string | null>(null);

  // Fetch batch feedback data when conversation is loaded
  useBatchFeedback();

  const clearReportSaveRetryTimeout = React.useCallback(() => {
    if (reportSaveRetryTimeout.current !== null) {
      window.clearTimeout(reportSaveRetryTimeout.current);
      reportSaveRetryTimeout.current = null;
    }
  }, []);

  const reportAutoSaveKey = React.useMemo(() => {
    if (!conversationId || !conversation?.sandbox_id || !researchResult?.session_id) {
      return null;
    }

    return `${conversationId}:${conversation.sandbox_id}:${researchResult.session_id}`;
  }, [conversationId, conversation?.sandbox_id, researchResult?.session_id]);

  // 1. Cleanup Effect - runs when navigating to a different conversation
  React.useEffect(() => {
    clearTerminal();
    resetConversationState();
    setCurrentAgentState(AgentState.LOADING);
    removeErrorMessage();
    clearEvents();

    // Restore research report from sessionStorage (one-time bridge from home page)
    const pendingReport = sessionStorage.getItem("pending-research-report");
    if (pendingReport) {
      sessionStorage.removeItem("pending-research-report");
      setResearchReport(pendingReport);
      setSelectedTab("research");
      setIsRightPanelShown(true);
    }

    // Reset tracking ONLY if we're navigating to a DIFFERENT conversation
    // Don't reset on StrictMode remounts (conversationId is the same)
    if (processedConversationId.current !== conversationId) {
      processedConversationId.current = null;
      lastAutoSavedReportKey.current = null;
      setReportSaveRetryCount(0);
      clearReportSaveRetryTimeout();
    }
  }, [
    conversationId,
    clearTerminal,
    resetConversationState,
    setCurrentAgentState,
    removeErrorMessage,
    clearEvents,
    setResearchReport,
    setSelectedTab,
    setIsRightPanelShown,
    clearReportSaveRetryTimeout,
  ]);

  // Open Research tab as soon as research starts, inject report once available
  React.useEffect(() => {
    if (researchPhase === "connecting" || researchPhase === "researching") {
      setSelectedTab("research");
      setIsRightPanelShown(true);
    }
    if (
      (researchPhase === "awaiting_confirmation" || researchPhase === "completed") &&
      researchResult?.report
    ) {
      setResearchReport(researchResult.report);
      setSelectedTab("research");
      setIsRightPanelShown(true);
    }
  }, [researchPhase, researchResult, setResearchReport, setSelectedTab, setIsRightPanelShown]);

  React.useEffect(() => {
    setReportSaveRetryCount(0);
    clearReportSaveRetryTimeout();
  }, [reportAutoSaveKey, clearReportSaveRetryTimeout]);

  React.useEffect(() => () => clearReportSaveRetryTimeout(), [clearReportSaveRetryTimeout]);

  // Auto-save report to sandbox once research completes and sandbox is ready
  React.useEffect(() => {
    const sandboxId = conversation?.sandbox_id;
    const report = researchResult?.report;
    const shouldSave =
      researchPhase === "awaiting_confirmation" || researchPhase === "completed";

    if (!reportAutoSaveKey || !report || !sandboxId || !shouldSave) {
      return;
    }

    if (lastAutoSavedReportKey.current === reportAutoSaveKey) {
      return;
    }

    let cancelled = false;

    void ResearchService.saveReport({
      sandbox_id: sandboxId,
      report,
    })
      .then(() => {
        if (cancelled) {
          return;
        }

        clearReportSaveRetryTimeout();
        lastAutoSavedReportKey.current = reportAutoSaveKey;
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }

        const retryable = !isNonRetryableReportSaveError(err);
        const hasAttemptsLeft = reportSaveRetryCount < REPORT_SAVE_MAX_RETRIES;

        console.warn("[Deep Research] Failed to save report to sandbox:", err);

        if (!retryable || !hasAttemptsLeft) {
          clearReportSaveRetryTimeout();
          return;
        }

        clearReportSaveRetryTimeout();
        reportSaveRetryTimeout.current = window.setTimeout(() => {
          setReportSaveRetryCount((current) => current + 1);
        }, REPORT_SAVE_RETRY_DELAY_MS);
      });

    return () => {
      cancelled = true;
    };
  }, [
    researchPhase,
    researchResult?.report,
    conversation?.sandbox_id,
    reportAutoSaveKey,
    reportSaveRetryCount,
    clearReportSaveRetryTimeout,
  ]);

  // 2. Task Error Display Effect
  React.useEffect(() => {
    if (isTask && taskStatus === "ERROR") {
      displayErrorToast(
        taskDetail || t(I18nKey.CONVERSATION$FAILED_TO_START_FROM_TASK),
      );
    }
  }, [isTask, taskStatus, taskDetail, t]);

  // 3. Auto-start Effect - handles conversation not found and auto-starting STOPPED conversations
  React.useEffect(() => {
    // Wait for data to be fetched
    if (!isFetched || !isAuthed) return;

    // Handle conversation not found
    if (!conversation) {
      displayErrorToast(t(I18nKey.CONVERSATION$NOT_EXIST_OR_NO_PERMISSION));
      navigate("/");
      return;
    }

    const currentConversationId = conversation.conversation_id;
    const currentStatus = conversation.status;

    // Skip if we've already processed this conversation
    if (processedConversationId.current === currentConversationId) {
      return;
    }

    // Mark as processed immediately to prevent duplicate calls
    processedConversationId.current = currentConversationId;

    // Auto-start STOPPED conversations on initial load only
    if (currentStatus === "STOPPED" && !isStarting) {
      startConversation(
        { conversationId: currentConversationId, providers },
        {
          onError: (error) => {
            displayErrorToast(
              t(I18nKey.CONVERSATION$FAILED_TO_START_WITH_ERROR, {
                error: error.message,
              }),
            );
            refetch();
          },
        },
      );
    }
    // NOTE: conversation?.status is intentionally NOT in dependencies
    // We only want to run when conversation ID changes, not when status changes
    // This prevents duplicate calls when stale cache data is replaced with fresh data
  }, [
    conversation?.conversation_id,
    isFetched,
    isAuthed,
    isStarting,
    providers,
    startConversation,
    navigate,
    refetch,
    t,
  ]);

  const isV0Conversation = conversation?.conversation_version === "V0";

  const content = (
    <ConversationSubscriptionsProvider>
      <EventHandler>
        <div
          data-testid="app-route"
          className="flex flex-col flex-1 min-h-0 h-full"
        >
          {/* Atoms Plus: Simplified layout - Chat + Preview only */}
          <ConversationMain />
        </div>
      </EventHandler>
    </ConversationSubscriptionsProvider>
  );

  // Render WebSocket provider immediately to avoid mount/remount cycles
  // The providers internally handle waiting for conversation data to be ready
  return (
    <WebSocketProviderWrapper
      version={isV0Conversation ? 0 : 1}
      conversationId={conversationId}
    >
      {content}
    </WebSocketProviderWrapper>
  );
}

function App() {
  return <AppContent />;
}

export default App;
