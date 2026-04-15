package com.kpnquest.completemission;

import com.kpnquest.shared.web.ApiResponse;
import io.micronaut.http.annotation.Body;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.PathVariable;
import io.micronaut.http.annotation.Post;
import io.micronaut.security.annotation.Secured;
import io.micronaut.security.authentication.Authentication;
import io.micronaut.security.rules.SecurityRule;

@Controller("/api/v1/missions")
@Secured(SecurityRule.IS_AUTHENTICATED)
public class CompleteMissionController {

    private final CompleteMissionService service;

    public CompleteMissionController(CompleteMissionService service) {
        this.service = service;
    }

    @Post("/{missionId}/complete")
    public ApiResponse<CompleteMissionResponse> complete(
        @PathVariable Integer missionId,
        @Body CompleteMissionRequest request,
        Authentication authentication
    ) {
        Long playerId = Long.valueOf(authentication.getName());
        return ApiResponse.ok(service.complete(playerId, missionId));
    }
}
