import { Paperclip } from "lucide-react";
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
      className={cn(
        // Atoms Plus: Refined glass circle button
        "relative shrink-0 size-9 rounded-full",
        "flex items-center justify-center",
        "bg-black/30 backdrop-blur-sm",
        "border border-white/10",
        "transition-all duration-200",
        // Hover effects
        !disabled && "hover:border-amber-500/40 hover:bg-black/50",
        !disabled && "hover:shadow-[0_0_12px_rgba(212,168,85,0.15)]",
        !disabled && "hover:scale-105 active:scale-95",
        // Disabled state
        disabled && "opacity-40 cursor-not-allowed",
        !disabled && "cursor-pointer",
      )}
      data-name="Shape"
      data-testid="paperclip-icon"
      onClick={handleFileIconClick}
      disabled={disabled}
    >
      <Paperclip
        className="w-4 h-4"
        strokeWidth={1.5}
        color={disabled ? "#6b7280" : "#d4a855"}
      />
    </button>
  );
}
