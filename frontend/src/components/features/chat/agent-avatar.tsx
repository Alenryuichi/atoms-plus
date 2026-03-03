import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { cn } from "#/lib/utils";

interface AgentAvatarProps {
  name?: string;
  role?: "Coder" | "Planner" | "Designer" | "Reviewer";
  imageUrl?: string;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
  className?: string;
}

const roleColors: Record<string, string> = {
  Coder:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  Planner:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  Designer: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  Reviewer:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

export function AgentAvatar({
  name = "Agent",
  role = "Coder",
  imageUrl,
  size = "md",
  showBadge = true,
  className,
}: AgentAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Avatar className={cn(sizeClasses[size], "border-2 border-primary/20")}>
        {imageUrl && <AvatarImage src={imageUrl} alt={name} />}
        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-foreground">{name}</span>
        {showBadge && (
          <Badge
            variant="secondary"
            className={cn(
              "text-xs px-2 py-0.5 font-medium w-fit",
              roleColors[role],
            )}
          >
            {role}
          </Badge>
        )}
      </div>
    </div>
  );
}
