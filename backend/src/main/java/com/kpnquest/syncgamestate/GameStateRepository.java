package com.kpnquest.syncgamestate;

import io.micronaut.data.jdbc.annotation.JdbcRepository;
import io.micronaut.data.model.query.builder.sql.Dialect;
import io.micronaut.data.repository.CrudRepository;

import java.util.Optional;

@JdbcRepository(dialect = Dialect.SQL_SERVER)
public interface GameStateRepository extends CrudRepository<GameState, Long> {
    Optional<GameState> findByPlayerId(Long playerId);
}
