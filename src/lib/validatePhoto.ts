import { photoValidationService } from "@/services/photoValidationService";

export interface ValidatePhotoInput {
  photo: string; // base64 data URL
  missionId: number;
  challenge: string;
  title: string;
}

export interface ValidatePhotoResult {
  valid: boolean;
  reason?: string;
}

/**
 * Thin adapter around `photoValidationService`. Kept for backwards-compat
 * with existing callers — new code should call the service directly.
 */
export async function validatePhoto(
  input: ValidatePhotoInput
): Promise<ValidatePhotoResult> {
  return photoValidationService.validate({
    dataUrl: input.photo,
    missionId: input.missionId,
    challenge: input.challenge,
    title: input.title,
  });
}
