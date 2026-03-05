import { cn } from "#/utils/utils";

interface LoadingSpinnerProps {
  size: "small" | "large";
}

export function LoadingSpinner({ size }: LoadingSpinnerProps) {
  const sizeStyle =
    size === "small" ? "w-6 h-6" : "w-12 h-12";
  const borderWidth = size === "small" ? "border-2" : "border-4";

  return (
    <div data-testid="loading-spinner" className={cn("relative", sizeStyle)}>
      {/* Atoms Plus: Amber-themed loading spinner */}
      <div
        className={cn(
          "rounded-full absolute inset-0",
          borderWidth,
          "border-amber-500/20",
        )}
      />
      <div
        className={cn(
          "rounded-full absolute inset-0 animate-spin",
          borderWidth,
          "border-transparent border-t-amber-500 border-r-amber-500/50",
        )}
      />
    </div>
  );
}
