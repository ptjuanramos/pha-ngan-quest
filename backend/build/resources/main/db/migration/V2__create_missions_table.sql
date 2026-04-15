CREATE TABLE missions (
    id            INT            PRIMARY KEY,
    title         NVARCHAR(255)  NOT NULL,
    clue          NVARCHAR(1000) NOT NULL,
    location_hint NVARCHAR(500)  NOT NULL,
    challenge     NVARCHAR(1000) NOT NULL,
    is_spicy      BIT            NOT NULL DEFAULT 0,
    created_at    DATETIME2      NOT NULL,
    updated_at    DATETIME2      NOT NULL
);
