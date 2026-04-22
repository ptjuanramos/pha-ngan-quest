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

export interface UploadPhotoRequest {
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
