import { IconArrowUp, IconPlayerStopFilled, IconPlayerPlayFilled } from "@tabler/icons-react";
import { cn } from "#/utils/utils";
import { AgentState } from "#/types/agent-state";

export type ButtonMode = "send" | "stop" | "resume" | "loading" | "disabled";

function getButtonMode(
  agentState: AgentState,
  hasContent: boolean,
  isPausing: boolean,
): ButtonMode {
  if (isPausing) return "loading";

  if (
    agentState === AgentState.INIT ||
    agentState === AgentState.LOADING
  ) {
    return "loading";
  }

  if (agentState === AgentState.RUNNING) return "stop";

  if (
    agentState === AgentState.STOPPED ||
    agentState === AgentState.PAUSED
  ) {
    return hasContent ? "send" : "resume";
  }

  return hasContent ? "send" : "disabled";
}

export interface ChatSendButtonProps {
  buttonClassName?: string;
  handleSubmit: () => void;
  handleStop: () => void;
  handleResume: () => void;
  agentState: AgentState;
  hasContent: boolean;
  isPausing?: boolean;
}

export function ChatSendButton({
  buttonClassName,
  handleSubmit,
  handleStop,
  handleResume,
  agentState,
  hasContent,
  isPausing = false,
}: ChatSendButtonProps) {
  const mode = getButtonMode(agentState, hasContent, isPausing);

  const handleClick = () => {
    if (mode === "send") handleSubmit();
    else if (mode === "stop") handleStop();
    else if (mode === "resume") handleResume();
  };

  const isActive = mode !== "disabled" && mode !== "loading";

  return (
    <button
      type="button"
      aria-label={
        mode === "stop"
          ? "Stop agent"
          : mode === "resume"
            ? "Resume agent"
            : "Send message"
      }
      className={cn(
        "flex size-7 items-center justify-center rounded-full transition-all duration-150",
        mode === "loading" && "cursor-default bg-white/[0.08]",
        mode === "disabled" && "cursor-not-allowed bg-white/[0.06] text-white/25",
        mode === "stop" &&
          "cursor-pointer bg-white text-black hover:bg-white/90 active:scale-[0.93]",
        mode === "send" &&
          "cursor-pointer bg-white text-black hover:bg-white/90 active:scale-[0.93]",
        mode === "resume" &&
          "cursor-pointer bg-white text-black hover:bg-white/90 active:scale-[0.93]",
        buttonClassName,
      )}
      data-testid="submit-button"
      onClick={handleClick}
      disabled={!isActive}
    >
      {mode === "loading" && (
        <div className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-white/15 border-t-white/50" />
      )}
      {mode === "send" && <IconArrowUp size={16} stroke={2.5} />}
      {mode === "stop" && <IconPlayerStopFilled size={10} />}
      {mode === "resume" && <IconPlayerPlayFilled size={10} />}
      {mode === "disabled" && <IconArrowUp size={16} stroke={2.5} />}
    </button>
  );
}
