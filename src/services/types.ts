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
 * derived from the player's saved game state.
 */
export interface MissionWithProgress extends MissionResponse {
  isComplete: boolean;
  /** Opaque reference used by the client to resolve the proof photo. */
  photoUrl: string | null;
}

export interface UploadPhotoRequest {
  /** Base64 data URL of the captured photo. */
  dataUrl: string;
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
  deviceToken: string;
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

/**
 * Shape persisted inside `GameStateResponse.stateJson`. The client owns the
 * format — the backend only stores it as an opaque string.
 */
export interface PersistedGameState {
  completedMissionIds: number[];
}
