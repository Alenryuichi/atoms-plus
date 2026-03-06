import { useCallback, useEffect, useRef } from "react";
import { useTeamModeStore } from "#/stores/team-mode-store";
import { useTracking } from "#/hooks/use-tracking";
import TeamModeService from "#/api/team-mode-service/team-mode-service.api";
import {
  TeamWSMessage,
  AgentThought,
  TeamSessionStatus,
} from "#/api/team-mode-service/team-mode-service.types";
import { useClarificationStore } from "./clarification";
import type { ClarifyingQuestion, UserAnswer } from "./clarification";

/**
 * Custom hook for managing Team Mode WebSocket connection
 */
export function useTeamModeWebSocket() {
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const wsRef = useRef<WebSocket | null>(null);

  const { trackClarificationTriggered } = useTracking();

  const {
    sessionId,
    setWs,
    setIsRunning,
    setError,
    addThought,
    setStatus,
    setWorkProducts,
    setCurrentAgent,
  } = useTeamModeStore();

  const { startClarification, reset: resetClarification } =
    useClarificationStore();

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message: TeamWSMessage = JSON.parse(event.data);

        switch (message.type) {
          case "thought": {
            addThought(message.data as AgentThought);
            break;
          }

          case "status": {
            setStatus(message.data as TeamSessionStatus);
            const statusData = message.data as TeamSessionStatus;
            if (statusData.current_agent) {
              setCurrentAgent(statusData.current_agent);
            }
            break;
          }

          case "complete": {
            const completeData = message.data as {
              plan: string;
              code: string;
              review: string;
            };
            setWorkProducts(
              completeData.plan,
              completeData.code,
              completeData.review,
            );
            setIsRunning(false);
            break;
          }

          case "error": {
            const errorData = message.data as { error: string };
            setError(errorData.error);
            setIsRunning(false);
            break;
          }

          // HITL Clarification events
          case "clarification:questions": {
            const clarifyData = message.data as {
              session_id: string;
              questions: ClarifyingQuestion[];
              can_skip: boolean;
            };

            // Track clarification triggered
            const highestPriority =
              clarifyData.questions.find((q) => q.priority === "critical")
                ?.priority ||
              clarifyData.questions.find((q) => q.priority === "important")
                ?.priority ||
              "nice-to-have";

            trackClarificationTriggered({
              questionCount: clarifyData.questions.length,
              priority: highestPriority,
              sessionId: clarifyData.session_id,
            });

            startClarification(
              clarifyData.session_id,
              clarifyData.questions,
              clarifyData.can_skip,
            );
            break;
          }

          case "clarification:complete": {
            // Server acknowledged answers, resume graph
            resetClarification();
            break;
          }

          default:
            // eslint-disable-next-line no-console
            console.warn("Unknown Team Mode WS message type:", message.type);
        }
      } catch (err) {
        console.error("Failed to parse Team Mode WS message:", err);
      }
    },
    [
      addThought,
      setStatus,
      setWorkProducts,
      setIsRunning,
      setError,
      setCurrentAgent,
      startClarification,
      resetClarification,
      trackClarificationTriggered,
    ],
  );

  /**
   * Send clarification answers back to server
   */
  const sendClarificationAnswer = useCallback(
    (answers: UserAnswer[], skipped: boolean) => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: skipped ? "clarification:skip" : "clarification:answer",
            data: { answers, skipped },
          }),
        );
      }
    },
    [],
  );

  const connect = useCallback((): (() => void) | undefined => {
    if (!sessionId) return undefined;

    const url = TeamModeService.getStreamUrl(sessionId);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttempts.current = 0;
      setIsRunning(true);
      setError(null);
    };

    ws.onmessage = handleMessage;

    ws.onerror = () => {
      setError("WebSocket connection error");
    };

    ws.onclose = (event) => {
      wsRef.current = null;
      if (!event.wasClean && reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current += 1;
        setTimeout(connect, 1000 * reconnectAttempts.current);
      } else {
        setIsRunning(false);
      }
    };

    setWs(ws);

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      wsRef.current = null;
    };
  }, [sessionId, handleMessage, setWs, setIsRunning, setError]);

  // Auto-connect when sessionId changes
  useEffect(() => {
    if (sessionId) {
      const cleanup = connect();
      return cleanup;
    }
    return undefined;
  }, [sessionId, connect]);

  return { connect, sendClarificationAnswer };
}
