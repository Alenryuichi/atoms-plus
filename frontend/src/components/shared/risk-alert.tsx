import { ReactNode } from "react";
import { IconAlertTriangle } from "@tabler/icons-react";
import { cn } from "#/utils/utils";

interface RiskAlertProps {
  className?: string;
  content: ReactNode;
  icon?: ReactNode;
  severity: "high" | "medium" | "low";
  title: string;
}

export function RiskAlert({
  className,
  content,
  severity,
  title,
}: RiskAlertProps) {
  // Currently, we are only supporting the high risk alert. If we use want to support other risk levels, we can add them here and use cva to create different variants of this component.
  if (severity === "high") {
    return (
      <div
        className={cn(
          "p-3 bg-red-500/5 border-2 border-red-500/40 rounded-lg",
          className,
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <IconAlertTriangle size={12} className="text-red-400" stroke={2} />
          <span className="text-xs text-red-400 uppercase tracking-wider font-medium">
            {title}
          </span>
        </div>
        <div className="text-sm text-white/80">{content}</div>
      </div>
    );
  }

  return null;
}
