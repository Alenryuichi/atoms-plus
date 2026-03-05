/**
 * Auto Role Indicator - 自动角色指示器
 *
 * 显示当前自动检测到的角色，无需用户手动切换
 * 系统根据用户输入自动选择最佳角色
 *
 * Atoms Plus: 与 ChatStatusIndicator 统一设计
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "lucide-react";
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

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Atoms Plus: 统一玻璃效果 pill，与 ChatStatusIndicator 高度一致 */}
          <div
            data-testid="auto-role-indicator"
            className={cn(
              // Match ChatStatusIndicator height and style
              "h-8 w-fit rounded-full px-3 py-1",
              "bg-black/50 backdrop-blur-sm",
              "border border-amber-500/30",
              "flex items-center gap-2",
              "shadow-lg shadow-black/20",
              "cursor-default",
              "transition-all duration-300",
              isDetecting && "opacity-70",
              className,
            )}
          >
            <AnimatePresence mode="wait">
              {/* Role Icon */}
              <motion.div
                key={`icon-${currentRole.role_id}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                {isDetecting ? (
                  <div className="w-4 h-4 rounded-full border-2 border-amber-500/50 border-t-amber-500 animate-spin" />
                ) : (
                  <User className="w-4 h-4 text-amber-500" strokeWidth={2} />
                )}
              </motion.div>

              {/* Role Name */}
              <motion.div
                key={`name-${currentRole.role_id}`}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 4 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-1.5"
              >
                {showDetails ? (
                  <div className="flex flex-col leading-none">
                    <span className="text-xs font-semibold text-amber-500">
                      {currentRole.role_name}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {currentRole.role_title}
                    </span>
                  </div>
                ) : (
                  <>
                    <span className="font-medium text-xs text-amber-500">
                      {currentRole.role_name}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      responding
                    </span>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-black/90 backdrop-blur-md border-amber-500/20"
        >
          <div className="text-sm p-1">
            <div className="font-medium text-amber-500">
              {currentRole.avatar} {currentRole.role_name}
            </div>
            <div className="text-xs text-neutral-300 mt-0.5">
              {currentRole.role_title}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              {currentRole.reason}
            </div>
            {currentRole.matched_keywords.length > 0 && (
              <div className="text-xs text-neutral-600 mt-1">
                Keywords: {currentRole.matched_keywords.slice(0, 3).join(", ")}
              </div>
            )}
            <div className="text-xs text-amber-500/70 mt-1">
              Confidence: {Math.round(currentRole.confidence * 100)}%
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default AutoRoleIndicator;
