package com.kpnquest.syncgamestate;

import io.micronaut.data.annotation.GeneratedValue;
import io.micronaut.data.annotation.Id;
import io.micronaut.data.annotation.MappedEntity;
import io.micronaut.data.annotation.MappedProperty;

import java.time.LocalDateTime;

@MappedEntity("game_states")
public record GameState(
    @Id @GeneratedValue Long id,
    @MappedProperty("player_id") Long playerId,
    @MappedProperty("completed_count") int completedCount,
    @MappedProperty("state_json") String stateJson,
    @MappedProperty("created_at") LocalDateTime createdAt,
    @MappedProperty("updated_at") LocalDateTime updatedAt
) {}
