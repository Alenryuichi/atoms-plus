import React from "react";
import { DragOver } from "../drag-over";
import { UploadedFiles } from "../uploaded-files";
import { ChatInputRow } from "./chat-input-row";
import { ChatInputActions } from "./chat-input-actions";
import { SlashCommandMenu } from "./slash-command-menu";
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
  return (
    <div
      ref={chatContainerRef}
      className={cn(
        "relative flex w-full flex-col items-start justify-center rounded-[24px] border border-white/10 bg-black/20 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-xl transition-all duration-200 ease-out",
        "focus-within:border-white/20 focus-within:bg-black/25",
        disabled && "opacity-80",
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

      <div className="mt-1 w-full border-t border-white/[0.06] px-1 pt-2">
        <ChatInputActions
          disabled={disabled}
          handleResumeAgent={handleResumeAgent}
        />
      </div>
    </div>
  );
}
