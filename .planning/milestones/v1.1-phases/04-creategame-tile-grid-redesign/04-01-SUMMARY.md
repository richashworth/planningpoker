---
phase: 04-creategame-tile-grid-redesign
plan: "01"
subsystem: frontend
tags: [ui, createGame, scheme-selection, responsive]
dependency_graph:
  requires: []
  provides: [SchemeTile component, SCHEME_METADATA constant, tile-grid CreateGame]
  affects: [planningpoker-web/src/pages/CreateGame.jsx, planningpoker-web/src/components/SchemeTile.jsx, planningpoker-web/src/config/Constants.js]
tech_stack:
  added: []
  patterns: [MUI Box with sx grid, CSS media query in sx prop, data-testid + aria attributes]
key_files:
  created:
    - planningpoker-web/src/components/SchemeTile.jsx
  modified:
    - planningpoker-web/src/config/Constants.js
    - planningpoker-web/src/pages/CreateGame.jsx
decisions:
  - "Used Box with sx grid instead of Card for SchemeTile to avoid nested Card MUI issues"
  - "Hover styles applied conditionally (only when not selected) to prevent style conflict"
  - "customInput prop passed as React node from parent to keep SchemeTile presentational"
metrics:
  duration: "~10 min"
  completed_date: "2026-04-05"
  tasks_completed: 2
  files_changed: 3
---

# Phase 04 Plan 01: CreateGame Tile Grid Redesign Summary

**One-liner:** Replaced ToggleButtonGroup scheme selector with a self-documenting 2-column tile grid (SchemeTile component) with responsive icon-only mobile layout and inline Custom input.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add SCHEME_METADATA to Constants.js | 24df5d0 | planningpoker-web/src/config/Constants.js |
| 2 | Create SchemeTile + rewrite CreateGame | d4fa62c | planningpoker-web/src/components/SchemeTile.jsx, planningpoker-web/src/pages/CreateGame.jsx |

## What Was Built

**SCHEME_METADATA constant** — Added to `Constants.js` alongside existing `SCHEME_VALUES`. Provides `key`, `icon` (emoji), `name`, and `description` for each of the 5 schemes (fibonacci, tshirt, simple, time, custom). Also added `SCHEME_ORDER` array for consistent iteration.

**SchemeTile component** (`src/components/SchemeTile.jsx`) — Presentational MUI Box-based tile showing:
- Emoji icon (1.8rem), scheme name (subtitle2 bold), description (caption, className="scheme-description")
- Value chips row (MUI Chip, size="small", variant="outlined", className="scheme-values")
- CheckCircleIcon when selected (primary.main color)
- 2px border: primary.main when selected, divider otherwise
- Hover effect (only when not selected)
- `data-testid="scheme-tile-{key}"`, `role="option"`, `aria-selected` for test targeting
- When `isCustom && selected`: renders `customInput` node instead of chips

**CreateGame.jsx rewrite** — Replaced ToggleButtonGroup with:
- 2-column CSS grid (`repeat(2, 1fr)`) for desktop
- 3-column icon-only grid at `@media (max-width: 479px)` with `.scheme-description` and `.scheme-values` hidden
- Custom tile wrapped in `gridColumn: '1 / -1'` to span full width
- Inline TextField for Custom values rendered inside the Custom tile when selected
- Card Preview section and `getPreviewValues` function removed entirely
- Unsure/Coffee toggle switches unchanged
- Default scheme `'fibonacci'`, maxWidth widened from 480 to 560
- Same `createGame` API call, same form payload shape — no backend changes

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all scheme data is wired from SCHEME_METADATA/SCHEME_VALUES constants.

## Threat Flags

None — pure frontend component refactor. No new network endpoints, auth paths, or trust boundaries introduced. Backend validation unchanged.

## Self-Check: PASSED

- SchemeTile.jsx exists: FOUND
- CreateGame.jsx modified: FOUND
- Constants.js modified: FOUND
- Commit 24df5d0 exists: FOUND
- Commit d4fa62c exists: FOUND
- Vite build: PASSED (979 modules, built in 1.78s)
