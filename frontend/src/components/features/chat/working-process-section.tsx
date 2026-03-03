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

const statusIcons = {
  todo: <Circle className="h-4 w-4 text-muted-foreground" />,
  in_progress: <Loader2 className="h-4 w-4 text-primary animate-spin" />,
  done: <Check className="h-4 w-4 text-green-500" />,
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
    <Card className={cn("border-border/50 shadow-card", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="p-4 pb-2">
          <CollapsibleTrigger className="flex items-center justify-between w-full group">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">
                {displayTitle}
              </span>
              <span className="text-xs text-muted-foreground">
                {completedCount}/{tasks.length} {t(I18nKey.COMMON$COMPLETED)}
              </span>
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            )}
          </CollapsibleTrigger>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="p-4 pt-2 space-y-3">
            {/* Task list */}
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-start gap-3 p-2 rounded-lg transition-colors",
                    task.status === "done" && "opacity-60",
                    task.status === "in_progress" && "bg-primary/5",
                  )}
                >
                  <div className="mt-0.5">
                    <Checkbox
                      checked={task.status === "done"}
                      disabled
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm text-foreground",
                        task.status === "done" && "line-through",
                      )}
                    >
                      {task.title}
                    </p>
                    {task.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {task.notes}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">{statusIcons[task.status]}</div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            {(onEditPlans || onApprove) && (
              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                {onEditPlans && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEditPlans}
                    className="text-xs"
                  >
                    {t(I18nKey.COMMON$EDIT_PLANS)}
                  </Button>
                )}
                {onApprove && (
                  <Button
                    size="sm"
                    onClick={onApprove}
                    className="text-xs bg-primary hover:bg-primary/90"
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
