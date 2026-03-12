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
        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-black/60 text-white/60 backdrop-blur-sm transition-all duration-150 hover:bg-black/80 hover:text-white/90 active:scale-95 shadow-lg"
      >
        <IconChevronDown size={16} stroke={2.5} />
      </button>

      {unreadCount > 0 && (
        <div className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1">
          <span className="text-[9px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        </div>
      )}
    </div>
  );
}
