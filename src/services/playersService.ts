import { httpClient, ApiError } from "./httpClient";
import type {
  IdentifyPlayerRequest,
  IdentifyPlayerResponse,
  PlayerCompletionResponse,
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

  /** GET /api/v1/players/{playerId}/completions */
  async listCompletions(
    playerId: number,
    signal?: AbortSignal
  ): Promise<PlayerCompletionResponse[]> {
    const data = await httpClient.get<PlayerCompletionResponse[]>(
      `/api/v1/players/${playerId}/completions`,
      { signal }
    );
    return Array.isArray(data) ? data : [];
  },
};
