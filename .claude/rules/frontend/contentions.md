---
paths:
  - "frontend/**"
---

# Frontend conventions

## Tech stack

- React 18, TypeScript strict mode, Vite
- Tailwind CSS with CSS variable tokens (`primary`, `accent`, `muted`, etc.)
- Do NOT introduce styled-components or any CSS-in-JS

## Styling

- Fonts: `font-heading` (Krub) for titles/clues; `font-body` (Sarabun) for body
- Colors: regular missions → `primary`; spicy missions (`isSpicy: true`) → `accent`
- Background: `.paper-texture` class on outermost wrapper
- All colors via CSS variables defined in `src/index.css`
- Path alias `@/` resolves to `src/`

## TypeScript

- Strict mode is on — no `any`, no `// @ts-ignore` without a comment explaining why
- Prefer explicit return types on exported functions
- Use `type` for data shapes, `interface` only when extension is needed

## Testing

- Vitest + jsdom + `@testing-library/react`
- Test files live alongside source: `src/**/*.test.{ts,tsx}`
- Setup file: `src/test/setup.ts`
- Playwright config (`playwright.config.ts`) is for Lovable CI only — do not run locally
- New logic that isn't pure UI must have a unit test

## General

- No default exports except for React page components
- Prefer named exports for utilities and services
- Keep components under 200 lines; extract sub-components or hooks if growing larger