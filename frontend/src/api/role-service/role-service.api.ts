/**
 * Role Service API - 角色服务 API
 *
 * 提供角色管理和自动检测功能
 */

import { openHands } from "../open-hands-axios";
import type {
  Role,
  RoleListResponse,
  AutoDetectRequest,
  AutoDetectResponse,
  RoleToolsResponse,
} from "./role-service.types";

const ROLE_API_BASE = "/api/v1/roles";

/**
 * 获取所有可用角色
 */
export async function listRoles(): Promise<RoleListResponse> {
  const response = await openHands.get<RoleListResponse>(ROLE_API_BASE);
  return response.data;
}

/**
 * 获取单个角色详情
 */
export async function getRole(roleId: string): Promise<Role> {
  const response = await openHands.get<Role>(`${ROLE_API_BASE}/${roleId}`);
  return response.data;
}

/**
 * 获取角色的工具配置
 */
export async function getRoleTools(roleId: string): Promise<RoleToolsResponse> {
  const response = await openHands.get<RoleToolsResponse>(
    `${ROLE_API_BASE}/${roleId}/tools`,
  );
  return response.data;
}

/**
 * 自动检测最佳角色
 *
 * @param userInput - 用户输入的文本
 * @returns 检测结果，包含角色信息和置信度
 *
 * @example
 * const result = await autoDetectRole("设计一个电商平台的微服务架构");
 * console.log(result.role_id); // "architect"
 * console.log(result.confidence); // 0.55
 */
export async function autoDetectRole(
  userInput: string,
): Promise<AutoDetectResponse> {
  const request: AutoDetectRequest = { user_input: userInput };
  const response = await openHands.post<AutoDetectResponse>(
    `${ROLE_API_BASE}/auto-detect`,
    request,
  );
  return response.data;
}

// 默认角色列表（当 API 不可用时的后备）
export const DEFAULT_ROLES: Role[] = [
  {
    id: "engineer",
    name: "Bob",
    role: "Software Engineer",
    avatar: "💻",
    goal: "Write clean, maintainable code",
    backstory: "",
    capabilities: ["coding", "debugging", "testing"],
    recommended_model: "claude-sonnet-4-20250514",
  },
  {
    id: "architect",
    name: "Alex",
    role: "Software Architect",
    avatar: "🏗️",
    goal: "Design scalable system architectures",
    backstory: "",
    capabilities: ["system_design", "api_design", "tech_selection"],
    recommended_model: "claude-sonnet-4-20250514",
  },
  {
    id: "product_manager",
    name: "Emma",
    role: "Product Manager",
    avatar: "📋",
    goal: "Define clear product requirements",
    backstory: "",
    capabilities: ["requirements", "user_research", "roadmap"],
    recommended_model: "claude-sonnet-4-20250514",
  },
  {
    id: "data_analyst",
    name: "Diana",
    role: "Data Analyst",
    avatar: "📈",
    goal: "Extract insights from data",
    backstory: "",
    capabilities: ["data_analysis", "visualization", "reporting"],
    recommended_model: "claude-sonnet-4-20250514",
  },
  {
    id: "deep_researcher",
    name: "Ryan",
    role: "Deep Researcher",
    avatar: "🔬",
    goal: "Conduct thorough research",
    backstory: "",
    capabilities: ["research", "analysis", "synthesis"],
    recommended_model: "claude-sonnet-4-20250514",
  },
  {
    id: "project_manager",
    name: "Sarah",
    role: "Project Manager",
    avatar: "📊",
    goal: "Ensure on-time delivery",
    backstory: "",
    capabilities: ["task_management", "timeline", "risk_assessment"],
    recommended_model: "claude-sonnet-4-20250514",
  },
];
