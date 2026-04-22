import { httpClient, ApiError } from "./httpClient";
import type {
  GameStateRequest,
  GameStateResponse,
  IdentifyPlayerRequest,
  IdentifyPlayerResponse,
  PersistedGameState,
} from "./types";

/**
 * Players service. Wraps `/api/v1/players/*` endpoints.
 * All errors propagate to the caller — no local fallbacks.
 */

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
      throw err;
    }
  },

  /** GET /api/v1/players/{playerId}/state */
  async getState(playerId: number, signal?: AbortSignal): Promise<GameStateResponse | null> {
    try {
      return await httpClient.get<GameStateResponse>(
        `/api/v1/players/${playerId}/state`,
        { signal }
      );
    } catch (err) {
      // No saved state yet → treat as empty progress.
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },

  /** PUT /api/v1/players/{playerId}/state */
  async saveState(
    playerId: number,
    body: GameStateRequest,
    signal?: AbortSignal
  ): Promise<GameStateResponse> {
    return await httpClient.put<GameStateResponse>(
      `/api/v1/players/${playerId}/state`,
      body,
      { signal }
    );
  },

  /** Convenience: parse `stateJson` into the typed `PersistedGameState` shape. */
  parseState(state: GameStateResponse | null): PersistedGameState {
    if (!state?.stateJson) return { completedMissionIds: [] };
    try {
      const parsed = JSON.parse(state.stateJson) as Partial<PersistedGameState>;
      return {
        completedMissionIds: Array.isArray(parsed.completedMissionIds)
          ? parsed.completedMissionIds.filter((n) => typeof n === "number")
          : [],
      };
    } catch {
      return { completedMissionIds: [] };
    }
  },
};
