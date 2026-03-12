import React from "react";
import { cn } from "#/utils/utils";
import { ChangeAgentButton } from "../change-agent-button";
import { ChatAddFileButton } from "../chat-add-file-button";
import { ChatSendButton } from "../chat-send-button";
import { AgentState } from "#/types/agent-state";

interface ChatInputActionsProps {
  disabled: boolean;
  showButton: boolean;
  buttonClassName: string;
  handleFileIconClick: (isDisabled: boolean) => void;
  handleSubmit: () => void;
  handleStop: () => void;
  handleResume: () => void;
  agentState: AgentState;
  hasContent: boolean;
  isPausing: boolean;
}

export function ChatInputActions({
  disabled,
  showButton,
  buttonClassName,
  handleFileIconClick,
  handleSubmit,
  handleStop,
  handleResume,
  agentState,
  hasContent,
  isPausing,
}: ChatInputActionsProps) {
  return (
    <div className="w-full flex items-center justify-between">
      <div className="flex items-center text-white/65">
        <ChangeAgentButton />
      </div>
      <div className="flex items-center gap-1">
        <ChatAddFileButton
          disabled={disabled}
          handleFileIconClick={() => handleFileIconClick(disabled)}
        />
        {showButton && (
          <ChatSendButton
            buttonClassName={cn(buttonClassName)}
            handleSubmit={handleSubmit}
            handleStop={handleStop}
            handleResume={handleResume}
            agentState={agentState}
            hasContent={hasContent}
            isPausing={isPausing}
          />
        )}
      </div>
    </div>
  );
}
