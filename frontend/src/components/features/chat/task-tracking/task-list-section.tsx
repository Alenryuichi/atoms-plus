import { useTranslation } from "react-i18next";
import { ListTodo } from "lucide-react";
import { TaskItem } from "./task-item";
import { I18nKey } from "#/i18n/declaration";
import { Card, CardContent, CardHeader } from "#/components/ui/card";
import { cn } from "#/lib/utils";

interface TaskListSectionProps {
  taskList: Array<{
    id: string;
    title: string;
    status: "todo" | "in_progress" | "done";
    notes?: string;
  }>;
  className?: string;
}

export function TaskListSection({ taskList, className }: TaskListSectionProps) {
  const { t } = useTranslation();
  const completedCount = taskList.filter(
    (task) => task.status === "done",
  ).length;

  return (
    <Card
      className={cn("border-border/50 shadow-card overflow-hidden", className)}
    >
      {/* Header */}
      <CardHeader className="p-3 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {t(I18nKey.COMMON$TASKS)}
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            {completedCount}/{taskList.length}
          </span>
        </div>
      </CardHeader>

      {/* Task Items */}
      <CardContent className="p-0">
        {taskList.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </CardContent>
    </Card>
  );
}
