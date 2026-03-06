/**
 * Team Mode API Types
 * Multi-agent collaboration with visible thought streaming
 */

export type AgentRole =
  | "pm"
  | "architect"
  | "engineer"
  | "data_analyst"
  | "researcher"
  | "project_manager"
  | "seo_specialist"
  | "team_leader";

export type AgentStatus = "idle" | "thinking" | "responding" | "waiting";

export interface AgentThought {
  role: AgentRole;
  content: string;
  status: AgentStatus;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface TeamModeInfo {
  name: string;
  version: string;
  mvp_agents: AgentRole[];
  future_agents: AgentRole[];
  default_model: string;
  status: string;
}

export interface TeamSessionCreateRequest {
  task: string;
  model?: string;
  max_iterations?: number;
}

export interface TeamSessionCreateResponse {
  session_id: string;
  status: string;
  created_at: string;
}

export interface TeamSessionStatus {
  session_id: string;
  status: "created" | "running" | "completed" | "error";
  current_agent: AgentRole | null;
  iteration: number;
  max_iterations: number;
  thoughts_count: number;
  error: string | null;
  created_at: string;
}

// WebSocket message types
export interface TeamWSMessage {
  type: "thought" | "status" | "complete" | "error";
  data: AgentThought | TeamSessionStatus | { error: string };
}

export interface TeamThoughtMessage {
  type: "thought";
  data: AgentThought;
}

export interface TeamStatusMessage {
  type: "status";
  data: TeamSessionStatus;
}

export interface TeamCompleteMessage {
  type: "complete";
  data: {
    plan: string;
    code: string;
    review: string;
  };
}

export interface TeamErrorMessage {
  type: "error";
  data: { error: string };
}

// Agent display info
export interface AgentDisplayInfo {
  role: AgentRole;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export const AGENT_DISPLAY_INFO: Record<AgentRole, AgentDisplayInfo> = {
  pm: {
    role: "pm",
    name: "Product Manager",
    icon: "📋",
    color: "#3B82F6",
    description: "Requirements decomposition and user stories",
  },
  architect: {
    role: "architect",
    name: "Architect",
    icon: "🏗️",
    color: "#8B5CF6",
    description: "System design and architecture decisions",
  },
  engineer: {
    role: "engineer",
    name: "Engineer",
    icon: "💻",
    color: "#10B981",
    description: "Implementation and code generation",
  },
  data_analyst: {
    role: "data_analyst",
    name: "Data Analyst",
    icon: "📊",
    color: "#F59E0B",
    description: "Data analysis and insights",
  },
  researcher: {
    role: "researcher",
    name: "Researcher",
    icon: "🔬",
    color: "#EC4899",
    description: "Deep research and exploration",
  },
  project_manager: {
    role: "project_manager",
    name: "Project Manager",
    icon: "📈",
    color: "#6366F1",
    description: "Project planning and coordination",
  },
  seo_specialist: {
    role: "seo_specialist",
    name: "SEO Specialist",
    icon: "🔍",
    color: "#14B8A6",
    description: "SEO optimization strategies",
  },
  team_leader: {
    role: "team_leader",
    name: "Team Leader",
    icon: "👔",
    color: "#EF4444",
    description: "Team coordination and leadership",
  },
};
