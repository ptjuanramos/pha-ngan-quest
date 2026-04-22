import { httpClient, ApiError } from "./httpClient";
import type {
  GameStateRequest,
  GameStateResponse,
  IdentifyPlayerRequest,
  IdentifyPlayerResponse,
} from "./types";

/**
 * Players service.
 *
 * Each method issues a real HTTP request first (so it shows up in DevTools and
 * is trivial to wire up once the backend is live). When the endpoint is not
 * available yet, we fall back to a `localStorage`-backed mock to keep the UI
 * flow working end-to-end.
 */

const STORE_PLAYER = "mock-backend:player";
const STORE_STATE = "mock-backend:player-state";

interface StoredPlayer {
  playerId: number;
  token: string;
  username: string;
}

/** Build a fake but valid-looking JWT (header.payload.signature) for the mock. */
function buildMockJwt(payload: Record<string, unknown>): string {
  const enc = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const header = enc({ alg: "none", typ: "JWT" });
  const body = enc(payload);
  return `${header}.${body}.mock-signature`;
}

function readJson<T>(key: string, fallback: T | null = null): T | null {
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
    // ignore
  }
}

function isBackendUnavailable(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.status === 0 || err.status === 404 || err.status >= 500;
  }
  return true;
}

export const playersService = {
  /** POST /api/v1/players/identify */
  async identify(
    body: IdentifyPlayerRequest,
    signal?: AbortSignal
  ): Promise<IdentifyPlayerResponse> {
    try {
      return await httpClient.post<IdentifyPlayerResponse>(
        "/api/v1/players/identify",
        body,
        { signal }
      );
    } catch (err) {
      if (!isBackendUnavailable(err)) throw err;
      const existing = readJson<StoredPlayer>(STORE_PLAYER);
      if (existing && existing.deviceToken === body.deviceToken) {
        return { playerId: existing.playerId, token: existing.token };
      }
      const player: StoredPlayer = {
        playerId: Date.now(),
        token: `mock-token-${Math.random().toString(36).slice(2, 10)}`,
        deviceToken: body.deviceToken,
      };
      writeJson(STORE_PLAYER, player);
      return { playerId: player.playerId, token: player.token };
    }
  },

  /** GET /api/v1/players/{playerId}/state */
  async getState(playerId: number, signal?: AbortSignal): Promise<GameStateResponse> {
    try {
      return await httpClient.get<GameStateResponse>(
        `/api/v1/players/${playerId}/state`,
        { signal }
      );
    } catch (err) {
      if (!isBackendUnavailable(err)) throw err;
      const stored = readJson<GameStateResponse>(STORE_STATE);
      if (stored && stored.playerId === playerId) return stored;
      return {
        id: Date.now(),
        playerId,
        completedCount: 0,
        stateJson: "{}",
        updatedAt: new Date().toISOString(),
      };
    }
  },

  /** PUT /api/v1/players/{playerId}/state */
  async saveState(
    playerId: number,
    body: GameStateRequest,
    signal?: AbortSignal
  ): Promise<GameStateResponse> {
    try {
      return await httpClient.put<GameStateResponse>(
        `/api/v1/players/${playerId}/state`,
        body,
        { signal }
      );
    } catch (err) {
      if (!isBackendUnavailable(err)) throw err;
      const updated: GameStateResponse = {
        id: Date.now(),
        playerId,
        completedCount: body.completedCount,
        stateJson: body.stateJson,
        updatedAt: new Date().toISOString(),
      };
      writeJson(STORE_STATE, updated);
      return updated;
    }
  },
};
