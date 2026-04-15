---
paths:
  - "backend/**"
---

# API guidelines

## URL design

- Base path: `/api/v1`
- Plural nouns for resources: `/api/v1/missions`, `/api/v1/photos`
- Nested resources for ownership: `/api/v1/players/{playerId}/state`
- No verbs in URLs — use HTTP methods to express intent
- kebab-case for multi-word segments: `/api/v1/game-state`