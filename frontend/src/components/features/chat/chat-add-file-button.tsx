import { IconPaperclip } from "@tabler/icons-react";
import { cn } from "#/utils/utils";

export interface ChatAddFileButtonProps {
  handleFileIconClick: () => void;
  disabled?: boolean;
}

export function ChatAddFileButton({
  handleFileIconClick,
  disabled = false,
}: ChatAddFileButtonProps) {
  return (
    <button
      type="button"
      aria-label="Add files"
      className={cn(
        "relative shrink-0 flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/70 backdrop-blur-sm transition-all duration-150",
        !disabled &&
          "hover:border-white/15 hover:bg-white/[0.07] hover:text-white active:scale-[0.98]",
        disabled && "opacity-40 cursor-not-allowed",
        !disabled && "cursor-pointer",
      )}
      data-name="Shape"
      data-testid="paperclip-icon"
      onClick={handleFileIconClick}
      disabled={disabled}
    >
      <IconPaperclip
        size={16}
        stroke={1.5}
        color={disabled ? "#6b7280" : "currentColor"}
      />
    </button>
  );
}
