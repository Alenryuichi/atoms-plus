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
      aria-label="Send message"
      className={cn(
        "flex size-10 items-center justify-center rounded-full transition-all duration-150",
        disabled
          ? "cursor-not-allowed border border-white/10 bg-white/[0.06] text-white/35"
          : cn(
              "cursor-pointer bg-white text-black shadow-[0_10px_30px_-16px_rgba(255,255,255,0.8)]",
              "hover:bg-white/90 active:scale-[0.98]",
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
        color={disabled ? "#6b7280" : "#0b0b0c"}
      />
    </button>
  );
}
