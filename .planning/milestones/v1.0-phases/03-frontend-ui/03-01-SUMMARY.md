---
plan: 03-01
status: complete
started: 2026-04-04
completed: 2026-04-04
---

# Plan 03-01: Scheme Selector on CreateGame Page — Summary

## What was built
Added scheme selection UI to the CreateGame page: a ToggleButtonGroup for preset schemes (Fibonacci, T-shirt, Simple, Custom), a conditional TextField for custom values with inline validation, and two Switch toggles for meta-cards (? and Coffee). Updated the createGame action creator to accept and pass scheme options to the backend API.

## Key changes
- `planningpoker-web/src/actions/index.js` — createGame now accepts `schemeOptions` parameter instead of hardcoded values
- `planningpoker-web/src/pages/CreateGame.jsx` — Added scheme selector, custom values input, meta-card toggles, and client-side validation

## key-files
### created
(none)
### modified
- planningpoker-web/src/actions/index.js
- planningpoker-web/src/pages/CreateGame.jsx

## Self-Check: PASSED
All acceptance criteria verified via grep checks.

## Deviations
None — implemented exactly as planned.
