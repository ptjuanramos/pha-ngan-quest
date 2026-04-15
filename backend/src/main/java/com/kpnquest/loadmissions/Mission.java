package com.kpnquest.loadmissions;

import io.micronaut.data.annotation.Id;
import io.micronaut.data.annotation.MappedEntity;
import io.micronaut.data.annotation.MappedProperty;

import java.time.LocalDateTime;

@MappedEntity("missions")
public record Mission(
    @Id Integer id,
    String title,
    String clue,
    @MappedProperty("location_hint") String locationHint,
    String challenge,
    @MappedProperty("is_spicy") boolean isSpicy,
    @MappedProperty("created_at") LocalDateTime createdAt,
    @MappedProperty("updated_at") LocalDateTime updatedAt
) {}
