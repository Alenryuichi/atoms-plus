import React from "react";
import { DragOver } from "../drag-over";
import { UploadedFiles } from "../uploaded-files";
import { ChatInputRow } from "./chat-input-row";
import { ChatInputActions } from "./chat-input-actions";
import { SlashCommandMenu } from "./slash-command-menu";
import { useConversationStore } from "#/stores/conversation-store";
import { cn } from "#/lib/utils";
import { SlashCommandItem } from "#/hooks/chat/use-slash-command";

interface ChatInputContainerProps {
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  isDragOver: boolean;
  disabled: boolean;
  showButton: boolean;
  buttonClassName: string;
  chatInputRef: React.RefObject<HTMLDivElement | null>;
  handleFileIconClick: (isDisabled: boolean) => void;
  handleSubmit: () => void;
  handleResumeAgent: () => void;
  onDragOver: (e: React.DragEvent, isDisabled: boolean) => void;
  onDragLeave: (e: React.DragEvent, isDisabled: boolean) => void;
  onDrop: (e: React.DragEvent, isDisabled: boolean) => void;
  onInput: () => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  isSlashMenuOpen?: boolean;
  slashItems?: SlashCommandItem[];
  slashSelectedIndex?: number;
  onSlashSelect?: (item: SlashCommandItem) => void;
}

export function ChatInputContainer({
  chatContainerRef,
  isDragOver,
  disabled,
  showButton,
  buttonClassName,
  chatInputRef,
  handleFileIconClick,
  handleSubmit,
  handleResumeAgent,
  onDragOver,
  onDragLeave,
  onDrop,
  onInput,
  onPaste,
  onKeyDown,
  onFocus,
  onBlur,
  isSlashMenuOpen = false,
  slashItems = [],
  slashSelectedIndex = 0,
  onSlashSelect,
}: ChatInputContainerProps) {
  const conversationMode = useConversationStore(
    (state) => state.conversationMode,
  );

  return (
    <div
      ref={chatContainerRef}
      className={cn(
        // Atoms Plus: Clean airy input box - matching reference
        "bg-white/[0.03] backdrop-blur-xl",
        "border border-white/10",
        "flex flex-col items-start justify-center",
        "p-2 px-3 relative rounded-2xl w-full",
        "transition-all duration-300 ease-out shadow-sm",
        // Focus state
        "focus-within:border-white/20 focus-within:bg-white/[0.05] focus-within:shadow-md",
      )}
      onDragOver={(e) => onDragOver(e, disabled)}
      onDragLeave={(e) => onDragLeave(e, disabled)}
      onDrop={(e) => onDrop(e, disabled)}
    >
      {/* Drag Over UI */}
      {isDragOver && <DragOver />}

      <UploadedFiles />

      {/* Wrapper so the slash menu anchors just above the input row */}
      <div className="relative w-full">
        {isSlashMenuOpen && onSlashSelect && (
          <SlashCommandMenu
            items={slashItems}
            selectedIndex={slashSelectedIndex}
            onSelect={onSlashSelect}
          />
        )}

        <ChatInputRow
          chatInputRef={chatInputRef}
          disabled={disabled}
          showButton={showButton}
          buttonClassName={buttonClassName}
          handleFileIconClick={handleFileIconClick}
          handleSubmit={handleSubmit}
          onInput={onInput}
          onPaste={onPaste}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>

      {/* Action Bar - moved inside or adjusted for layout */}
      <div className="w-full flex items-center justify-between pb-1 px-1 mt-[-8px]">
        <ChatInputActions
          disabled={disabled}
          handleResumeAgent={handleResumeAgent}
        />
      </div>
    </div>
  );
}
