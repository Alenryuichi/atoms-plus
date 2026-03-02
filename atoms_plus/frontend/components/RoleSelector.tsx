/**
 * Role Selector Component - 角色选择器
 *
 * 允许用户在对话开始时选择 AI 角色/人设
 *
 * 使用方式:
 * 1. 复制到 frontend/src/components/features/home/
 * 2. 在 RepositorySelectionForm 或 Chat 组件中集成
 */

import React, { useState, useEffect } from "react";

// 角色类型定义
interface Role {
  id: string;
  name: string;
  role: string;
  avatar: string;
  goal: string;
  capabilities: string[];
}

// 默认角色列表（当 API 不可用时使用）
const DEFAULT_ROLES: Role[] = [
  {
    id: "team_leader",
    name: "Mike",
    role: "Team Leader",
    avatar: "👔",
    goal: "Coordinate team to deliver excellent results",
    capabilities: ["planning", "coordination", "delegation"],
  },
  {
    id: "product_manager",
    name: "Emma",
    role: "Product Manager",
    avatar: "📋",
    goal: "Define clear product requirements",
    capabilities: ["requirements", "user_research", "roadmap"],
  },
  {
    id: "architect",
    name: "Alex",
    role: "Software Architect",
    avatar: "🏗️",
    goal: "Design scalable system architectures",
    capabilities: ["system_design", "api_design", "tech_selection"],
  },
  {
    id: "engineer",
    name: "Bob",
    role: "Software Engineer",
    avatar: "💻",
    goal: "Write clean, maintainable code",
    capabilities: ["coding", "debugging", "testing"],
  },
  {
    id: "data_analyst",
    name: "Diana",
    role: "Data Analyst",
    avatar: "📈",
    goal: "Extract insights from data",
    capabilities: ["data_analysis", "visualization", "reporting"],
  },
  {
    id: "deep_researcher",
    name: "Ryan",
    role: "Deep Researcher",
    avatar: "🔬",
    goal: "Conduct thorough research",
    capabilities: ["research", "analysis", "synthesis"],
  },
  {
    id: "project_manager",
    name: "Sarah",
    role: "Project Manager",
    avatar: "📊",
    goal: "Ensure on-time delivery",
    capabilities: ["task_management", "timeline", "risk_assessment"],
  },
  {
    id: "seo_specialist",
    name: "Sophie",
    role: "SEO Specialist",
    avatar: "🔍",
    goal: "Optimize for search engines",
    capabilities: ["keyword_research", "content_optimization", "analytics"],
  },
];

interface RoleSelectorProps {
  selectedRole: string;
  onSelect: (roleId: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function RoleSelector({
  selectedRole,
  onSelect,
  disabled = false,
  compact = false,
}: RoleSelectorProps) {
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [isLoading, setIsLoading] = useState(false);

  // 尝试从 API 加载角色
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/v1/roles");
        if (response.ok) {
          const data = await response.json();
          if (data.roles && data.roles.length > 0) {
            setRoles(data.roles);
          }
        }
      } catch (error) {
        console.warn("Failed to fetch roles, using defaults:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoles();
  }, []);

  if (compact) {
    return (
      <div className="flex gap-1 flex-wrap">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => !disabled && onSelect(role.id)}
            disabled={disabled}
            className={`px-2 py-1 rounded-md text-sm transition-colors ${
              selectedRole === role.id
                ? "bg-blue-600 text-white"
                : "bg-gray-700 hover:bg-gray-600 text-gray-200"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            title={`${role.name} - ${role.role}`}
          >
            <span>{role.avatar}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2">
      {roles.map((role) => (
        <button
          key={role.id}
          onClick={() => !disabled && onSelect(role.id)}
          disabled={disabled}
          className={`flex flex-col items-center p-3 rounded-lg transition-all ${
            selectedRole === role.id
              ? "bg-blue-600 text-white ring-2 ring-blue-400"
              : "bg-gray-800 hover:bg-gray-700 text-gray-200"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span className="text-2xl mb-1">{role.avatar}</span>
          <span className="font-medium text-sm">{role.name}</span>
          <span className="text-xs opacity-75">{role.role}</span>
        </button>
      ))}
    </div>
  );
}

export default RoleSelector;

