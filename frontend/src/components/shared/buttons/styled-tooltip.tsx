import React, { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "#/components/ui/tooltip";
import { cn } from "#/lib/utils";

type TooltipPlacement = "top" | "right" | "bottom" | "left";

export interface StyledTooltipProps {
  children: ReactNode;
  content: string | ReactNode;
  tooltipClassName?: React.HTMLAttributes<HTMLDivElement>["className"];
  placement?: TooltipPlacement;
  /** @deprecated showArrow is kept for API compatibility but not used by shadcn/ui Tooltip */
  showArrow?: boolean;
}

export function StyledTooltip({
  children,
  content,
  tooltipClassName,
  placement = "right",
  showArrow,
}: StyledTooltipProps) {
  // Runtime deprecation warning for showArrow prop
  React.useEffect(() => {
    if (showArrow !== undefined && process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn(
        "[StyledTooltip] The 'showArrow' prop is deprecated and has no effect. shadcn/ui Tooltip does not support arrows.",
      );
    }
  }, [showArrow]);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex">{children}</div>
        </TooltipTrigger>
        <TooltipContent
          side={placement}
          className={cn("bg-white text-black", tooltipClassName)}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
