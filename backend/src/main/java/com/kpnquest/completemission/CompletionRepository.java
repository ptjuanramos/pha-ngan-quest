package com.kpnquest.completemission;

import io.micronaut.data.jdbc.annotation.JdbcRepository;
import io.micronaut.data.model.query.builder.sql.Dialect;
import io.micronaut.data.repository.CrudRepository;

import java.util.Optional;

@JdbcRepository(dialect = Dialect.SQL_SERVER)
public interface CompletionRepository extends CrudRepository<MissionCompletion, Long> {
    Optional<MissionCompletion> findByPlayerIdAndMissionId(Long playerId, Integer missionId);
    long countByPlayerId(Long playerId);
}
