/**
 * Warm Pool API Client
 *
 * 用于与后端预热池服务通信
 */

import { request } from "./request";

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
  const response = await request("/api/v1/warm-pool/status");
  return response.json();
}

/**
 * 获取预热池健康状态
 */
export async function getWarmPoolHealth(): Promise<WarmPoolHealth> {
  const response = await request("/api/v1/warm-pool/health");
  return response.json();
}

/**
 * 启动预热池
 */
export async function startWarmPool(): Promise<{
  status: string;
  message: string;
}> {
  const response = await request("/api/v1/warm-pool/start", {
    method: "POST",
  });
  return response.json();
}

/**
 * 停止预热池
 */
export async function stopWarmPool(): Promise<{
  status: string;
  message: string;
}> {
  const response = await request("/api/v1/warm-pool/stop", {
    method: "POST",
  });
  return response.json();
}

/**
 * 手动触发补充
 */
export async function replenishWarmPool(): Promise<{
  status: string;
  message: string;
  current_status: WarmPoolStatus;
}> {
  const response = await request("/api/v1/warm-pool/replenish", {
    method: "POST",
  });
  return response.json();
}
