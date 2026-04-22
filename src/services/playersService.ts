import type {
  GameStateRequest,
  GameStateResponse,
  IdentifyPlayerRequest,
  IdentifyPlayerResponse,
} from "./types";

/**
 * Mock-backed players service.
 *
 * NOTE: Backend endpoints are not yet wired up — this implementation simulates
 * `/api/v1/players/*` using `localStorage`. Replace the bodies with real
 * `httpClient` calls once the API is published. Public signatures already
 * match the OpenAPI spec.
 */

const MOCK_LATENCY_MS = 200;
const STORE_PLAYER = "mock-backend:player";
const STORE_STATE = "mock-backend:player-state";

interface StoredPlayer {
  playerId: number;
  token: string;
  deviceToken: string;
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
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

export const playersService = {
  /** POST /api/v1/players/identify */
  async identify(
    body: IdentifyPlayerRequest,
    _signal?: AbortSignal
  ): Promise<IdentifyPlayerResponse> {
    const existing = readJson<StoredPlayer>(STORE_PLAYER);
    if (existing && existing.deviceToken === body.deviceToken) {
      return delay({ playerId: existing.playerId, token: existing.token });
    }
    const player: StoredPlayer = {
      playerId: Date.now(),
      token: `mock-token-${Math.random().toString(36).slice(2, 10)}`,
      deviceToken: body.deviceToken,
    };
    writeJson(STORE_PLAYER, player);
    return delay({ playerId: player.playerId, token: player.token });
  },

  /** GET /api/v1/players/{playerId}/state */
  async getState(playerId: number, _signal?: AbortSignal): Promise<GameStateResponse> {
    const stored = readJson<GameStateResponse>(STORE_STATE);
    if (stored && stored.playerId === playerId) return delay(stored);
    const empty: GameStateResponse = {
      id: Date.now(),
      playerId,
      completedCount: 0,
      stateJson: "{}",
      updatedAt: new Date().toISOString(),
    };
    return delay(empty);
  },

  /** PUT /api/v1/players/{playerId}/state */
  async saveState(
    playerId: number,
    body: GameStateRequest,
    _signal?: AbortSignal
  ): Promise<GameStateResponse> {
    const updated: GameStateResponse = {
      id: Date.now(),
      playerId,
      completedCount: body.completedCount,
      stateJson: body.stateJson,
      updatedAt: new Date().toISOString(),
    };
    writeJson(STORE_STATE, updated);
    return delay(updated);
  },
};
