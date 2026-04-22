import { httpClient } from "./httpClient";
import type {
  CompleteMissionRequest,
  CompleteMissionResponse,
  MissionResponse,
  MissionWithProgress,
  UploadPhotoResponse,
  UploadPhotoRequest,
} from "./types";

/**
 * Missions service. Wraps `/api/v1/missions/*` endpoints.
 * All errors propagate to the caller — no local fallbacks.
 */

/**
 * Combine raw missions + a set of completed mission IDs into a single list
 * the UI can render without further joins.
 */
export function mergeMissionsWithCompletions(
  missions: MissionResponse[],
  completedMissionIds: number[]
): MissionWithProgress[] {
  const completedSet = new Set(completedMissionIds);
  return missions.map((m) => ({
    ...m,
    isComplete: completedSet.has(m.id),
    // Photos are not retrievable via API — the client owns them via
    // sessionStorage cache. Surface a stable opaque marker instead.
    photoUrl: completedSet.has(m.id) ? `client://photo/${m.id}` : null,
  }));
}

export const missionsService = {
  /** GET /api/v1/missions */
  async loadAll(signal?: AbortSignal): Promise<MissionResponse[]> {
    const data = await httpClient.get<MissionResponse[]>("/api/v1/missions", { signal });
    return Array.isArray(data) ? data : [];
  },

  /** POST /api/v1/missions/{missionId}/photos */
  async uploadPhoto(
    missionId: number,
    body: UploadPhotoRequest,
    signal?: AbortSignal
  ): Promise<UploadPhotoResponse> {
    return await httpClient.post<UploadPhotoResponse>(
      `/api/v1/missions/${missionId}/photos`,
      body,
      { signal }
    );
  },

  /** POST /api/v1/missions/{missionId}/complete */
  async complete(
    missionId: number,
    body: CompleteMissionRequest,
    signal?: AbortSignal
  ): Promise<CompleteMissionResponse> {
    return await httpClient.post<CompleteMissionResponse>(
      `/api/v1/missions/${missionId}/complete`,
      body,
      { signal }
    );
  },
};
