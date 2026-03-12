import React from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { useConversationStore } from "#/stores/conversation-store";

interface ChatInputFieldProps {
  chatInputRef: React.RefObject<HTMLDivElement | null>;
  disabled: boolean;
  onInput: () => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function ChatInputField({
  chatInputRef,
  disabled,
  onInput,
  onPaste,
  onKeyDown,
  onFocus,
  onBlur,
}: ChatInputFieldProps) {
  const { t } = useTranslation();

  const conversationMode = useConversationStore(
    (state) => state.conversationMode,
  );

  const isPlanMode = conversationMode === "plan";

  return (
    <div
      className="box-border content-stretch flex flex-row items-center justify-start min-h-6 p-0 relative shrink-0 flex-1"
      data-name="Text & caret"
    >
      <div className="basis-0 flex flex-col grow justify-center leading-[0] min-h-px min-w-px overflow-ellipsis overflow-hidden relative shrink-0 text-left">
        <div
          ref={chatInputRef}
          className="chat-input custom-scrollbar block min-h-[24px] max-h-[400px] whitespace-pre-wrap bg-transparent text-[15px] font-normal leading-6 text-white/90 caret-white [text-overflow:inherit] [text-wrap-mode:inherit] [white-space-collapse:inherit] data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50"
          contentEditable={!disabled}
          role="textbox"
          tabIndex={disabled ? -1 : 0}
          aria-label={
            isPlanMode
              ? t(I18nKey.COMMON$LET_S_WORK_ON_A_PLAN)
              : t(I18nKey.SUGGESTIONS$WHAT_TO_BUILD)
          }
          aria-disabled={disabled}
          aria-multiline="true"
          data-placeholder={
            isPlanMode
              ? t(I18nKey.COMMON$LET_S_WORK_ON_A_PLAN)
              : t(I18nKey.SUGGESTIONS$WHAT_TO_BUILD)
          }
          data-disabled={disabled}
          data-testid="chat-input"
          onInput={onInput}
          onPaste={onPaste}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>
    </div>
  );
}
