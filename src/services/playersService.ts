import { httpClient, ApiError } from "./httpClient";
import type {
  IdentifyPlayerRequest,
  IdentifyPlayerResponse,
  PlayerCompletionResponse,
} from "./types";

/**
 * Players service. Wraps `/api/v1/players/*` endpoints.
 *
 * `identify` falls back to a localStorage-backed mock when the backend is
 * unreachable so the UI flow stays exercisable in standalone dev. Other
 * methods surface API errors to the caller.
 */

const STORE_PLAYER = "mock-backend:player";

interface StoredPlayer {
  playerId: number;
  token: string;
  username: string;
}

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

function friendlyAuthMessage(status: number): string {
  if (status === 401) return "Não autorizado. Verifica o teu nome e tenta novamente.";
  if (status === 403) return "Acesso negado. Não tens permissão para entrar.";
  return "Não foi possível autenticar.";
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
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        throw new ApiError(
          { code: err.code || `HTTP_${err.status}`, message: friendlyAuthMessage(err.status) },
          err.status
        );
      }
      if (!isBackendUnavailable(err)) throw err;
      const username = body.username.trim();
      if (!username) {
        throw new ApiError(
          { code: "INVALID_USERNAME", message: "Username é obrigatório." },
          400
        );
      }
      const existing = readJson<StoredPlayer>(STORE_PLAYER);
      if (existing && existing.username === username) {
        return { playerId: existing.playerId, token: existing.token };
      }
      const isAdmin = /admin/i.test(username);
      const playerId = Date.now();
      const token = buildMockJwt({
        sub: String(playerId),
        username,
        is_admin: isAdmin,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
      });
      const player: StoredPlayer = { playerId, token, username };
      writeJson(STORE_PLAYER, player);
      return { playerId, token };
    }
  },

  /** GET /api/v1/players/{playerId}/completions */
  async listCompletions(
    playerId: number,
    signal?: AbortSignal
  ): Promise<PlayerCompletionResponse[]> {
    try {
      const data = await httpClient.get<PlayerCompletionResponse[]>(
        `/api/v1/players/${playerId}/completions`,
        { signal }
      );
      return Array.isArray(data) ? data : [];
    } catch (err) {
      if (!isBackendUnavailable(err)) throw err;
      // Mock fallback: derive from local completion store used by missionsService.
      try {
        const raw = localStorage.getItem("mock-backend:missions:completed");
        const map = raw ? (JSON.parse(raw) as Record<number, true>) : {};
        return Object.keys(map).map((id) => ({
          missionId: Number(id),
          completedAt: new Date().toISOString(),
        }));
      } catch {
        return [];
      }
    }
  },
};
