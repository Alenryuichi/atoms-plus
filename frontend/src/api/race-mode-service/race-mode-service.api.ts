/**
 * Race Mode API Service
 */
import { openHands } from "../open-hands-axios";
import {
  RaceModelsResponse,
  RaceSessionResponse,
  RaceStartRequest,
  RaceSelectBestRequest,
} from "./race-mode-service.types";

class RaceModeService {
  /**
   * Get list of available models for Race Mode
   */
  static async getModels(): Promise<RaceModelsResponse> {
    const { data } = await openHands.get<RaceModelsResponse>(
      "/api/v1/race/models",
    );
    return data;
  }

  /**
   * Start a race with multiple models
   */
  static async startRace(
    request: RaceStartRequest,
  ): Promise<RaceSessionResponse> {
    const { data } = await openHands.post<RaceSessionResponse>(
      "/api/v1/race/start",
      request,
    );
    return data;
  }

  /**
   * Select the best result from a race session
   */
  static async selectBest(
    request: RaceSelectBestRequest,
  ): Promise<{ status: string }> {
    const { data } = await openHands.post<{ status: string }>(
      "/api/v1/race/select-best",
      request,
    );
    return data;
  }

  /**
   * Get race session details
   */
  static async getSession(
    sessionId: string,
  ): Promise<RaceSessionResponse | null> {
    const { data } = await openHands.get<RaceSessionResponse | null>(
      `/api/v1/race/session/${sessionId}`,
    );
    return data;
  }
}

export default RaceModeService;
