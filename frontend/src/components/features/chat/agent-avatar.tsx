import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { cn } from "#/lib/utils";

interface AgentAvatarProps {
  name?: string;
  role?: "Coder" | "Planner" | "Designer" | "Reviewer";
  imageUrl?: string;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
  className?: string;
}

// Atoms Plus: Dark theme role colors matching atoms.dev
const roleColors: Record<string, string> = {
  Coder: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
  Planner: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  Designer: "bg-pink-500/20 text-pink-300 border border-pink-500/30",
  Reviewer: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
};

// Atoms Plus: Avatar gradient backgrounds (neutral, professional dark gradients)
const roleGradients: Record<string, string> = {
  Coder: "bg-gradient-to-br from-slate-600 to-slate-700",
  Planner: "bg-gradient-to-br from-zinc-600 to-zinc-700",
  Designer: "bg-gradient-to-br from-stone-600 to-stone-700",
  Reviewer: "bg-gradient-to-br from-amber-600/80 to-amber-700/80",
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
  size = "sm",
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
    <div className={cn("flex items-center gap-2", className)}>
      {/* Atoms Plus: Circular avatar with subtle border */}
      <Avatar
        className={cn(sizeClasses[size], "border border-white/10 ring-0")}
      >
        {imageUrl && <AvatarImage src={imageUrl} alt={name} />}
        <AvatarFallback
          className={cn(
            roleGradients[role] || "bg-slate-700",
            "text-white font-medium text-[10px]",
          )}
        >
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-white/90">{name}</span>
        {showBadge && (
          <>
            <span className="text-[10px] text-white/30">|</span>
            <span className="text-[10px] font-medium text-white/50">
              {role}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
