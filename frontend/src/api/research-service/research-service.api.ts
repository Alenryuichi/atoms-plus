import { openHands } from "#/api/open-hands-axios";

export interface SaveReportRequest {
  sandbox_id: string;
  report: string;
  filename?: string;
}

export interface SaveReportResponse {
  success: boolean;
  host_path: string | null;
  sandbox_path: string | null;
  error: string | null;
}

export class ResearchService {
  /**
   * Save a completed research report into a sandbox workspace.
   *
   * Called after both the research AND the conversation/sandbox are ready.
   * The backend writes the file to the host-side sandbox directory so the
   * agent inside the sandbox can read it at /workspace/report.md.
   */
  static async saveReport(
    request: SaveReportRequest,
  ): Promise<SaveReportResponse> {
    const { data } = await openHands.post<SaveReportResponse>(
      "/api/v1/research/save-report",
      request,
    );

    if (!data.success) {
      throw new Error(data.error || "Failed to save research report to sandbox");
    }

    return data;
  }
}
