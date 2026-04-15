CREATE TABLE photos (
    id         BIGINT        IDENTITY(1,1) PRIMARY KEY,
    player_id  BIGINT        NOT NULL REFERENCES players(id),
    mission_id INT           NOT NULL REFERENCES missions(id),
    data_url   NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2     NOT NULL,
    updated_at DATETIME2     NOT NULL,
    CONSTRAINT uq_photos_player_mission UNIQUE (player_id, mission_id)
);
