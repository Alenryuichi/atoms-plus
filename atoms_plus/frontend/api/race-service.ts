/**
 * Race Mode API Service
 *
 * 独立的 API 客户端，可以在任何前端项目中使用
 *
 * 使用方式：
 * 1. 直接导入使用（需要配置 baseUrl）
 * 2. 复制到 OpenHands frontend/src/api/ 目录
 */

// 配置：可以通过环境变量或直接修改
const BASE_URL = process.env.REACT_APP_API_URL || "";

// Types
export interface RaceRequest {
  prompt: string;
  models?: string[];
  context?: string;
  system_prompt?: string;
}

export interface RaceResultResponse {
  model_name: string;
  response: string;
  execution_time: number;
  token_count: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  cost_estimate: number;
  quality_score: number;
  error?: string;
}

export interface RaceResponse {
  session_id: string;
  results: RaceResultResponse[];
  winner?: RaceResultResponse;
  total_cost?: number;
}

export interface SelectBestRequest {
  session_id: string;
  criteria?: "code_quality" | "speed" | "cost" | "balanced";
}

export interface SupportedModelsResponse {
  models: string[];
  details: Record<string, { provider: string; display: string }>;
}

// 通用请求函数
async function apiRequest<T>(
  method: "GET" | "POST",
  path: string,
  data?: unknown,
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (data && method === "POST") {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// API Functions
export async function startRace(request: RaceRequest): Promise<RaceResponse> {
  return apiRequest<RaceResponse>("POST", "/api/v1/race/start", request);
}

export async function selectBest(
  request: SelectBestRequest,
): Promise<RaceResultResponse> {
  return apiRequest<RaceResultResponse>(
    "POST",
    "/api/v1/race/select-best",
    request,
  );
}

export async function getSupportedModels(): Promise<SupportedModelsResponse> {
  return apiRequest<SupportedModelsResponse>("GET", "/api/v1/race/models");
}

export async function getSession(sessionId: string) {
  return apiRequest("GET", `/api/v1/race/session/${sessionId}`);
}

// 导出类型
export type { RaceRequest as RaceRequestType };

