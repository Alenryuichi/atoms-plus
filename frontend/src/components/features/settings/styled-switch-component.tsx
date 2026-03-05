import { cn } from "#/utils/utils";

interface StyledSwitchComponentProps {
  isToggled: boolean;
}

export function StyledSwitchComponent({
  isToggled,
}: StyledSwitchComponentProps) {
  return (
    <div
      className={cn(
        "w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-all duration-300",
        isToggled &&
          "justify-end bg-gradient-to-r from-amber-600 to-amber-500 shadow-lg shadow-amber-500/30",
        !isToggled && "justify-start bg-neutral-800 border border-white/10",
      )}
    >
      <div
        className={cn(
          "w-4 h-4 rounded-full transition-all duration-300",
          isToggled ? "bg-white shadow-md" : "bg-neutral-500",
        )}
      />
    </div>
  );
}
