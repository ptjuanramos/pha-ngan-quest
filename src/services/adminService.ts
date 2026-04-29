import { httpClient } from "./httpClient";
import type { PlayerMissionStatusResponse } from "./types";

/**
 * Admin service. Wraps `/api/v1/players/missions` (admin overview).
 */
export const adminService = {
  /** GET /api/v1/players/missions */
  async listAllMissions(signal?: AbortSignal): Promise<PlayerMissionStatusResponse[]> {
    const data = await httpClient.get<PlayerMissionStatusResponse[]>(
      "/api/v1/players/missions",
      { signal }
    );
    return Array.isArray(data) ? data : [];
  },
};
