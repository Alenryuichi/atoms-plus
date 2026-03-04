/**
 * Warm Pool Query Hook
 *
 * 用于获取预热池状态的 TanStack Query hook
 */

import { useQuery } from "@tanstack/react-query";
import {
  getWarmPoolStatus,
  getWarmPoolHealth,
  WarmPoolStatus,
  WarmPoolHealth,
} from "#/api/warm-pool";

/**
 * 获取预热池状态
 */
export function useWarmPoolStatus(options?: { enabled?: boolean }) {
  return useQuery<WarmPoolStatus>({
    queryKey: ["warm-pool", "status"],
    queryFn: getWarmPoolStatus,
    refetchInterval: 10000, // 每10秒刷新
    enabled: options?.enabled ?? true,
    staleTime: 5000,
  });
}

/**
 * 获取预热池健康状态
 */
export function useWarmPoolHealth(options?: { enabled?: boolean }) {
  return useQuery<WarmPoolHealth>({
    queryKey: ["warm-pool", "health"],
    queryFn: getWarmPoolHealth,
    refetchInterval: 30000, // 每30秒刷新
    enabled: options?.enabled ?? true,
    staleTime: 10000,
  });
}
