---
paths:
  - "backend/**"
---

# Backend architecture

## Stack

- Micronaut 4.x, Java 21 (virtual threads enabled)
- Microsoft SQL Server (Testcontainers for integration tests)
- Micronaut Data JDBC (not JPA/Hibernate) — keep SQL explicit and readable
- Gradle (Kotlin DSL)

## Package structure — feature slices by use case

Each use case is a self-contained vertical slice. All layers for that use case
(controller, service, repository, DTOs, domain) live together in one package.
Cross-cutting concerns live in `shared`.

```
com.kpnquest
├── shared/                        # Cross-cutting, no business logic
│   ├── exception/                 # ApiException, error codes, global handler
│   ├── security/                  # JWT filter, token service, SecurityRule helpers
│   ├── web/                       # Response envelope (ApiResponse<T>), error body
│   └── config/                    # @Factory beans, app-wide @ConfigurationProperties
│
├── identifyplayer/                # POST /api/v1/players/identify
│   ├── IdentifyPlayerController.java
│   ├── IdentifyPlayerService.java
│   ├── PlayerRepository.java
│   ├── Player.java                # domain record
│   ├── IdentifyPlayerRequest.java # DTO (Java record)
│   └── IdentifyPlayerResponse.java
│
├── loadmissions/                  # GET /api/v1/missions
│   ├── LoadMissionsController.java
│   ├── LoadMissionsService.java
│   ├── MissionRepository.java
│   ├── Mission.java
│   └── MissionResponse.java
│
├── completemission/               # POST /api/v1/missions/{id}/complete
│   ├── CompleteMissionController.java
│   ├── CompleteMissionService.java
│   ├── CompletionRepository.java
│   ├── MissionCompletion.java
│   ├── CompleteMissionRequest.java
│   └── CompleteMissionResponse.java
│
├── uploadphoto/                   # POST /api/v1/missions/{id}/photos
│   ├── UploadPhotoController.java
│   ├── UploadPhotoService.java
│   ├── PhotoRepository.java
│   ├── Photo.java
│   └── UploadPhotoResponse.java
│
└── syncgamestate/                 # GET + PUT /api/v1/players/{id}/state
    ├── SyncGameStateController.java
    ├── SyncGameStateService.java
    ├── GameStateRepository.java
    ├── GameState.java
    ├── GameStateRequest.java
    └── GameStateResponse.java
```

## Slice rules

- A slice owns all its classes — controller, service, repository, domain, DTOs
- If two slices need the same domain concept, move it to `shared` — do not duplicate
- Controllers call only their own slice's service; never cross slice boundaries
- Services call only their own slice's repository; never another slice's repository
- DTOs are Java records — no setters, no Jackson annotations except `@JsonProperty` when needed
- Domain objects are plain Java records with no framework annotations

## Database

- All schema changes via Flyway migrations in `src/main/resources/db/migration/`
- Migration naming: `V{version}__{description}.sql` (e.g. `V1__create_player_table.sql`)
- No DDL in application code or entity annotations
- Use `NVARCHAR` for user-facing text columns (MSSQL Unicode)
- Every table has `created_at` and `updated_at` columns (`DATETIME2`)

## Configuration

- Environment-specific config in `src/main/resources/application-{env}.yml`
