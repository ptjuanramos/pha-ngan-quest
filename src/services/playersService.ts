import { httpClient } from "./httpClient";
import type {
  GameStateRequest,
  GameStateResponse,
  IdentifyPlayerRequest,
  IdentifyPlayerResponse,
} from "./types";

export const playersService = {
  /** POST /api/v1/players/identify */
  identify(
    body: IdentifyPlayerRequest,
    signal?: AbortSignal
  ): Promise<IdentifyPlayerResponse> {
    return httpClient.post<IdentifyPlayerResponse>(
      "/api/v1/players/identify",
      body,
      { signal }
    );
  },

  /** GET /api/v1/players/{playerId}/state */
  getState(playerId: number, signal?: AbortSignal): Promise<GameStateResponse> {
    return httpClient.get<GameStateResponse>(
      `/api/v1/players/${playerId}/state`,
      { signal }
    );
  },

  /** PUT /api/v1/players/{playerId}/state */
  saveState(
    playerId: number,
    body: GameStateRequest,
    signal?: AbortSignal
  ): Promise<GameStateResponse> {
    return httpClient.put<GameStateResponse>(
      `/api/v1/players/${playerId}/state`,
      body,
      { signal }
    );
  },
};
