package com.kpnquest.identifyplayer;

import com.kpnquest.shared.web.ApiResponse;
import io.micronaut.http.annotation.Body;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Post;
import io.micronaut.security.annotation.Secured;
import io.micronaut.security.rules.SecurityRule;
import jakarta.validation.Valid;

@Controller("/api/v1/players")
@Secured(SecurityRule.IS_ANONYMOUS)
public class IdentifyPlayerController {

    private final IdentifyPlayerService service;

    public IdentifyPlayerController(IdentifyPlayerService service) {
        this.service = service;
    }

    @Post("/identify")
    public ApiResponse<IdentifyPlayerResponse> identify(@Valid @Body IdentifyPlayerRequest request) {
        return ApiResponse.ok(service.identify(request));
    }
}
