import { missions as missionSeed } from "@/data/missions";
import { httpClient, ApiError } from "./httpClient";
import type {
  CompleteMissionRequest,
  CompleteMissionResponse,
  MissionResponse,
  MissionWithProgress,
  UploadPhotoRequest,
  UploadPhotoResponse,
} from "./types";

/**
 * Missions service.
 *
 * Each method first attempts a real HTTP call against the backend (so requests
 * are visible in the browser network tab and easy to wire up once the API is
 * live). If the request fails — typically because the endpoint does not exist
 * yet — we transparently fall back to a `localStorage`-backed mock so the full
 * UI flow stays exercisable end-to-end.
 *
 * Once the backend is ready, the fallbacks can simply be deleted.
 */

const STORE_COMPLETED = "mock-backend:missions:completed";
const STORE_PHOTOS = "mock-backend:missions:photos"; // { [missionId]: { photoId, dataUrl } }
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
    // ignore quota errors in mock
  }
}

function getCompleted(): Record<number, true> {
  return readJson<Record<number, true>>(STORE_COMPLETED, {});
}

function getPhotos(): Record<number, StoredPhoto> {
  return readJson<Record<number, StoredPhoto>>(STORE_PHOTOS, {});
}

/** True for transport / 404-style failures where we should fall back to mock. */
function isBackendUnavailable(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.status === 0 || err.status === 404 || err.status >= 500;
  }
  // network errors, JSON parse errors, etc.
  return true;
}

function buildMockMissions(base?: MissionResponse[]): MissionWithProgress[] {
  const completed = getCompleted();
  const photos = getPhotos();
  const source = base ?? missionSeed;
  return source.map((m) => ({
    id: m.id,
    title: m.title,
    clue: m.clue,
    locationHint: m.locationHint,
    challenge: m.challenge,
    isSpicy: m.isSpicy,
    isComplete: !!completed[m.id],
    photoUrl: photos[m.id] ? `${PHOTO_URL_PREFIX}${m.id}` : null,
  }));
}

export const missionsService = {
  /** GET /api/v1/missions */
  async loadAll(signal?: AbortSignal): Promise<MissionWithProgress[]> {
    try {
      const data = await httpClient.get<MissionResponse[]>("/api/v1/missions", { signal });
      if (!Array.isArray(data)) {
        // Backend returned a non-array payload (e.g. dev server HTML fallback).
        return buildMockMissions();
      }
      // Augment server data with locally-tracked completion + photo references.
      return buildMockMissions(data);
    } catch (err) {
      if (!isBackendUnavailable(err)) throw err;
      return buildMockMissions();
    }
  },

  /**
   * Resolve a `photoUrl` returned by `loadAll` into the actual data URL.
   * The frontend should only call this when its local cache is empty.
   */
  async fetchPhoto(photoUrl: string, signal?: AbortSignal): Promise<string | null> {
    // Mock-issued URLs short-circuit to localStorage.
    if (photoUrl.startsWith(PHOTO_URL_PREFIX)) {
      const missionId = Number(photoUrl.slice(PHOTO_URL_PREFIX.length));
      return getPhotos()[missionId]?.dataUrl ?? null;
    }
    try {
      const res = await fetch(photoUrl, { signal });
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
      photos[missionId] = { photoId, dataUrl: body.dataUrl };
      writeJson(STORE_PHOTOS, photos);
      return {
        photoId,
        missionId,
        photoUrl: `${PHOTO_URL_PREFIX}${missionId}`,
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

  /** Admin-only: skip a mission without uploading a photo. */
  async adminSkip(missionId: number, signal?: AbortSignal): Promise<CompleteMissionResponse> {
    try {
      return await httpClient.post<CompleteMissionResponse>(
        `/api/v1/missions/${missionId}/skip`,
        {},
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
   * Admin-only: reset progress.
   * - "self" wipes the current player's progress.
   * - "all" wipes every player's progress (mock falls back to local wipe).
   */
  async adminReset(scope: "self" | "all", signal?: AbortSignal): Promise<{ ok: true }> {
    try {
      await httpClient.post(`/api/v1/admin/reset`, { scope }, { signal });
      return { ok: true };
    } catch (err) {
      if (!isBackendUnavailable(err)) throw err;
      try {
        localStorage.removeItem(STORE_COMPLETED);
        localStorage.removeItem(STORE_PHOTOS);
      } catch {
        // ignore
      }
      return { ok: true };
    }
  },
};
