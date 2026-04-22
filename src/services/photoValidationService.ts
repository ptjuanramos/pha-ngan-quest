import { httpClient } from "./httpClient";
import type { ValidatePhotoResponse } from "./types";

/**
 * Photo validation service. Wraps
 *   POST /api/v1/missions/{missionId}/photos/validate
 */

export interface ValidatePhotoInput {
  /** base64 data URL of the captured photo */
  dataUrl: string;
  missionId: number;
  playerId: number;
}

export const photoValidationService = {
  async validate(req: ValidatePhotoInput): Promise<ValidatePhotoResponse> {
    return await httpClient.post<ValidatePhotoResponse>(
      `/api/v1/missions/${req.missionId}/photos/validate`,
      { playerId: req.playerId, photo: req.dataUrl }
    );
  },
};
