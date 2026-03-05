import { cn } from "#/utils/utils";

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  className?: string;
}

export function ResizeHandle({ onMouseDown, className }: ResizeHandleProps) {
  return (
    <div
      className={cn(
        // Atoms Plus: Subtle resize handle between glass cards
        "relative w-2 bg-transparent cursor-ew-resize group",
        className,
      )}
      onMouseDown={onMouseDown}
    >
      {/* Visual indicator - amber on hover */}
      <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/5 group-hover:bg-amber-500/40 transition-colors rounded-full" />

      {/* Larger hit area for easier dragging */}
      <div className="absolute inset-y-0 -left-2 -right-2" />
    </div>
  );
}
