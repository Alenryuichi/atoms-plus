import React from "react";
import { cn } from "#/utils/utils";
import { ChatAddFileButton } from "../chat-add-file-button";
import { ChatSendButton } from "../chat-send-button";
import { ChatInputField } from "./chat-input-field";

interface ChatInputRowProps {
  chatInputRef: React.RefObject<HTMLDivElement | null>;
  disabled: boolean;
  showButton: boolean;
  buttonClassName: string;
  handleFileIconClick: (isDisabled: boolean) => void;
  handleSubmit: () => void;
  onInput: () => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function ChatInputRow({
  chatInputRef,
  disabled,
  showButton,
  buttonClassName,
  handleFileIconClick,
  handleSubmit,
  onInput,
  onPaste,
  onKeyDown,
  onFocus,
  onBlur,
}: ChatInputRowProps) {
  return (
    <div className="relative flex w-full shrink-0 flex-row items-end justify-between gap-3 pb-2">
      <div className="basis-0 relative flex min-h-px min-w-px grow flex-row items-end justify-start gap-3">
        <ChatAddFileButton
          disabled={disabled}
          handleFileIconClick={() => handleFileIconClick(disabled)}
        />

        <ChatInputField
          chatInputRef={chatInputRef}
          disabled={disabled}
          onInput={onInput}
          onPaste={onPaste}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>

      {/* Send Button */}
      {showButton && (
        <ChatSendButton
          buttonClassName={cn(buttonClassName, "translate-y-0")}
          handleSubmit={handleSubmit}
          disabled={disabled}
        />
      )}
    </div>
  );
}
