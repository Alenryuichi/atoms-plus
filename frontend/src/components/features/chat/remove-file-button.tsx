import { IconX } from "@tabler/icons-react";
import { cn, isMobileDevice } from "#/utils/utils";

interface RemoveFileButtonProps {
  onClick: () => void;
}

export function RemoveFileButton({ onClick }: RemoveFileButtonProps) {
  const isMobile = isMobileDevice();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-7 h-7 rounded-md bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-all",
        "opacity-0 group-hover:opacity-100",
        isMobile && "opacity-100",
      )}
    >
      <IconX size={14} stroke={2} />
    </button>
  );
}
