package com.kpnquest.completemission;

import io.micronaut.data.annotation.GeneratedValue;
import io.micronaut.data.annotation.Id;
import io.micronaut.data.annotation.MappedEntity;
import io.micronaut.data.annotation.MappedProperty;

import java.time.LocalDateTime;

@MappedEntity("mission_completions")
public record MissionCompletion(
    @Id @GeneratedValue Long id,
    @MappedProperty("player_id") Long playerId,
    @MappedProperty("mission_id") Integer missionId,
    @MappedProperty("completed_at") LocalDateTime completedAt,
    @MappedProperty("created_at") LocalDateTime createdAt,
    @MappedProperty("updated_at") LocalDateTime updatedAt
) {}
