CREATE TABLE game_states (
    id              BIGINT        IDENTITY(1,1) PRIMARY KEY,
    player_id       BIGINT        NOT NULL UNIQUE REFERENCES players(id),
    completed_count INT           NOT NULL DEFAULT 0,
    state_json      NVARCHAR(MAX) NOT NULL DEFAULT '{}',
    created_at      DATETIME2     NOT NULL,
    updated_at      DATETIME2     NOT NULL
);
