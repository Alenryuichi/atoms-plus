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
        "shrink-0 flex size-7 items-center justify-center rounded-md text-white/50 transition-colors duration-150",
        !disabled && "hover:text-white/80 cursor-pointer active:scale-[0.95]",
        disabled && "opacity-40 cursor-not-allowed",
      )}
      data-testid="paperclip-icon"
      onClick={handleFileIconClick}
      disabled={disabled}
    >
      <IconPaperclip size={16} stroke={1.5} />
    </button>
  );
}
