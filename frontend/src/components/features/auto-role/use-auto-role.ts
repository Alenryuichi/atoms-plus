/**
 * useAutoRole Hook - 自动角色检测 Hook
 *
 * 提供自动角色检测的状态管理
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { AutoDetectResponse } from "#/api/role-service/role-service.types";
import { autoDetectRole } from "#/api/role-service/role-service.api";

interface UseAutoRoleOptions {
  /** 防抖延迟（毫秒） */
  debounceMs?: number;
  /** 最小输入长度 */
  minInputLength?: number;
  /** 角色变更回调 */
  onRoleChange?: (role: AutoDetectResponse) => void;
}

interface UseAutoRoleReturn {
  /** 当前角色 */
  currentRole: AutoDetectResponse | null;
  /** 是否正在检测 */
  isDetecting: boolean;
  /** 手动触发检测 */
  detectRole: (input: string) => Promise<void>;
  /** 重置为默认角色 */
  reset: () => void;
}

const DEFAULT_ROLE: AutoDetectResponse = {
  role_id: "engineer",
  role_name: "Bob",
  role_title: "Software Engineer",
  avatar: "💻",
  confidence: 1.0,
  matched_keywords: [],
  reason: "Default role for development tasks",
  system_prompt: "",
};

export function useAutoRole(
  options: UseAutoRoleOptions = {},
): UseAutoRoleReturn {
  const { debounceMs = 500, minInputLength = 5, onRoleChange } = options;

  const [currentRole, setCurrentRole] =
    useState<AutoDetectResponse>(DEFAULT_ROLE);
  const [isDetecting, setIsDetecting] = useState(false);
  const lastInputRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 清理定时器
  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  // 检测角色
  const detectRole = useCallback(
    async (input: string) => {
      // 清除之前的定时器
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // 验证输入
      if (!input || input.trim().length < minInputLength) {
        return;
      }

      // 避免重复检测
      if (input === lastInputRef.current) {
        return;
      }

      // 防抖处理
      timerRef.current = setTimeout(async () => {
        setIsDetecting(true);
        lastInputRef.current = input;

        try {
          const result = await autoDetectRole(input);
          setCurrentRole(result);
          onRoleChange?.(result);
        } catch {
          // Keep current role on failure, silent fail
        } finally {
          setIsDetecting(false);
        }
      }, debounceMs);
    },
    [debounceMs, minInputLength, onRoleChange],
  );

  // 重置角色
  const reset = useCallback(() => {
    setCurrentRole(DEFAULT_ROLE);
    lastInputRef.current = "";
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  return {
    currentRole,
    isDetecting,
    detectRole,
    reset,
  };
}

export default useAutoRole;
