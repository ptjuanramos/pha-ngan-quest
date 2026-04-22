import { missions as missionSeed } from "@/data/missions";
import type {
  CompleteMissionRequest,
  CompleteMissionResponse,
  MissionResponse,
  UploadPhotoRequest,
  UploadPhotoResponse,
} from "./types";

/**
 * Mock-backed missions service.
 *
 * NOTE: The real backend endpoints are not yet wired up. Until then, this
 * service simulates them using `localStorage` as the "remote" store, so the
 * full UI flow (load → upload photo → complete) stays exercisable end-to-end.
 *
 * When the backend is ready, replace each method body with the corresponding
 * `httpClient` call — the public signatures already match the OpenAPI spec.
 */

const MOCK_LATENCY_MS = 250;
const STORE_COMPLETED = "mock-backend:missions:completed";
const STORE_PHOTOS = "mock-backend:missions:photos"; // { [missionId]: { photoId, dataUrl } }
const PHOTO_URL_PREFIX = "mock://photo/";

interface StoredPhoto {
  photoId: number;
  dataUrl: string;
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
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

export const missionsService = {
  /** GET /api/v1/missions */
  async loadAll(_signal?: AbortSignal): Promise<MissionResponse[]> {
    const completed = getCompleted();
    const photos = getPhotos();
    const list: MissionResponse[] = missionSeed.map((m) => ({
      id: m.id,
      title: m.title,
      clue: m.clue,
      locationHint: m.locationHint,
      challenge: m.challenge,
      isSpicy: m.isSpicy,
      isComplete: !!completed[m.id],
      photoUrl: photos[m.id] ? `${PHOTO_URL_PREFIX}${m.id}` : null,
    }));
    return delay(list);
  },

  /**
   * Resolve a `photoUrl` returned by `loadAll` into the actual data URL.
   * The frontend should only call this when its local cache is empty.
   *
   * Not part of the OpenAPI spec yet — mocked locally.
   */
  async fetchPhoto(photoUrl: string, _signal?: AbortSignal): Promise<string | null> {
    if (!photoUrl.startsWith(PHOTO_URL_PREFIX)) return null;
    const missionId = Number(photoUrl.slice(PHOTO_URL_PREFIX.length));
    const photo = getPhotos()[missionId];
    return delay(photo ? photo.dataUrl : null);
  },

  /** POST /api/v1/missions/{missionId}/photos */
  async uploadPhoto(
    missionId: number,
    body: UploadPhotoRequest,
    _signal?: AbortSignal
  ): Promise<UploadPhotoResponse> {
    const photos = getPhotos();
    const photoId = Date.now();
    photos[missionId] = { photoId, dataUrl: body.dataUrl };
    writeJson(STORE_PHOTOS, photos);
    return delay({
      photoId,
      missionId,
      photoUrl: `${PHOTO_URL_PREFIX}${missionId}`,
    });
  },

  /** POST /api/v1/missions/{missionId}/complete */
  async complete(
    missionId: number,
    _body: CompleteMissionRequest,
    _signal?: AbortSignal
  ): Promise<CompleteMissionResponse> {
    const completed = getCompleted();
    completed[missionId] = true;
    writeJson(STORE_COMPLETED, completed);
    return delay({
      completionId: Date.now(),
      missionId,
      completedAt: new Date().toISOString(),
    });
  },
};
