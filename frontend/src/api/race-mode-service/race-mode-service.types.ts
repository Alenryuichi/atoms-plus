/**
 * Race Mode API Types
 */

export interface RaceModelInfo {
  provider: string;
  display: string;
}

export interface RaceModelsResponse {
  models: string[];
  details: Record<string, RaceModelInfo>;
}

export interface RaceResult {
  model_name: string;
  response: string;
  execution_time: number;
  token_count: number;
  prompt_tokens: number;
  completion_tokens: number;
  cost_estimate: number;
  quality_score: number;
  error: string | null;
}

export interface RaceSessionResponse {
  session_id: string;
  results: RaceResult[];
  total_cost: number;
  winner: string | null;
}

export interface RaceStartRequest {
  prompt: string;
  models?: string[];
  system_prompt?: string;
}

export interface RaceSelectBestRequest {
  session_id: string;
  winner_model: string;
}
