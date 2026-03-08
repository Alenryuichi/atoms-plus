import { useCallback, useEffect, useRef } from "react";
import { useTeamModeStore } from "#/stores/team-mode-store";
import { useTracking } from "#/hooks/use-tracking";
import TeamModeService from "#/api/team-mode-service/team-mode-service.api";
import {
  AgentThought,
  TeamSessionStatus,
} from "#/api/team-mode-service/team-mode-service.types";
import { useClarificationStore } from "./clarification";
import type { ClarifyingQuestion, UserAnswer } from "./clarification";

// Singleton connection manager to prevent multiple WebSocket connections
const connectionManager = {
  ws: null as WebSocket | null,
  sessionId: null as string | null,
  reconnectAttempts: 0,
  parseErrorCount: 0,
  connecting: false,
};

/**
 * Custom hook for managing Team Mode WebSocket connection.
 * Uses a singleton connection manager to prevent multiple connections
 * when hook is used in multiple components.
 */
export function useTeamModeWebSocket() {
  const maxReconnectAttempts = 3;
  const maxParseErrors = 10;
  const cleanupRef = useRef<(() => void) | null>(null);

  const { trackClarificationTriggered } = useTracking();

  // Use individual selectors to prevent re-renders when unrelated state changes
  // This is critical to avoid infinite loops - destructuring causes re-renders
  // on ANY store change, even if the values we use haven't changed
  const sessionId = useTeamModeStore((state) => state.sessionId);
  const setWs = useTeamModeStore((state) => state.setWs);
  const setIsRunning = useTeamModeStore((state) => state.setIsRunning);
  const setError = useTeamModeStore((state) => state.setError);
  const addThought = useTeamModeStore((state) => state.addThought);
  const setStatus = useTeamModeStore((state) => state.setStatus);
  const setWorkProducts = useTeamModeStore((state) => state.setWorkProducts);
  const setCurrentAgent = useTeamModeStore((state) => state.setCurrentAgent);

  // Store sessionId in ref to avoid re-creating handleMessage on sessionId change
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;

  // Use individual selectors for clarification store too
  const startClarification = useClarificationStore(
    (state) => state.startClarification,
  );
  const resetClarification = useClarificationStore((state) => state.reset);

  const handleMessage = useCallback(
    (wsEvent: MessageEvent) => {
      // Guard: stop processing if too many errors
      if (connectionManager.parseErrorCount >= maxParseErrors) {
        return;
      }

      try {
        // Backend sends messages with 'event' field, frontend types use 'type'
        // Handle both formats for compatibility
        const rawMessage = JSON.parse(wsEvent.data);

        // Reset error count on successful JSON parse
        connectionManager.parseErrorCount = 0;

        // Normalize: backend uses 'event' for primary message type
        // Note: 'type' is used for sub-types (e.g., interrupt type)
        // Prioritize 'event' over 'type' to correctly route messages
        const messageType = rawMessage.event ?? rawMessage.type;

        if (!messageType) {
          console.warn("Team Mode WS message missing type/event:", rawMessage);
          return;
        }

        switch (messageType) {
          case "started": {
            // Backend sends 'started' when graph begins execution
            setIsRunning(true);
            break;
          }

          case "awaiting_input": {
            // Session is waiting for user input (reconnected to interrupted session)
            // Keep running state but don't restart - just wait for interrupt data
            setIsRunning(true);
            break;
          }

          case "thought": {
            // Backend sends thought directly in message, not nested under 'data'
            const thought: AgentThought = rawMessage.data ?? {
              role: rawMessage.agent,
              content: rawMessage.content,
              status: rawMessage.status,
              timestamp: rawMessage.timestamp,
            };
            addThought(thought);

            // Update current agent from thought
            if (thought.role) {
              setCurrentAgent(thought.role);
            }
            break;
          }

          case "status": {
            const statusData = rawMessage.data as TeamSessionStatus;
            setStatus(statusData);
            if (statusData?.current_agent) {
              setCurrentAgent(statusData.current_agent);
            }
            break;
          }

          case "completed":
          case "complete": {
            // Backend sends 'completed', handle both for safety
            const completeData = rawMessage.data as
              | {
                  plan: string;
                  code: string;
                  review: string;
                }
              | undefined;
            if (completeData) {
              setWorkProducts(
                completeData.plan,
                completeData.code,
                completeData.review,
              );
            }
            setIsRunning(false);
            break;
          }

          case "error": {
            const errorMsg =
              rawMessage.message ?? rawMessage.data?.error ?? "Unknown error";
            setError(errorMsg);
            setIsRunning(false);
            break;
          }

          // HITL Interrupt events (from LangGraph interrupt())
          case "interrupt": {
            // Safely extract interrupt data - may be nested in data or at top level
            const interruptData = rawMessage.data ?? rawMessage;
            const interruptType =
              interruptData?.type ?? rawMessage.type ?? "unknown";

            // Handle clarification interrupts
            if (
              interruptType === "clarification:questions" ||
              interruptData?.questions ||
              rawMessage.questions
            ) {
              // Questions can be at top level, in data, or nested
              const questions = (interruptData?.questions ??
                rawMessage.questions) as ClarifyingQuestion[] | undefined;
              const canSkip =
                interruptData?.can_skip ?? rawMessage.can_skip ?? true;
              const clarifySessionId =
                interruptData?.session_id ??
                rawMessage.session_id ??
                sessionIdRef.current ??
                "";

              // Only proceed if we have valid questions
              if (
                questions &&
                Array.isArray(questions) &&
                questions.length > 0
              ) {
                const highestPriority =
                  questions.find((q) => q?.priority === "critical")?.priority ||
                  questions.find((q) => q?.priority === "important")
                    ?.priority ||
                  "nice-to-have";

                trackClarificationTriggered({
                  questionCount: questions.length,
                  priority: highestPriority,
                  sessionId: clarifySessionId,
                });

                startClarification(clarifySessionId, questions, canSkip);
              } else {
                // eslint-disable-next-line no-console
                console.warn(
                  "Interrupt received but no valid questions:",
                  rawMessage,
                );
              }
            }
            break;
          }

          // Legacy clarification events (direct, not via interrupt)
          case "clarification:questions": {
            const clarifyData = rawMessage.data as
              | {
                  session_id: string;
                  questions: ClarifyingQuestion[];
                  can_skip: boolean;
                }
              | undefined;

            // Guard against missing or malformed data
            if (
              !clarifyData?.questions ||
              !Array.isArray(clarifyData.questions)
            ) {
              // eslint-disable-next-line no-console
              console.warn(
                "clarification:questions missing questions array:",
                rawMessage,
              );
              break;
            }

            const highestPriority =
              clarifyData.questions.find((q) => q?.priority === "critical")
                ?.priority ||
              clarifyData.questions.find((q) => q?.priority === "important")
                ?.priority ||
              "nice-to-have";

            trackClarificationTriggered({
              questionCount: clarifyData.questions.length,
              priority: highestPriority,
              sessionId: clarifyData.session_id ?? "",
            });

            startClarification(
              clarifyData.session_id ?? "",
              clarifyData.questions,
              clarifyData.can_skip ?? true,
            );
            break;
          }

          case "clarification:complete": {
            resetClarification();
            break;
          }

          case "clarification:received":
          case "clarification:skipped": {
            // Server acknowledged the clarification response
            // Reset the clarification UI
            resetClarification();
            break;
          }

          case "pong": {
            // Heartbeat response - ignore
            break;
          }

          default:
            // eslint-disable-next-line no-console
            console.warn("Unknown Team Mode WS message type:", messageType);
        }
      } catch (err) {
        connectionManager.parseErrorCount += 1;
        console.error(
          `Failed to parse Team Mode WS message (${connectionManager.parseErrorCount}/${maxParseErrors}):`,
          err,
        );
        if (connectionManager.parseErrorCount >= maxParseErrors) {
          setError("Too many WebSocket message parse errors");
          setIsRunning(false);
        }
      }
    },
    [
      // Note: sessionId removed - using sessionIdRef to avoid re-creating callback
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
      const { ws } = connectionManager;
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

  const connect = useCallback(
    (targetSessionId: string): (() => void) | undefined => {
      if (!targetSessionId) return undefined;

      // Skip if already connected or connecting to this session (singleton check)
      if (
        connectionManager.sessionId === targetSessionId &&
        (connectionManager.ws?.readyState === WebSocket.OPEN ||
          connectionManager.ws?.readyState === WebSocket.CONNECTING ||
          connectionManager.connecting)
      ) {
        return undefined;
      }

      // Close existing connection if connecting to a different session
      if (connectionManager.ws) {
        connectionManager.ws.close();
        connectionManager.ws = null;
      }

      connectionManager.connecting = true;
      connectionManager.sessionId = targetSessionId;

      const url = TeamModeService.getStreamUrl(targetSessionId);
      // eslint-disable-next-line no-console
      console.log("[Team Mode WS] Connecting to:", url);

      const ws = new WebSocket(url);
      connectionManager.ws = ws;

      ws.onopen = () => {
        // eslint-disable-next-line no-console
        console.log("[Team Mode WS] Connected successfully");
        connectionManager.reconnectAttempts = 0;
        connectionManager.connecting = false;
        setIsRunning(true);
        setError(null);
      };

      ws.onmessage = handleMessage;

      ws.onerror = (event) => {
        // eslint-disable-next-line no-console
        console.error("[Team Mode WS] Connection error:", event, "URL:", url);
        connectionManager.connecting = false;
        setError(`WebSocket connection error (URL: ${url})`);
      };

      ws.onclose = (event) => {
        connectionManager.ws = null;
        connectionManager.connecting = false;
        const currentSessionId = connectionManager.sessionId;
        if (
          !event.wasClean &&
          connectionManager.reconnectAttempts < maxReconnectAttempts &&
          currentSessionId === targetSessionId
        ) {
          connectionManager.reconnectAttempts += 1;
          setTimeout(
            () => connect(targetSessionId),
            1000 * connectionManager.reconnectAttempts,
          );
        } else {
          connectionManager.sessionId = null;
          setIsRunning(false);
        }
      };

      setWs(ws);

      const cleanup = () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
        if (connectionManager.ws === ws) {
          connectionManager.ws = null;
          connectionManager.sessionId = null;
          connectionManager.connecting = false;
        }
      };

      cleanupRef.current = cleanup;
      return cleanup;
    },
    [handleMessage, setWs, setIsRunning, setError],
  );

  // Auto-connect when sessionId changes
  useEffect(() => {
    if (sessionId && sessionId !== connectionManager.sessionId) {
      const cleanup = connect(sessionId);
      return cleanup;
    }
    return undefined;
    // Note: connect is stable due to useCallback, so this won't cause loops
  }, [sessionId, connect]);

  return { connect, sendClarificationAnswer };
}
