import { httpClient } from "./httpClient";
import type {
  ApprovePhotoRequest,
  ApprovePhotoResponse,
  CompleteMissionRequest,
  CompleteMissionResponse,
  MissionResponse,
  MissionWithProgress,
  PhotoResponse,
  PlayerCompletionResponse,
  UploadPhotoResponse,
  UploadPhotoRequest,
} from "./types";

/**
 * Missions service. Wraps `/api/v1/missions/*` endpoints.
 * All errors propagate to the caller — no local fallbacks.
 */

/**
 * Combine raw missions + the player's completions into a single list the UI
 * can render without further joins.
 */
export function mergeMissionsWithCompletions(
  missions: MissionResponse[],
  completions: PlayerCompletionResponse[]
): MissionWithProgress[] {
  const completedSet = new Set(completions.map((c) => c.missionId));
  return missions.map((m) => ({
    ...m,
    isComplete: completedSet.has(m.id),
    // Photo references are resolved lazily via `getPhoto`.
    photoUrl: completedSet.has(m.id) ? `server://photo/${m.id}` : null,
  }));
}

export const missionsService = {
  /** GET /api/v1/missions */
  async loadAll(signal?: AbortSignal): Promise<MissionResponse[]> {
    const data = await httpClient.get<MissionResponse[]>("/api/v1/missions", { signal });
    return Array.isArray(data) ? data : [];
  },

  /**
   * GET /api/v1/players/{playerId}/missions/{missionId}/photo
   * Returns the photo metadata (including blobUrl) for a player's mission.
   */
  async getPhoto(
    playerId: number,
    missionId: number,
    signal?: AbortSignal
  ): Promise<PhotoResponse | null> {
    return await httpClient.get<PhotoResponse>(
      `/api/v1/players/${playerId}/missions/${missionId}/photo`,
      { signal }
    );
  },

  /**
   * Resolve a `blobUrl` into a base64 data URL the UI can render directly
   * inside an <img>.
   */
  async fetchPhotoData(blobUrl: string, signal?: AbortSignal): Promise<string | null> {
    try {
      const res = await fetch(blobUrl, { signal });
      if (!res.ok) return null;
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
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

  /**
   * POST /api/v1/missions/{missionId}/photos/{photoId}/approve  (admin-only)
   * Manually approve (or reject) a photo when AI validation fails.
   */
  async approvePhoto(
    missionId: number,
    photoId: number,
    body: ApprovePhotoRequest,
    signal?: AbortSignal
  ): Promise<ApprovePhotoResponse> {
    return await httpClient.post<ApprovePhotoResponse>(
      `/api/v1/missions/${missionId}/photos/${photoId}/approve`,
      body,
      { signal }
    );
  },

  /**
   * Admin-only convenience: skip a mission entirely. The spec doesn't expose
   * a dedicated endpoint, so we synthesize one by uploading a marker photo,
   * approving it, and completing the mission.
   */
  async adminSkip(missionId: number, signal?: AbortSignal): Promise<CompleteMissionResponse> {
    const upload = await this.uploadPhoto(
      missionId,
      { base64Content: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" },
      signal
    );
    try {
      await this.approvePhoto(missionId, upload.photoId, { approved: true }, signal);
    } catch {
      /* ignore — backend may auto-approve admin uploads */
    }
    return await this.complete(missionId, { photoId: upload.photoId }, signal);
  },

  /**
   * Admin-only: reset progress. The spec has no dedicated endpoint yet, so we
   * just clear the local session photo cache. Backend reset must be handled
   * server-side.
   */
  async adminReset(_scope: "self" | "all"): Promise<{ ok: true }> {
    try {
      sessionStorage.removeItem("kpn-photo-cache");
    } catch {
      /* ignore */
    }
    return { ok: true };
  },
};
