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
        className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 border border-amber-400/30 flex items-center justify-center text-white shadow-sm transition-colors"
      >
        <IconChevronDown size={20} stroke={2.5} />
      </button>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 border-2 border-neutral-900 flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        </div>
      )}
    </div>
  );
}
