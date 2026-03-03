import { ComponentType } from "react";
import { cn } from "#/utils/utils";

type ConversationTabNavProps = {
  tabValue: string;
  icon: ComponentType<{ className: string }>;
  onClick(): void;
  isActive?: boolean;
  label?: string;
  className?: string;
};

export function ConversationTabNav({
  tabValue,
  icon: Icon,
  onClick,
  isActive,
  label,
  className,
}: ConversationTabNavProps) {
  return (
    <button
      type="button"
      onClick={() => {
        onClick();
      }}
      data-testid={`conversation-tab-${tabValue}`}
      className={cn(
        // Base styles - cleaner modern look matching reference
        "flex items-center gap-2 rounded-lg cursor-pointer",
        "px-3 py-1.5",
        "transition-all duration-200 ease-in-out",
        // Inactive state
        "text-muted-foreground bg-transparent",
        // Active state - subtle primary accent
        isActive && "bg-primary/10 text-primary shadow-sm",
        // Hover states
        isActive
          ? "hover:bg-primary/15"
          : "hover:bg-accent hover:text-accent-foreground",
        // Focus states
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        className,
      )}
    >
      <Icon className={cn("w-4 h-4 text-inherit flex-shrink-0")} />
      {isActive && label && (
        <span className="text-sm font-medium whitespace-nowrap">{label}</span>
      )}
    </button>
  );
}
