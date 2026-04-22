import { httpClient, ApiError } from "./httpClient";

/**
 * Photo validation service.
 *
 * Issues a real HTTP request first (visible in DevTools) and falls back to a
 * mock outcome when the endpoint is unavailable — so the UI flow remains
 * testable until the backend is wired up.
 */

export interface ValidatePhotoRequest {
  /** base64 data URL of the captured photo */
  dataUrl: string;
  missionId: number;
  challenge: string;
  title: string;
}

export interface ValidatePhotoResponse {
  valid: boolean;
  reason?: string;
}

function isBackendUnavailable(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.status === 0 || err.status === 404 || err.status >= 500;
  }
  return true;
}

function mockValidate(): ValidatePhotoResponse {
  const isValid = Math.random() < 0.8;
  if (isValid) return { valid: true };
  return {
    valid: false,
    reason: "A foto não parece corresponder ao desafio. Tenta novamente.",
  };
}

export const photoValidationService = {
  async validate(req: ValidatePhotoRequest): Promise<ValidatePhotoResponse> {
    try {
      return await httpClient.post<ValidatePhotoResponse>(
        `/api/v1/missions/${req.missionId}/photos/validate`,
        { dataUrl: req.dataUrl, challenge: req.challenge, title: req.title }
      );
    } catch (err) {
      if (!isBackendUnavailable(err)) throw err;
      // Simulate latency only for the mock fallback.
      await new Promise((resolve) => setTimeout(resolve, 800));
      return mockValidate();
    }
  },
};
