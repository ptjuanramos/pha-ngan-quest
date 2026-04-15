package com.kpnquest.syncgamestate;

import com.kpnquest.shared.web.ApiResponse;
import io.micronaut.http.annotation.Body;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.PathVariable;
import io.micronaut.http.annotation.Put;
import io.micronaut.security.annotation.Secured;
import io.micronaut.security.authentication.Authentication;
import io.micronaut.security.rules.SecurityRule;

@Controller("/api/v1/players")
@Secured(SecurityRule.IS_AUTHENTICATED)
public class SyncGameStateController {

    private final SyncGameStateService service;

    public SyncGameStateController(SyncGameStateService service) {
        this.service = service;
    }

    @Get("/{playerId}/state")
    public ApiResponse<GameStateResponse> get(@PathVariable Long playerId, Authentication authentication) {
        Long requestingPlayerId = Long.valueOf(authentication.getName());
        return ApiResponse.ok(service.get(requestingPlayerId));
    }

    @Put("/{playerId}/state")
    public ApiResponse<GameStateResponse> save(
        @PathVariable Long playerId,
        @Body GameStateRequest request,
        Authentication authentication
    ) {
        Long requestingPlayerId = Long.valueOf(authentication.getName());
        return ApiResponse.ok(service.save(requestingPlayerId, request));
    }
}
