/**
 * Role Service Types - 角色服务类型定义
 */

export interface Role {
  id: string;
  name: string;
  role: string;
  avatar: string;
  goal: string;
  backstory: string;
  capabilities: string[];
  recommended_model: string;
}

export interface RoleListResponse {
  roles: Role[];
  count: number;
}

export interface AutoDetectRequest {
  user_input: string;
}

export interface AutoDetectResponse {
  role_id: string;
  role_name: string;
  role_title: string;
  avatar: string;
  confidence: number;
  matched_keywords: string[];
  reason: string;
  system_prompt: string;
}

export interface RoleToolsResponse {
  role_id: string;
  tools: Record<string, boolean>;
}
