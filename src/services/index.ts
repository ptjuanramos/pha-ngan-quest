export { httpClient, ApiError } from "./httpClient";

import { missionsService as realMissionsService } from "./missionsService";
import { playersService as realPlayersService } from "./playersService";
import { photoValidationService as realPhotoValidationService } from "./photoValidationService";
import { adminService as realAdminService } from "./adminService";
import {
  mockMissionsService,
  mockPlayersService,
  mockPhotoValidationService,
  mockAdminService,
} from "./mocks";

const IS_LOCAL = import.meta.env.VITE_IS_LOCAL === "true";

export const missionsService = (IS_LOCAL ? mockMissionsService : realMissionsService) as
  typeof realMissionsService;
export const playersService = (IS_LOCAL ? mockPlayersService : realPlayersService) as
  typeof realPlayersService;
export const photoValidationService = (IS_LOCAL
  ? mockPhotoValidationService
  : realPhotoValidationService) as typeof realPhotoValidationService;
export const adminService = (IS_LOCAL ? mockAdminService : realAdminService) as
  typeof realAdminService;

export { mergeMissionsWithCompletions } from "./missionsService";
export type * from "./types";
