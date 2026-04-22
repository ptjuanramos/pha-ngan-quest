import { photoValidationService } from "@/services/photoValidationService";

export interface ValidatePhotoInput {
  photo: string; // base64 data URL
  missionId: number;
  playerId: number;
}

export interface ValidatePhotoResult {
  valid: boolean;
  reason?: string;
}

const DEFAULT_INVALID_REASON =
  "Não conseguimos validar. Por favor, envia a prova novamente.";

/**
 * Thin adapter around `photoValidationService`. Kept for backwards-compat
 * with existing callers — new code should call the service directly.
 */
export async function validatePhoto(
  input: ValidatePhotoInput
): Promise<ValidatePhotoResult> {
  const result = await photoValidationService.validate({
    dataUrl: input.photo,
    missionId: input.missionId,
    playerId: input.playerId,
  });

  if (!result.valid) {
    return {
      valid: false,
      reason: result.reason || DEFAULT_INVALID_REASON,
    };
  }

  return { valid: true };
}
