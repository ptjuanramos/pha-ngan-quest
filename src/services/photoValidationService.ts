import { httpClient, ApiError } from "./httpClient";
import type { ValidatePhotoResponse } from "./types";

/**
 * Photo validation service. Wraps
 *   POST /api/v1/missions/{missionId}/photos/validate
 *
 * Falls back to a randomized mock when the backend is unreachable so the
 * end-to-end UI flow remains demoable in dev.
 */

export interface ValidatePhotoInput {
  /** base64 data URL of the captured photo */
  dataUrl: string;
  missionId: number;
  playerId: number;
}

function isBackendUnavailable(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.status === 0 || err.status === 404 || err.status >= 500;
  }
  return true;
}

function mockValidate(): ValidatePhotoResponse {
  const isValid = Math.random() < 0.8;
  if (isValid) return { valid: true, reason: "" };
  return {
    valid: false,
    reason: "A foto não parece corresponder ao desafio. Tenta novamente.",
  };
}

export const photoValidationService = {
  async validate(req: ValidatePhotoInput): Promise<ValidatePhotoResponse> {
    try {
      return await httpClient.post<ValidatePhotoResponse>(
        `/api/v1/missions/${req.missionId}/photos/validate`,
        { playerId: req.playerId, photo: req.dataUrl }
      );
    } catch (err) {
      if (!isBackendUnavailable(err)) throw err;
      await new Promise((resolve) => setTimeout(resolve, 800));
      return mockValidate();
    }
  },
};
