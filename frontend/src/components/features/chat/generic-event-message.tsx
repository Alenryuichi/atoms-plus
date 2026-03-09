import React from "react";
import {
  IconChevronRight,
  IconCheck,
  IconLoader2,
  IconClock,
} from "@tabler/icons-react";
import { ObservationResultStatus } from "./event-content-helpers/get-observation-result";
import { MarkdownRenderer } from "../markdown/markdown-renderer";
import { cn } from "#/lib/utils";

interface GenericEventMessageProps {
  title: React.ReactNode;
  details: string | React.ReactNode;
  success?: ObservationResultStatus;
  initiallyExpanded?: boolean;
}

export function GenericEventMessage({
  title,
  details,
  success,
  initiallyExpanded = false,
}: GenericEventMessageProps) {
  const [showDetails, setShowDetails] = React.useState(initiallyExpanded);

  return (
    <div className="w-full flex flex-col mb-3 group/event">
      {/* Atoms Plus: Sleek horizontal bar for actions/thoughts */}
      <button
        type="button"
        onClick={() => details && setShowDetails((prev) => !prev)}
        className={cn(
          "flex items-center justify-between w-full py-2.5 px-3 rounded-lg transition-all",
          "border-l-2 border-white/10 hover:bg-white/[0.03]",
          details ? "cursor-pointer" : "cursor-default",
          showDetails && "bg-white/[0.02] border-l-amber-500/50",
        )}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Chevron indicator */}
          {details && (
            <div
              className={cn(
                "transition-transform duration-200 text-white/30",
                showDetails ? "rotate-90" : "rotate-0",
              )}
            >
              <IconChevronRight size={14} />
            </div>
          )}

          <span className="text-[13px] font-medium text-white/70 whitespace-nowrap overflow-hidden text-ellipsis">
            {title}
          </span>
        </div>

        {/* Status Indicator on the right */}
        <div className="flex items-center pl-2">
          {success === "success" && (
            <IconCheck size={16} className="text-emerald-500" stroke={2.5} />
          )}
          {success === "timeout" && (
            <IconClock size={16} className="text-amber-500" />
          )}
          {!success && (
            <IconLoader2 size={14} className="text-white/20 animate-spin" />
          )}
        </div>
      </button>

      {/* Expanded Details */}
      {showDetails && details && (
        <div className="mt-2 ml-6 pl-4 border-l border-white/5 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="text-[12px] leading-relaxed text-white/50 bg-white/[0.01] p-3 rounded-md">
            {typeof details === "string" ? (
              <MarkdownRenderer>{details}</MarkdownRenderer>
            ) : (
              details
            )}
          </div>
        </div>
      )}
    </div>
  );
}
