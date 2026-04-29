// Generated from api-spec.yml — keep in sync with backend OpenAPI schema.

export interface ErrorBody {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  data: T;
  error: ErrorBody | null;
}

// ----- Missions -----
export interface MissionResponse {
  id: number;
  title: string;
  clue: string;
  locationHint: string;
  challenge: string;
  isSpicy: boolean;
}

/**
 * Client-side augmented mission, including local completion + photo state
 * derived from the player's completions endpoint.
 */
export interface MissionWithProgress extends MissionResponse {
  isComplete: boolean;
  /** Opaque reference used by the client to resolve the proof photo. */
  photoUrl: string | null;
}

export interface UploadPhotoRequest {
  /** Base64-encoded image content (data URL or raw base64). */
  base64Content: string;
}

export interface UploadPhotoResponse {
  photoId: number;
  missionId: number;
  blobUrl: string;
  validationStatus: string;
}

export interface ValidatePhotoRequest {
  playerId: number;
  /** base64 data URL of the captured photo. */
  photo: string;
}

export interface ValidatePhotoResponse {
  valid: boolean;
  reason: string;
}

export interface ApprovePhotoRequest {
  approved: boolean;
}

export interface ApprovePhotoResponse {
  photoId: number;
  validationStatus: string;
}

export interface CompleteMissionRequest {
  photoId: number;
}

export interface CompleteMissionResponse {
  completionId: number;
  missionId: number;
  completedAt: string;
}

export interface PhotoResponse {
  photoId: number;
  blobUrl: string;
  validationStatus: string;
}

// ----- Players -----
export interface IdentifyPlayerRequest {
  username: string;
}

export interface IdentifyPlayerResponse {
  playerId: number;
  token: string;
}

export interface PlayerCompletionResponse {
  missionId: number;
  completedAt: string;
}

// ----- Admin -----
export interface ResetProgressResponse {
  deletedCompletions: number;
  deletedPhotos: number;
}

export interface MissionStatusResponse {
  missionId: number;
  title: string;
  completed: boolean;
  completedAt: string;
  photoUrl: string;
  validationStatus: string;
}

export interface PlayerMissionStatusResponse {
  playerId: number;
  username: string;
  missions: MissionStatusResponse[];
}
