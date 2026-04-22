/**
 * Photo validation service.
 *
 * NOTE: This endpoint is NOT yet defined in the backend OpenAPI spec.
 * The implementation below returns MOCK data so the UI flow is testable
 * end-to-end. Replace the body of `validate` with a real `httpClient` call
 * once the endpoint is published.
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

export const photoValidationService = {
  /**
   * Mock validation. Resolves after a short delay.
   *
   * Behavior (mock):
   * - ~80% of calls return `{ valid: true }`
   * - ~20% return `{ valid: false, reason: "..." }`
   *
   * TODO: replace with real HTTP call, e.g.:
   *   return httpClient.post<ValidatePhotoResponse>(
   *     `/api/v1/missions/${missionId}/photos/validate`,
   *     { dataUrl }
   *   );
   */
  async validate(req: ValidatePhotoRequest): Promise<ValidatePhotoResponse> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const isValid = Math.random() < 0.8;
    if (isValid) {
      return { valid: true };
    }
    return {
      valid: false,
      reason: "A foto não parece corresponder ao desafio. Tenta novamente.",
    };
  },
};
