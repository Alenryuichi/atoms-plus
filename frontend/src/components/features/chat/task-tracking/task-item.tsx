import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Circle, CheckCircle2, Loader2 } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/lib/utils";
import { Checkbox } from "#/components/ui/checkbox";

interface TaskItemProps {
  task: {
    id: string;
    title: string;
    status: "todo" | "in_progress" | "done";
    notes?: string;
  };
}

export function TaskItem({ task }: TaskItemProps) {
  const { t } = useTranslation();

  const statusIcon = useMemo(() => {
    switch (task.status) {
      case "todo":
        return <Circle className="h-4 w-4 text-muted-foreground" />;
      case "in_progress":
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case "done":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  }, [task.status]);

  const isDone = task.status === "done";
  const isInProgress = task.status === "in_progress";

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-3 py-2.5 transition-colors",
        "border-b border-border/30 last:border-b-0",
        isInProgress && "bg-primary/5",
        isDone && "opacity-60",
      )}
      data-name="task-item"
    >
      <div className="shrink-0 mt-0.5">
        <Checkbox
          checked={isDone}
          disabled
          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm text-foreground leading-tight",
            isDone && "line-through text-muted-foreground",
          )}
        >
          {task.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t(I18nKey.TASK_TRACKING_OBSERVATION$TASK_ID)}: {task.id}
        </p>
        {task.notes && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {t(I18nKey.TASK_TRACKING_OBSERVATION$TASK_NOTES)}: {task.notes}
          </p>
        )}
      </div>
      <div className="shrink-0">{statusIcon}</div>
    </div>
  );
}
