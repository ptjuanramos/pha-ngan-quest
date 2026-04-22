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
 * that the backend does not (currently) return per-player.
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
}

export interface CompleteMissionRequest {
  photoId: number;
}

export interface CompleteMissionResponse {
  completionId: number;
  missionId: number;
  completedAt: string;
}

// ----- Players -----
export interface IdentifyPlayerRequest {
  username: string;
}

export interface IdentifyPlayerResponse {
  playerId: number;
  token: string;
}

export interface GameStateRequest {
  completedCount: number;
  stateJson: string;
}

export interface GameStateResponse {
  id: number;
  playerId: number;
  completedCount: number;
  stateJson: string;
  updatedAt: string;
}
