package com.kpnquest.identifyplayer;

import io.micronaut.data.jdbc.annotation.JdbcRepository;
import io.micronaut.data.model.query.builder.sql.Dialect;
import io.micronaut.data.repository.CrudRepository;

import java.util.Optional;

@JdbcRepository(dialect = Dialect.SQL_SERVER)
public interface PlayerRepository extends CrudRepository<Player, Long> {
    Optional<Player> findByDeviceToken(String deviceToken);
}
