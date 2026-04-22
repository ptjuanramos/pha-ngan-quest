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
  /** Whether this mission has already been completed by the current player. */
  isComplete: boolean;
  /**
   * URL (or opaque reference) to the proof photo blob, when available.
   * `null` until the player uploads a photo for this mission.
   * The frontend lazily resolves this URL into image data only when its
   * local state cache is empty.
   */
  photoUrl: string | null;
}

export interface UploadPhotoRequest {
  dataUrl: string;
}

export interface UploadPhotoResponse {
  photoId: number;
  missionId: number;
  /** URL to retrieve the stored photo blob. */
  photoUrl: string;
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
