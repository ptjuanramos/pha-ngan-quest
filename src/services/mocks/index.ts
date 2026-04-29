/**
 * Local mock service layer. Activated by VITE_IS_LOCAL=true.
 * Persists fake state in localStorage so flows behave like the real backend.
 */
import { missions as missionsData } from "@/data/missions";
import type {
  ApprovePhotoRequest,
  ApprovePhotoResponse,
  CompleteMissionRequest,
  CompleteMissionResponse,
  IdentifyPlayerRequest,
  IdentifyPlayerResponse,
  MissionResponse,
  MissionStatusResponse,
  PhotoResponse,
  PlayerCompletionResponse,
  PlayerMissionStatusResponse,
  ResetProgressResponse,
  UploadPhotoRequest,
  UploadPhotoResponse,
  ValidatePhotoResponse,
} from "../types";
import { ApiError } from "../httpClient";

const COMPLETIONS_KEY = "kpn-mock-completions"; // { [playerId]: { [missionId]: isoDate } }
const PHOTOS_KEY = "kpn-mock-photos"; // { [playerId:missionId]: { photoId, dataUrl, status } }
const PLAYERS_KEY = "kpn-mock-players"; // { [username]: { playerId, isAdmin } }

const ADMIN_USERNAMES = new Set(["admin", "bruno"]);

function delay(ms = 200) {
  return new Promise((r) => setTimeout(r, ms));
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
    /* ignore quota */
  }
}

type CompletionsMap = Record<string, Record<string, string>>;
type PhotosMap = Record<string, { photoId: number; dataUrl: string; status: string }>;
type PlayersMap = Record<string, { playerId: number; isAdmin: boolean }>;

function getPlayers(): PlayersMap {
  return readJson<PlayersMap>(PLAYERS_KEY, {});
}
function savePlayers(p: PlayersMap) {
  writeJson(PLAYERS_KEY, p);
}

function getCompletions(): CompletionsMap {
  return readJson<CompletionsMap>(COMPLETIONS_KEY, {});
}
function saveCompletions(c: CompletionsMap) {
  writeJson(COMPLETIONS_KEY, c);
}

function getPhotos(): PhotosMap {
  return readJson<PhotosMap>(PHOTOS_KEY, {});
}
function savePhotos(p: PhotosMap) {
  writeJson(PHOTOS_KEY, p);
}

/** Build a fake unsigned JWT compatible with our `decodeJwt` reader. */
function fakeJwt(payload: Record<string, unknown>): string {
  const enc = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${enc({ alg: "none", typ: "JWT" })}.${enc(payload)}.mock`;
}

let nextPhotoId = 1000;

// ----------------- mock services -----------------

export const mockMissionsService = {
  async loadAll(): Promise<MissionResponse[]> {
    await delay(50);
    return missionsData.map((m) => ({ ...m }));
  },

  async getPhoto(playerId: number, missionId: number): Promise<PhotoResponse | null> {
    await delay(30);
    const photo = getPhotos()[`${playerId}:${missionId}`];
    if (!photo) return null;
    return { photoId: photo.photoId, blobUrl: photo.dataUrl, validationStatus: photo.status };
  },

  async fetchPhotoData(blobUrl: string): Promise<string | null> {
    // In mock mode `blobUrl` is already a data URL.
    return blobUrl?.startsWith("data:") ? blobUrl : null;
  },

  async uploadPhoto(missionId: number, body: UploadPhotoRequest): Promise<UploadPhotoResponse> {
    await delay(150);
    const playerId = getCurrentPlayerId();
    const photoId = ++nextPhotoId;
    const photos = getPhotos();
    photos[`${playerId}:${missionId}`] = {
      photoId,
      dataUrl: body.base64Content,
      status: "PENDING",
    };
    savePhotos(photos);
    return { photoId, missionId, blobUrl: body.base64Content, validationStatus: "PENDING" };
  },

  async complete(
    missionId: number,
    _body: CompleteMissionRequest
  ): Promise<CompleteMissionResponse> {
    await delay(80);
    const playerId = getCurrentPlayerId();
    const completions = getCompletions();
    const playerKey = String(playerId);
    completions[playerKey] = completions[playerKey] || {};
    const completedAt = new Date().toISOString();
    completions[playerKey][String(missionId)] = completedAt;
    saveCompletions(completions);

    const photos = getPhotos();
    const key = `${playerId}:${missionId}`;
    if (photos[key]) {
      photos[key].status = "APPROVED";
      savePhotos(photos);
    }
    return { completionId: Date.now(), missionId, completedAt };
  },

  async approvePhoto(
    _missionId: number,
    photoId: number,
    body: ApprovePhotoRequest
  ): Promise<ApprovePhotoResponse> {
    await delay(50);
    const photos = getPhotos();
    for (const key of Object.keys(photos)) {
      if (photos[key].photoId === photoId) {
        photos[key].status = body.approved ? "APPROVED" : "REJECTED";
        savePhotos(photos);
        return { photoId, validationStatus: photos[key].status };
      }
    }
    return { photoId, validationStatus: body.approved ? "APPROVED" : "REJECTED" };
  },

  async adminSkip(missionId: number): Promise<CompleteMissionResponse> {
    const upload = await this.uploadPhoto(missionId, {
      base64Content:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    });
    await this.approvePhoto(missionId, upload.photoId, { approved: true });
    return await this.complete(missionId, { photoId: upload.photoId });
  },

  async adminReset(): Promise<ResetProgressResponse> {
    await delay(80);
    const completions = getCompletions();
    const photos = getPhotos();
    const deletedCompletions = Object.values(completions).reduce(
      (acc, m) => acc + Object.keys(m).length,
      0
    );
    const deletedPhotos = Object.keys(photos).length;
    saveCompletions({});
    savePhotos({});
    try {
      sessionStorage.removeItem("kpn-photo-cache");
    } catch {
      /* ignore */
    }
    return { deletedCompletions, deletedPhotos };
  },
};

export const mockPlayersService = {
  async identify(body: IdentifyPlayerRequest): Promise<IdentifyPlayerResponse> {
    await delay(120);
    const username = body.username.trim();
    if (!username) {
      throw new ApiError({ code: "INVALID", message: "Nome inválido." }, 400);
    }
    const players = getPlayers();
    const key = username.toLowerCase();
    let entry = players[key];
    const shouldBeAdmin = ADMIN_USERNAMES.has(key);
    if (!entry) {
      entry = {
        playerId: Math.floor(Math.random() * 1_000_000) + 1,
        isAdmin: shouldBeAdmin,
      };
      players[key] = entry;
      savePlayers(players);
    } else if (entry.isAdmin !== shouldBeAdmin) {
      entry.isAdmin = shouldBeAdmin;
      players[key] = entry;
      savePlayers(players);
    }
    setCurrentPlayerId(entry.playerId);
    const token = fakeJwt({ username, is_admin: entry.isAdmin, sub: String(entry.playerId) });
    return { playerId: entry.playerId, token };
  },

  async listCompletions(playerId: number): Promise<PlayerCompletionResponse[]> {
    await delay(40);
    setCurrentPlayerId(playerId);
    const map = getCompletions()[String(playerId)] ?? {};
    return Object.entries(map).map(([missionId, completedAt]) => ({
      missionId: Number(missionId),
      completedAt,
    }));
  },
};

export const mockPhotoValidationService = {
  async validate(): Promise<ValidatePhotoResponse> {
    await delay(300);
    return { valid: true, reason: "mock" };
  },
};

export const mockAdminService = {
  async listAllMissions(): Promise<PlayerMissionStatusResponse[]> {
    await delay(120);
    const players = getPlayers();
    const completions = getCompletions();
    const photos = getPhotos();

    const entries = Object.entries(players);
    if (entries.length === 0) return [];

    return entries
      .map(([, info]) => {
        const playerCompletions = completions[String(info.playerId)] ?? {};
        const missions: MissionStatusResponse[] = missionsData.map((m) => {
          const completedAt = playerCompletions[String(m.id)];
          const photo = photos[`${info.playerId}:${m.id}`];
          return {
            missionId: m.id,
            title: m.title,
            completed: Boolean(completedAt),
            completedAt: completedAt ?? "",
            photoUrl: photo?.dataUrl ?? "",
            validationStatus: photo?.status ?? "NONE",
          };
        });
        const username =
          Object.keys(players).find((u) => players[u].playerId === info.playerId) ?? "?";
        return { playerId: info.playerId, username, missions };
      })
      .filter((p) => !ADMIN_USERNAMES.has(p.username.toLowerCase()));
  },
};

// ---- helpers to track "current" player for upload/complete in mocks ----
let currentPlayerId: number | null = null;
function setCurrentPlayerId(id: number) {
  currentPlayerId = id;
  try {
    sessionStorage.setItem("kpn-mock-current-player", String(id));
  } catch {
    /* ignore */
  }
}
function getCurrentPlayerId(): number {
  if (currentPlayerId != null) return currentPlayerId;
  try {
    const raw = sessionStorage.getItem("kpn-mock-current-player");
    if (raw) return Number(raw);
  } catch {
    /* ignore */
  }
  return 0;
}
