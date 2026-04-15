---
paths:
  - "frontend/**"
---

# Frontend architecture

Pure client-side SPA. All API calls go to the Micronaut backend once it is integrated;
until a backend endpoint exists, fall back to localStorage.

## State management

Game state lives in `src/pages/Index.tsx` and syncs to the backend.
Local fallback persists to `localStorage` under `kpn-quest`.
Photos stored individually as `kpn-quest-photo-{id}` (compressed JPEG via canvas, max 800px).

`GameState` shape:
```ts
{ started: boolean; photos: Record<number, string>; completedCount: number }
```

## Game flow

1. `WelcomeScreen` — shown until `state.started = true`
2. `Index.tsx` renders each mission by status: `CompletedMission`, `ActiveMission`, or `LockedMission`
3. Photo upload triggers `SignatureMoment` (4-second fullscreen animation overlay)
4. After animation, `completedCount` increments and page auto-scrolls to next mission
5. All 8 missions done → `QuestComplete` renders photo gallery

## Mission data

`src/data/missions.ts` is the single source of truth.
Each `Mission`: `id` (1–8), `title`, `clue`, `locationHint`, `challenge`, `isSpicy: boolean`.
Missions 7–8 are spicy → use `accent` color scheme instead of `primary`.

## API integration pattern

Use a service layer under `src/services/` (e.g. `gameService.ts`, `photoService.ts`).
Services call the backend and fall back to localStorage on network failure.
Never call `fetch` directly from components or hooks — always go through a service.
 