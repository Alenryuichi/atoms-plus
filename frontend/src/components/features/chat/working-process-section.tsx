import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, Check, Circle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "#/components/ui/card";
import { Checkbox } from "#/components/ui/checkbox";
import { Button } from "#/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "#/components/ui/collapsible";
import { cn } from "#/lib/utils";
import { I18nKey } from "#/i18n/declaration";

interface WorkingProcessTask {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  notes?: string;
}

interface WorkingProcessSectionProps {
  title?: string;
  tasks: WorkingProcessTask[];
  onEditPlans?: () => void;
  onApprove?: () => void;
  defaultOpen?: boolean;
  className?: string;
}

// Atoms Plus: Dark theme status icons
const statusIcons = {
  todo: <Circle className="h-4 w-4 text-[var(--atoms-text-muted)]" />,
  in_progress: (
    <Loader2 className="h-4 w-4 text-[var(--atoms-accent-primary)] animate-spin" />
  ),
  done: <Check className="h-4 w-4 text-[var(--atoms-success)]" />,
};

export function WorkingProcessSection({
  title,
  tasks,
  onEditPlans,
  onApprove,
  defaultOpen = true,
  className,
}: WorkingProcessSectionProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const completedCount = tasks.filter((task) => task.status === "done").length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const displayTitle = title || t(I18nKey.COMMON$WORKING_PROCESS);

  return (
    // Atoms Plus: Dark card styling matching atoms.dev
    <Card
      className={cn(
        "bg-[var(--atoms-bg-card)] border-[var(--atoms-border)] rounded-xl",
        className,
      )}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="p-4 pb-2">
          <CollapsibleTrigger className="flex items-center justify-between w-full group cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-[var(--atoms-text-primary)]">
                {displayTitle}
              </span>
              <span className="text-xs text-[var(--atoms-text-muted)] bg-[var(--atoms-bg-elevated)] px-2 py-0.5 rounded-full">
                {completedCount}/{tasks.length} {t(I18nKey.COMMON$COMPLETED)}
              </span>
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-[var(--atoms-text-muted)] group-hover:text-[var(--atoms-text-primary)] transition-colors" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[var(--atoms-text-muted)] group-hover:text-[var(--atoms-text-primary)] transition-colors" />
            )}
          </CollapsibleTrigger>
          {/* Atoms Plus: Gradient progress bar */}
          <div className="mt-3 h-1 w-full bg-[var(--atoms-bg-elevated)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--atoms-accent-primary)] to-[var(--atoms-accent-secondary)] transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="p-4 pt-2 space-y-3">
            {/* Atoms Plus: Task list with bullet styling */}
            <div className="space-y-1">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-start gap-3 p-2 rounded-lg transition-all duration-200",
                    task.status === "done" && "opacity-50",
                    task.status === "in_progress" &&
                      "bg-[var(--atoms-accent-primary)]/5 border-l-2 border-[var(--atoms-accent-primary)]",
                  )}
                >
                  <div className="mt-0.5">
                    <Checkbox
                      checked={task.status === "done"}
                      disabled
                      className="border-[var(--atoms-border)] data-[state=checked]:bg-[var(--atoms-accent-primary)] data-[state=checked]:border-[var(--atoms-accent-primary)]"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm text-[var(--atoms-text-primary)]",
                        task.status === "done" &&
                          "line-through text-[var(--atoms-text-muted)]",
                      )}
                    >
                      {task.title}
                    </p>
                    {task.notes && (
                      <p className="text-xs text-[var(--atoms-text-muted)] mt-0.5">
                        {task.notes}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">{statusIcons[task.status]}</div>
                </div>
              ))}
            </div>

            {/* Atoms Plus: Action buttons with accent styling */}
            {(onEditPlans || onApprove) && (
              <div className="flex items-center gap-2 pt-3 border-t border-[var(--atoms-border)]">
                {onEditPlans && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEditPlans}
                    className="text-xs border-[var(--atoms-border)] text-[var(--atoms-text-secondary)] hover:bg-[var(--atoms-bg-elevated)] hover:text-[var(--atoms-text-primary)]"
                  >
                    {t(I18nKey.COMMON$EDIT_PLANS)}
                  </Button>
                )}
                {onApprove && (
                  <Button
                    size="sm"
                    onClick={onApprove}
                    className="text-xs bg-[var(--atoms-accent-primary)] hover:bg-[var(--atoms-accent-primary)]/90 text-white"
                  >
                    {t(I18nKey.COMMON$APPROVE)}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
