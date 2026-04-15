package com.kpnquest.loadmissions;

import com.kpnquest.shared.web.ApiResponse;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import io.micronaut.security.annotation.Secured;
import io.micronaut.security.rules.SecurityRule;

import java.util.List;

@Controller("/api/v1/missions")
@Secured(SecurityRule.IS_AUTHENTICATED)
public class LoadMissionsController {

    private final LoadMissionsService service;

    public LoadMissionsController(LoadMissionsService service) {
        this.service = service;
    }

    @Get
    public ApiResponse<List<MissionResponse>> loadAll() {
        return ApiResponse.ok(service.loadAll());
    }
}
