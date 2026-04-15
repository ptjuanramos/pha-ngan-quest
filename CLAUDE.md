## Project overview

A mobile-first web app for an adventure scavenger hunt in Ko Pha Ngan, Thailand.
The app is designed for one player and should guide them through 8 missions over 3–4 days, combining exploration, fun challenges, and two spicy/flirty missions at the end.

## Repository Structure

This is a **monorepo** with two top-level directories:
- `frontend/` — the React app (the only active codebase; `backend/` is currently empty)
- `.docs/troubleshoot/` — local troubleshooting notes (Windows/WSL2/Docker issues)

All frontend work happens inside `frontend/`. Run every command from there.

## Tech stack ( `frontend/`)
- React JS version 18
- Typescript (strict mode)

Do NOT introduce:
- styled-components or CSS-in-JS


## Commands (run from `backend/`)

```bash
./gradlew bootRun        # Start backend (port 8081)
./gradlew test           # Run all integration tests (requires Docker)
./gradlew test --tests "com.kpnquest.identifyplayer.*"  # Run a single slice's tests
./gradlew shadowJar      # Build fat JAR → build/libs/*-all.jar
```

> **Windows first run:** create `~/.testcontainers.properties` with `testcontainers.reuse.enable=true`
> so the MSSQL container is reused between test runs instead of restarting each time.

## Commands (run from `frontend/`)

```bash
npm run dev        # Start dev server at http://localhost:8080
npm run build      # Production build
npm run lint       # ESLint
npm test           # Run Vitest unit tests (single run)
npm run test:watch # Vitest in watch mode
```

To run a single test file:
```bash
npx vitest run src/path/to/file.test.ts
```

## Backend architecture

**Stack:** Micronaut 4.x · Java 21 (virtual threads) · Micronaut Data JDBC · MSSQL · Flyway · Gradle (Groovy DSL)

### Package layout — vertical feature slices

`com.kpnquest` root, one package per use case. Each slice owns its controller, service, repository, domain record, and DTOs. Cross-cutting code lives in `shared/`.

| Slice | Endpoint |
|---|---|
| `identifyplayer` | `POST /api/v1/players/identify` — create/find player by device token, return JWT |
| `loadmissions` | `GET /api/v1/missions` — return all 8 missions ordered by id |
| `completemission` | `POST /api/v1/missions/{id}/complete` — record completion, 409 if already done |
| `uploadphoto` | `POST /api/v1/missions/{id}/photos` — upsert base64 photo |
| `syncgamestate` | `GET/PUT /api/v1/players/{id}/state` — sync localStorage state to DB |

### Security

All endpoints except `/api/v1/players/identify` require a Bearer JWT. The JWT subject (`getName()`) is the player's numeric ID as a string. Services extract it via `Long.valueOf(authentication.getName())`.

### Database

Flyway migrations in `src/main/resources/db/migration/`. Naming: `V{n}__{description}.sql`. All user-facing text columns use `NVARCHAR`; timestamps use `DATETIME2`. Domain entities are Java records annotated with `@MappedEntity` (Micronaut Data JDBC requires it).

### Tests

Integration tests only — no mocks, no H2. All ITs extend `MssqlContainerExtension` (shared static container with `withReuse(true)`) and implement `TestPropertyProvider` to inject the Testcontainers JDBC URL. Run with `@MicronautTest(transactional = false)` since tests exercise the HTTP layer. `testcontainers.properties` in test resources forces the named-pipe Docker strategy for Windows/Docker Desktop.

## Frontend architecture

The app is a **mobile-first scavenger hunt** for Ko Pha Ngan. It is a pure client-side SPA — no backend, no API calls.

### State management

All game state lives in `src/pages/Index.tsx` and persists to `localStorage` under the key `kpn-quest`. Photos are stored individually as `kpn-quest-photo-{id}` (compressed JPEG via canvas, max 800px) to work around `localStorage` quota limits.

`GameState` shape:
```ts
{ started: boolean; photos: Record<number, string>; completedCount: number }
```

### Game flow

1. `WelcomeScreen` — shown until `state.started = true`
2. `Index.tsx` renders each mission by status: `CompletedMission`, `ActiveMission`, or `LockedMission`
3. Uploading a photo triggers `SignatureMoment` (a 4-second fullscreen animation overlay)
4. After the animation, `completedCount` increments and the page auto-scrolls to the next mission
5. When all 8 missions are done, `QuestComplete` renders a photo gallery

### Mission data

`src/data/missions.ts` is the single source of truth. Each `Mission` has:
- `id` (1–8), `title`, `clue`, `locationHint`, `challenge`
- `isSpicy: boolean` — missions 7 and 8 are marked spicy; this changes the color scheme to `accent` (warm red/orange) instead of `primary`

### Styling conventions

- **Fonts**: `font-heading` (Krub) for titles/clues; `font-body` (Sarabun) for body text
- **Colors**: regular missions use `primary`; spicy missions (`isSpicy`) use `accent`
- **Background**: `.paper-texture` class applied to the outermost wrapper
- CSS variables drive all colors (defined in `src/index.css`); Tailwind tokens (`primary`, `accent`, `muted`, etc.) map to those variables
- Path alias `@/` resolves to `src/`

### Testing

Unit tests use Vitest + jsdom + `@testing-library/react`. Test files live alongside source in `src/**/*.test.{ts,tsx}`. The setup file is `src/test/setup.ts`.

Playwright is configured (`playwright.config.ts`) via `lovable-agent-playwright-config` for Lovable's CI environment — not intended for local E2E runs.
