/**
 * Auto Role Indicator - 自动角色指示器
 *
 * 显示当前自动检测到的角色，无需用户手动切换
 * 系统根据用户输入自动选择最佳角色
 */

import { useState, useEffect, useCallback } from "react";
import { cn } from "#/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "#/components/ui/tooltip";
import type { AutoDetectResponse } from "#/api/role-service/role-service.types";
import { autoDetectRole } from "#/api/role-service/role-service.api";

interface AutoRoleIndicatorProps {
  /** 当前用户输入（用于检测角色） */
  userInput?: string;
  /** 角色变更回调 */
  onRoleChange?: (role: AutoDetectResponse) => void;
  /** 自定义样式 */
  className?: string;
  /** 是否显示详细信息 */
  showDetails?: boolean;
  /** 检测延迟（毫秒） */
  debounceMs?: number;
}

// 角色颜色映射
const roleColors: Record<string, string> = {
  engineer: "from-indigo-500 to-blue-600",
  architect: "from-purple-500 to-violet-600",
  product_manager: "from-pink-500 to-rose-600",
  data_analyst: "from-cyan-500 to-teal-600",
  deep_researcher: "from-emerald-500 to-green-600",
  project_manager: "from-amber-500 to-orange-600",
  seo_specialist: "from-yellow-500 to-lime-600",
  team_leader: "from-red-500 to-pink-600",
};

// 默认角色状态
const DEFAULT_ROLE: AutoDetectResponse = {
  role_id: "engineer",
  role_name: "Bob",
  role_title: "Software Engineer",
  avatar: "💻",
  confidence: 1.0,
  matched_keywords: [],
  reason: "Default role",
  system_prompt: "",
};

export function AutoRoleIndicator({
  userInput,
  onRoleChange,
  className,
  showDetails = false,
  debounceMs = 500,
}: AutoRoleIndicatorProps) {
  const [currentRole, setCurrentRole] =
    useState<AutoDetectResponse>(DEFAULT_ROLE);
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastInput, setLastInput] = useState("");

  // 防抖检测角色
  const detectRole = useCallback(
    async (input: string) => {
      if (!input || input.trim().length < 5) return;
      if (input === lastInput) return;

      setIsDetecting(true);
      setLastInput(input);

      try {
        const result = await autoDetectRole(input);
        setCurrentRole(result);
        onRoleChange?.(result);
      } catch {
        // 保持当前角色，静默失败
      } finally {
        setIsDetecting(false);
      }
    },
    [lastInput, onRoleChange],
  );

  // 防抖处理用户输入
  useEffect(() => {
    if (!userInput) return undefined;

    const timer = setTimeout(() => {
      detectRole(userInput);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [userInput, debounceMs, detectRole]);

  const gradientClass = roleColors[currentRole.role_id] || roleColors.engineer;

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full cursor-default",
              "bg-gradient-to-r",
              gradientClass,
              "text-white text-sm font-medium",
              "shadow-lg shadow-black/20",
              "transition-all duration-300",
              isDetecting && "opacity-70 animate-pulse",
              className,
            )}
          >
            <span className="text-lg">{currentRole.avatar}</span>
            {showDetails ? (
              <div className="flex flex-col">
                <span className="text-xs font-bold">
                  {currentRole.role_name}
                </span>
                <span className="text-[10px] opacity-80">
                  {currentRole.role_title}
                </span>
              </div>
            ) : (
              <span>{currentRole.role_name}</span>
            )}
            {isDetecting && (
              <span className="w-2 h-2 bg-white rounded-full animate-ping" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm p-1">
            <div className="font-medium">
              {currentRole.role_name} - {currentRole.role_title}
            </div>
            <div className="text-xs opacity-75 mt-1">{currentRole.reason}</div>
            {currentRole.matched_keywords.length > 0 && (
              <div className="text-xs opacity-60 mt-1">
                {currentRole.matched_keywords.slice(0, 3).join(", ")}
              </div>
            )}
            <div className="text-xs mt-1">
              {Math.round(currentRole.confidence * 100)}%
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default AutoRoleIndicator;
