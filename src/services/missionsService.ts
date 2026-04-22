import { httpClient } from "./httpClient";
import type {
  CompleteMissionRequest,
  CompleteMissionResponse,
  MissionResponse,
  UploadPhotoRequest,
  UploadPhotoResponse,
} from "./types";

export const missionsService = {
  /** GET /api/v1/missions */
  loadAll(signal?: AbortSignal): Promise<MissionResponse[]> {
    return httpClient.get<MissionResponse[]>("/api/v1/missions", { signal });
  },

  /** POST /api/v1/missions/{missionId}/photos */
  uploadPhoto(
    missionId: number,
    body: UploadPhotoRequest,
    signal?: AbortSignal
  ): Promise<UploadPhotoResponse> {
    return httpClient.post<UploadPhotoResponse>(
      `/api/v1/missions/${missionId}/photos`,
      body,
      { signal }
    );
  },

  /** POST /api/v1/missions/{missionId}/complete */
  complete(
    missionId: number,
    body: CompleteMissionRequest,
    signal?: AbortSignal
  ): Promise<CompleteMissionResponse> {
    return httpClient.post<CompleteMissionResponse>(
      `/api/v1/missions/${missionId}/complete`,
      body,
      { signal }
    );
  },
};
