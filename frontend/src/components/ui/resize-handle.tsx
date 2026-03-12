import { cn } from "#/utils/utils";

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  className?: string;
}

export function ResizeHandle({ onMouseDown, className }: ResizeHandleProps) {
  return (
    <div
      className={cn(
        "relative w-2 bg-transparent cursor-ew-resize group",
        className,
      )}
      onMouseDown={onMouseDown}
    >
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/[0.06] transition-colors group-hover:bg-white/[0.14]" />

      {/* Larger hit area for easier dragging */}
      <div className="absolute inset-y-0 -left-2 -right-2" />
    </div>
  );
}
