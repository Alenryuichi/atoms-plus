/**
 * Team Mode API Service
 * Multi-agent collaboration with visible thought streaming
 */
import { openHands } from "../open-hands-axios";
import {
  TeamModeInfo,
  TeamSessionCreateRequest,
  TeamSessionCreateResponse,
  TeamSessionStatus,
} from "./team-mode-service.types";

class TeamModeService {
  /**
   * Get Team Mode information
   */
  static async getInfo(): Promise<TeamModeInfo> {
    const { data } = await openHands.get<TeamModeInfo>("/api/v1/team/");
    return data;
  }

  /**
   * Create a new Team Mode session
   */
  static async createSession(
    request: TeamSessionCreateRequest,
  ): Promise<TeamSessionCreateResponse> {
    const { data } = await openHands.post<TeamSessionCreateResponse>(
      "/api/v1/team/sessions",
      request,
    );
    return data;
  }

  /**
   * Get session status
   */
  static async getSessionStatus(sessionId: string): Promise<TeamSessionStatus> {
    const { data } = await openHands.get<TeamSessionStatus>(
      `/api/v1/team/sessions/${sessionId}`,
    );
    return data;
  }

  /**
   * Create WebSocket URL for streaming
   */
  static getStreamUrl(sessionId: string): string {
    const baseUrl = openHands.defaults.baseURL || "";
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = baseUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `${wsProtocol}//${host}/api/v1/team/sessions/${sessionId}/stream`;
  }
}

export default TeamModeService;
