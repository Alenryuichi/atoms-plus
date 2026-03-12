import { ComponentType } from "react";
import { cn } from "#/utils/utils";

type ConversationTabNavProps = {
  tabValue: string;
  id?: string;
  icon: ComponentType<{ className: string }>;
  onClick(): void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  isActive?: boolean;
  label?: string;
  ariaLabel?: string;
  panelId?: string;
  className?: string;
};

export function ConversationTabNav({
  tabValue,
  id,
  icon: Icon,
  onClick,
  onKeyDown,
  isActive,
  label,
  ariaLabel,
  panelId,
  className,
}: ConversationTabNavProps) {
  return (
    <button
      id={id}
      type="button"
      onClick={() => {
        onClick();
      }}
      onKeyDown={onKeyDown}
      data-testid={`conversation-tab-${tabValue}`}
      role="tab"
      aria-selected={Boolean(isActive)}
      aria-label={ariaLabel ?? label}
      aria-controls={panelId}
      tabIndex={isActive ? 0 : -1}
      className={cn(
        "flex items-center gap-2 cursor-pointer px-2.5 py-2",
        "border-b border-transparent transition-all duration-150 ease-out",
        "text-white/45",
        isActive
          ? "border-white/20 text-white"
          : "hover:text-white/80",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15 focus-visible:ring-offset-0",
        className,
      )}
    >
      <Icon className={cn("w-4 h-4 text-inherit flex-shrink-0")} />
      {isActive && label && (
        <span className="text-sm font-medium whitespace-nowrap tracking-[-0.01em]">
          {label}
        </span>
      )}
    </button>
  );
}
