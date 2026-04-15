package com.kpnquest.uploadphoto;

import com.kpnquest.shared.web.ApiResponse;
import io.micronaut.http.annotation.Body;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.PathVariable;
import io.micronaut.http.annotation.Post;
import io.micronaut.security.annotation.Secured;
import io.micronaut.security.authentication.Authentication;
import io.micronaut.security.rules.SecurityRule;
import jakarta.validation.Valid;

@Controller("/api/v1/missions")
@Secured(SecurityRule.IS_AUTHENTICATED)
public class UploadPhotoController {

    private final UploadPhotoService service;

    public UploadPhotoController(UploadPhotoService service) {
        this.service = service;
    }

    @Post("/{missionId}/photos")
    public ApiResponse<UploadPhotoResponse> upload(
        @PathVariable Integer missionId,
        @Valid @Body UploadPhotoRequest request,
        Authentication authentication
    ) {
        Long playerId = Long.valueOf(authentication.getName());
        return ApiResponse.ok(service.upload(playerId, missionId, request.dataUrl()));
    }
}
