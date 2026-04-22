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
 * Validate a mission photo against its challenge.
 *
 * TODO: replace this mock with a real backend call, e.g.:
 *
 *   const res = await fetch("/api/validate-photo", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify(input),
 *   });
 *   if (!res.ok) throw new Error("Validation request failed");
 *   return (await res.json()) as ValidatePhotoResult;
 */
export async function validatePhoto(
  _input: ValidatePhotoInput
): Promise<ValidatePhotoResult> {
  // Temporary mock so the UI flow is testable end-to-end.
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { valid: true };
}
