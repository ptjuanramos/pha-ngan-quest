package com.kpnquest.syncgamestate;

import java.time.LocalDateTime;

public record GameStateResponse(
    Long id,
    Long playerId,
    int completedCount,
    String stateJson,
    LocalDateTime updatedAt
) {}
