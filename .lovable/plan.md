

## Plan: Photo Validation UI + Treasure Map (frontend only)

Two changes. **Backend is out of scope** — the user is implementing the validation API themselves. The frontend will call a stubbed client function with a clearly-marked TODO so the user can wire it to their endpoint.

### 1. Photo Validation UI

Insert a "preview & validate" stage between photo capture and the Signature Moment.

**Flow:**
```text
Take photo → Preview screen → [Validar Prova] →
  validatePhoto() (stub) →
    ✓ valid → Signature Moment → next mission unlocks
    ✗ invalid → inline retry message → retake
```

**Changes to `src/components/ActiveMission.tsx`:**
- Local state machine: `idle | preview | validating | invalid`
- `preview`: large photo + two buttons — "Tirar Outra" (retake) / "Validar Prova"
- `validating`: spinner + "A verificar a tua prova..."
- `invalid`: red-tinted message ("Hmm, não parece corresponder à missão. Tenta outra vez?") + retake button, photo discarded
- On success, calls existing `onPhotoUpload(missionId, photo)` to trigger Signature Moment

**New file `src/lib/validatePhoto.ts`:**
- Exports `validatePhoto({ photo, missionId, challenge, title }) => Promise<{ valid: boolean; reason?: string }>`
- Body contains a `// TODO: replace with real backend call` and a temporary mock that resolves `{ valid: true }` after 800ms so the UI is testable end-to-end
- Single, obvious place for the user to plug in their endpoint

### 2. Treasure Map UI

Replace the linear mission stack with a single scrollable parchment map.

**Layout (mobile-first, full viewport width):**
- Vertical parchment background with paper texture + sepia tint
- Hand-lettered "Ko Pha Ngan" title + small compass rose at top
- 8 mission stops zig-zagging down a curving dashed SVG path
- Decorative palm trees / waves scattered around; small treasure chest at stop 8
- `ProgressBar` stays pinned at top

**Marker states (`MapMarker.tsx`):**
- Locked: faded, padlock icon, dashed outline, shake on tap
- Active: pulsing glow, "X" treasure-mark, tappable
- Completed: filled primary, checkmark, tap to review
- Spicy (7, 8): accent-orange flame badge overlay

**Interaction:**
- Tap active marker → full-screen `MissionSheet` wraps existing `ActiveMission`
- Tap completed marker → `CompletedMissionModal` shows photo + clue
- After Signature Moment → returns to map, smooth-scrolls to new active marker

**New components:**
- `src/components/TreasureMap.tsx` — SVG path + marker layout
- `src/components/MapMarker.tsx` — variant-driven marker
- `src/components/MissionSheet.tsx` — full-screen overlay for active mission
- `src/components/CompletedMissionModal.tsx` — photo review modal

**Modified:**
- `src/pages/Index.tsx` — replace mission `.map()` stack with `<TreasureMap>` + sheet/modal state
- `src/components/ActiveMission.tsx` — preview/validate states (above)
- `src/index.css` — path dash animation, marker pulse, parchment overlay tweaks
- `src/lib/validatePhoto.ts` — new stub

**Untouched:**
- `WelcomeScreen`, `SignatureMoment`, `QuestComplete`, `ProgressBar`, `missions.ts`, storage logic
- `LockedMission.tsx` and `CompletedMission.tsx` become unused (left in place; safe to delete later)

### Notes for the user

- `validatePhoto.ts` is the single integration point — swap the mock for `fetch(...)` to your endpoint.
- Suggested request shape: `{ photo: base64, missionId, challenge, title }` → response `{ valid: boolean, reason?: string }`. Easy to change.
- Photo is already client-compressed to 800px JPEG, so payloads stay small.
- No Lovable Cloud, no edge function, no new dependencies.

