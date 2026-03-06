import { IconArrowUp } from "@tabler/icons-react";
import { cn } from "#/utils/utils";

export interface ChatSendButtonProps {
  buttonClassName: string;
  handleSubmit: () => void;
  disabled: boolean;
}

export function ChatSendButton({
  buttonClassName,
  handleSubmit,
  disabled,
}: ChatSendButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        // Atoms Plus: Premium amber gradient send button
        "flex items-center justify-center rounded-full size-9",
        "transition-all duration-200",
        disabled
          ? // Disabled: subtle glass effect
            "bg-black/30 border border-white/10 cursor-not-allowed"
          : // Active: amber gradient with glow
            cn(
              "bg-gradient-to-br from-amber-500 to-amber-600",
              "border border-amber-400/50",
              "shadow-[0_0_16px_rgba(212,168,85,0.3)]",
              "hover:from-amber-400 hover:to-amber-500",
              "hover:shadow-[0_0_20px_rgba(212,168,85,0.5)]",
              "hover:scale-105 active:scale-95",
              "cursor-pointer",
            ),
        buttonClassName,
      )}
      data-name="arrow-up-circle-fill"
      data-testid="submit-button"
      onClick={handleSubmit}
      disabled={disabled}
    >
      <IconArrowUp
        size={20}
        stroke={2.5}
        color={disabled ? "#6b7280" : "#1a1a1a"}
      />
    </button>
  );
}
