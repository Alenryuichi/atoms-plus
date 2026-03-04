import React, { ReactElement } from "react";
import { Button } from "#/components/ui/button";

export interface IconButtonProps {
  icon: ReactElement;
  onClick: () => void;
  ariaLabel: string;
  testId?: string;
}

export function IconButton({
  icon,
  onClick,
  ariaLabel,
  testId = "",
}: IconButtonProps): React.ReactElement {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="cursor-pointer text-[12px] bg-transparent aspect-square px-0 min-w-[20px] h-[20px]"
      aria-label={ariaLabel}
      data-testid={testId}
    >
      {icon}
    </Button>
  );
}
