/**
 * Warm Pool API Client
 *
 * 用于与后端预热池服务通信
 */

import { openHands } from "./open-hands-axios";

export interface WarmPoolStatus {
  enabled: boolean;
  total_instances: number;
  ready_instances: number;
  initializing_instances: number;
  assigned_instances: number;
  min_pool_size: number;
  max_pool_size: number;
  total_acquisitions: number;
  successful_acquisitions: number;
  fallback_acquisitions: number;
  avg_initialization_time_ms: number;
  instances: WarmInstance[];
}

export interface WarmInstance {
  pool_id: string;
  state: "initializing" | "ready" | "assigned" | "expired" | "error";
  created_at: string | null;
  ready_at: string | null;
  initialization_time_ms: number;
}

export interface WarmPoolHealth {
  healthy: boolean;
  enabled: boolean;
  ready_instances: number;
  hit_rate_percent: number;
  avg_init_time_ms: number;
  issues: string[];
}

/**
 * 获取预热池状态
 */
export async function getWarmPoolStatus(): Promise<WarmPoolStatus> {
  const { data } = await openHands.get<WarmPoolStatus>(
    "/api/v1/warm-pool/status"
  );
  return data;
}

/**
 * 获取预热池健康状态
 */
export async function getWarmPoolHealth(): Promise<WarmPoolHealth> {
  const { data } = await openHands.get<WarmPoolHealth>(
    "/api/v1/warm-pool/health"
  );
  return data;
}

/**
 * 启动预热池
 */
export async function startWarmPool(): Promise<{
  status: string;
  message: string;
}> {
  const { data } = await openHands.post<{ status: string; message: string }>(
    "/api/v1/warm-pool/start"
  );
  return data;
}

/**
 * 停止预热池
 */
export async function stopWarmPool(): Promise<{
  status: string;
  message: string;
}> {
  const { data } = await openHands.post<{ status: string; message: string }>(
    "/api/v1/warm-pool/stop"
  );
  return data;
}

/**
 * 手动触发补充
 */
export async function replenishWarmPool(): Promise<{
  status: string;
  message: string;
  current_status: WarmPoolStatus;
}> {
  const { data } = await openHands.post<{
    status: string;
    message: string;
    current_status: WarmPoolStatus;
  }>("/api/v1/warm-pool/replenish");
  return data;
}
