CREATE TABLE players (
    id           BIGINT        IDENTITY(1,1) PRIMARY KEY,
    device_token NVARCHAR(512) NOT NULL UNIQUE,
    created_at   DATETIME2     NOT NULL,
    updated_at   DATETIME2     NOT NULL
);
