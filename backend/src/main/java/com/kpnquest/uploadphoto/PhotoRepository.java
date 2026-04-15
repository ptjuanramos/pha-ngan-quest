package com.kpnquest.uploadphoto;

import io.micronaut.data.jdbc.annotation.JdbcRepository;
import io.micronaut.data.model.query.builder.sql.Dialect;
import io.micronaut.data.repository.CrudRepository;

import java.util.Optional;

@JdbcRepository(dialect = Dialect.SQL_SERVER)
public interface PhotoRepository extends CrudRepository<Photo, Long> {
    Optional<Photo> findByPlayerIdAndMissionId(Long playerId, Integer missionId);
}
