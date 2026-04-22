import { missions as missionSeed } from "@/data/missions";
import { httpClient, ApiError } from "./httpClient";
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
 * Missions service.
 *
 * Wraps `/api/v1/missions/*` endpoints. When the backend is unreachable a
 * `localStorage`-backed mock is used so the UI stays interactive in dev.
 */

const STORE_COMPLETED = "mock-backend:missions:completed";
const STORE_PHOTOS = "mock-backend:missions:photos";
const PHOTO_URL_PREFIX = "mock://photo/";

interface StoredPhoto {
  photoId: number;
  dataUrl: string;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors in mock */
  }
}

function getCompleted(): Record<number, true> {
  return readJson<Record<number, true>>(STORE_COMPLETED, {});
}

function getPhotos(): Record<number, StoredPhoto> {
  return readJson<Record<number, StoredPhoto>>(STORE_PHOTOS, {});
}

function isBackendUnavailable(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.status === 0 || err.status === 404 || err.status >= 500;
  }
  return true;
}

/** Build mission list from seed (used as the dev fallback). */
function mockMissions(base?: MissionResponse[]): MissionResponse[] {
  return (base ?? missionSeed).map((m) => ({
    id: m.id,
    title: m.title,
    clue: m.clue,
    locationHint: m.locationHint,
    challenge: m.challenge,
    isSpicy: m.isSpicy,
  }));
}

/**
 * Combine raw missions + the player's completions into a single list the UI
 * can render without further joins.
 */
export function mergeMissionsWithCompletions(
  missions: MissionResponse[],
  completions: PlayerCompletionResponse[]
): MissionWithProgress[] {
  const completedSet = new Set(completions.map((c) => c.missionId));
  const photos = getPhotos();
  return missions.map((m) => ({
    ...m,
    isComplete: completedSet.has(m.id),
    // Photo references are resolved lazily via `getPhoto` on the server, or
    // pulled from the local mock store in dev.
    photoUrl: completedSet.has(m.id)
      ? photos[m.id]
        ? `${PHOTO_URL_PREFIX}${m.id}`
        : `server://photo/${m.id}`
      : null,
  }));
}

export const missionsService = {
  /** GET /api/v1/missions */
  async loadAll(signal?: AbortSignal): Promise<MissionResponse[]> {
    try {
      const data = await httpClient.get<MissionResponse[]>("/api/v1/missions", { signal });
      if (!Array.isArray(data)) return mockMissions();
      return data;
    } catch (err) {
      if (!isBackendUnavailable(err)) throw err;
      return mockMissions();
    }
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
    try {
      return await httpClient.get<PhotoResponse>(
        `/api/v1/players/${playerId}/missions/${missionId}/photo`,
        { signal }
      );
    } catch (err) {
      if (!isBackendUnavailable(err)) throw err;
      const stored = getPhotos()[missionId];
      if (!stored) return null;
      return {
        photoId: stored.photoId,
        blobUrl: `${PHOTO_URL_PREFIX}${missionId}`,
        validationStatus: "APPROVED",
      };
    }
  },

  /**
   * Resolve a `blobUrl` (or mock pointer) into a base64 data URL the UI can
   * render directly inside an <img>.
   */
  async fetchPhotoData(blobUrl: string, signal?: AbortSignal): Promise<string | null> {
    if (blobUrl.startsWith(PHOTO_URL_PREFIX)) {
      const missionId = Number(blobUrl.slice(PHOTO_URL_PREFIX.length));
      return getPhotos()[missionId]?.dataUrl ?? null;
    }
    if (blobUrl.startsWith("server://photo/")) {
      // Mock placeholder when the server has no photo yet.
      const missionId = Number(blobUrl.slice("server://photo/".length));
      return getPhotos()[missionId]?.dataUrl ?? null;
    }
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
    try {
      return await httpClient.post<UploadPhotoResponse>(
        `/api/v1/missions/${missionId}/photos`,
        body,
        { signal }
      );
    } catch (err) {
      if (!isBackendUnavailable(err)) throw err;
      const photos = getPhotos();
      const photoId = Date.now();
      photos[missionId] = { photoId, dataUrl: body.base64Content };
      writeJson(STORE_PHOTOS, photos);
      return {
        photoId,
        missionId,
        blobUrl: `${PHOTO_URL_PREFIX}${missionId}`,
        validationStatus: "PENDING",
      };
    }
  },

  /** POST /api/v1/missions/{missionId}/complete */
  async complete(
    missionId: number,
    body: CompleteMissionRequest,
    signal?: AbortSignal
  ): Promise<CompleteMissionResponse> {
    try {
      return await httpClient.post<CompleteMissionResponse>(
        `/api/v1/missions/${missionId}/complete`,
        body,
        { signal }
      );
    } catch (err) {
      if (!isBackendUnavailable(err)) throw err;
      const completed = getCompleted();
      completed[missionId] = true;
      writeJson(STORE_COMPLETED, completed);
      return {
        completionId: Date.now(),
        missionId,
        completedAt: new Date().toISOString(),
      };
    }
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
    try {
      return await httpClient.post<ApprovePhotoResponse>(
        `/api/v1/missions/${missionId}/photos/${photoId}/approve`,
        body,
        { signal }
      );
    } catch (err) {
      if (!isBackendUnavailable(err)) throw err;
      return {
        photoId,
        validationStatus: body.approved ? "APPROVED" : "REJECTED",
      };
    }
  },

  /**
   * Admin-only convenience: skip a mission entirely. The spec doesn't expose
   * a dedicated endpoint, so we synthesize one by uploading a marker photo
   * and completing the mission. In dev/mock this is a pure local toggle.
   */
  async adminSkip(missionId: number, signal?: AbortSignal): Promise<CompleteMissionResponse> {
    try {
      const upload = await this.uploadPhoto(
        missionId,
        { base64Content: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" },
        signal
      );
      // Auto-approve so completion succeeds even without AI validation.
      try {
        await this.approvePhoto(missionId, upload.photoId, { approved: true }, signal);
      } catch {
        /* ignore — backend may auto-approve admin uploads */
      }
      return await this.complete(missionId, { photoId: upload.photoId }, signal);
    } catch (err) {
      if (!isBackendUnavailable(err)) throw err;
      const completed = getCompleted();
      completed[missionId] = true;
      writeJson(STORE_COMPLETED, completed);
      return {
        completionId: Date.now(),
        missionId,
        completedAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Admin-only: reset progress. The spec has no dedicated endpoint yet, so we
   * fall back to a local wipe of the mock stores.
   */
  async adminReset(_scope: "self" | "all"): Promise<{ ok: true }> {
    try {
      localStorage.removeItem(STORE_COMPLETED);
      localStorage.removeItem(STORE_PHOTOS);
      sessionStorage.removeItem("kpn-photo-cache");
    } catch {
      /* ignore */
    }
    return { ok: true };
  },
};
