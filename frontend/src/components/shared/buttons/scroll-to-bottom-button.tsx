import { IconChevronDown } from "@tabler/icons-react";

interface ScrollToBottomButtonProps {
  onClick: () => void;
  unreadCount?: number;
}

export function ScrollToBottomButton({
  onClick,
  unreadCount = 0,
}: ScrollToBottomButtonProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        data-testid="scroll-to-bottom"
        aria-label="Scroll to latest messages"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/80 backdrop-blur-sm transition-all duration-150 hover:border-white/15 hover:bg-white/[0.1] hover:text-white"
      >
        <IconChevronDown size={20} stroke={2.5} />
      </button>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <div className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-[#0b0b0c] bg-rose-500 px-1.5">
          <span className="text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        </div>
      )}
    </div>
  );
}
