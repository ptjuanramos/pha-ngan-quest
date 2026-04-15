package com.kpnquest.uploadphoto;

import io.micronaut.data.annotation.GeneratedValue;
import io.micronaut.data.annotation.Id;
import io.micronaut.data.annotation.MappedEntity;
import io.micronaut.data.annotation.MappedProperty;

import java.time.LocalDateTime;

@MappedEntity("photos")
public record Photo(
    @Id @GeneratedValue Long id,
    @MappedProperty("player_id") Long playerId,
    @MappedProperty("mission_id") Integer missionId,
    @MappedProperty("data_url") String dataUrl,
    @MappedProperty("created_at") LocalDateTime createdAt,
    @MappedProperty("updated_at") LocalDateTime updatedAt
) {}
