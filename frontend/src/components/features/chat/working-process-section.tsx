import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  IconChevronDown,
  IconCheck,
  IconCircle,
  IconLoader2,
} from "@tabler/icons-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "#/components/ui/collapsible";
import { cn } from "#/lib/utils";

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
  todo: <IconCircle size={14} className="text-white/30" />,
  in_progress: (
    <IconLoader2 size={14} className="text-amber-500 animate-spin" />
  ),
  done: <IconCheck size={14} className="text-emerald-500" />,
};

export function WorkingProcessSection({
  title,
  tasks,
  onEditPlans,
  onApprove,
  defaultOpen = false,
  className,
}: WorkingProcessSectionProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const completedCount = tasks.filter((task) => task.status === "done").length;

  const displayTitle = `Processed ${completedCount} ${completedCount === 1 ? "step" : "steps"}`;

  return (
    <div className={cn("w-full mb-4", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 px-1 py-1 hover:bg-white/5 rounded-md transition-colors group cursor-pointer">
          <div
            className={cn(
              "transition-transform duration-200",
              isOpen ? "rotate-0" : "-rotate-90",
            )}
          >
            <IconChevronDown
              size={14}
              className="text-white/40 group-hover:text-white/70"
            />
          </div>

          <div className="flex items-center gap-2">
            {completedCount === tasks.length && tasks.length > 0 ? (
              <IconCheck size={14} className="text-emerald-500" />
            ) : (
              <IconLoader2 size={14} className="text-amber-500 animate-spin" />
            )}
            <span className="text-[13px] font-medium text-white/60 group-hover:text-white/80 transition-colors">
              {displayTitle}
            </span>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="mt-2 ml-4 pl-4 border-l border-white/10 space-y-2.5">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 group/task">
                <div className="mt-0.5 shrink-0">
                  {statusIcons[task.status]}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-[12px] leading-tight",
                      task.status === "done"
                        ? "text-white/40"
                        : "text-white/80",
                    )}
                  >
                    {task.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
