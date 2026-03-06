import { motion } from "framer-motion";
import {
  AgentRole,
  AGENT_DISPLAY_INFO,
} from "#/api/team-mode-service/team-mode-service.types";
import { cn } from "#/utils/utils";

interface TeamModeAgentIndicatorProps {
  role: AgentRole;
  isActive?: boolean;
  showDescription?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * Agent indicator with icon, name, and optional description
 */
export function TeamModeAgentIndicator({
  role,
  isActive = false,
  showDescription = false,
  size = "md",
}: TeamModeAgentIndicatorProps) {
  const info = AGENT_DISPLAY_INFO[role];

  const sizeClasses = {
    sm: "text-sm gap-1.5",
    md: "text-base gap-2",
    lg: "text-lg gap-3",
  };

  const iconSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className={cn("flex items-center", sizeClasses[size])}>
      {/* Agent icon with pulse animation when active */}
      <div className="relative">
        <span className={iconSizes[size]}>{info.icon}</span>
        {isActive && (
          <motion.div
            className="absolute -inset-1 rounded-full"
            style={{ backgroundColor: info.color }}
            animate={{
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </div>

      {/* Agent name and description */}
      <div className="flex flex-col">
        <span
          className={cn(
            "font-medium",
            isActive ? "text-foreground" : "text-default-600",
          )}
          style={{ color: isActive ? info.color : undefined }}
        >
          {info.name}
        </span>
        {showDescription && (
          <span className="text-xs text-default-400">{info.description}</span>
        )}
      </div>
    </div>
  );
}
