---
phase: quick-260405-cid
plan: 01
subsystem: frontend-ui
tags: [header, footer, theme-toggle, ux]
dependency_graph:
  requires: []
  provides: [footer-theme-toggle, decluttered-header]
  affects: [Header.jsx, Footer.jsx]
tech_stack:
  added: []
  patterns: [useColorMode context consumer in Footer]
key_files:
  created: []
  modified:
    - planningpoker-web/src/containers/Header.jsx
    - planningpoker-web/src/components/Footer.jsx
    - planningpoker-web/tests/planning-poker.spec.js
decisions:
  - "Chip label updated to include 'Session ID: ' prefix for clarity since the standalone label was removed"
  - "E2e test hostGame helper updated to strip prefix before using chip text as join session ID"
metrics:
  duration: 8m
  completed: 2026-04-05T08:05:43Z
  tasks_completed: 2
  files_modified: 3
---

# Quick Task 260405-cid: Move dark/light toggle from Header to Footer

**One-liner:** Relocated theme toggle IconButton from AppBar to Footer, removed redundant "Session" label, updated chip to show "Session ID: " prefix, and fixed e2e tests accordingly.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Remove toggle and Session label from Header | a0f9b2f | Header.jsx |
| 2 | Add dark/light toggle to Footer + fix e2e tests | 44ed94e | Footer.jsx, planning-poker.spec.js |

## Changes Summary

### Header.jsx
- Removed `Tooltip`+`IconButton` theme toggle block
- Removed `Typography` "Session" label element
- Updated `Chip` label from `{sessionId}` to `` `Session ID: ${sessionId}` ``
- Removed unused imports: `DarkModeOutlinedIcon`, `LightModeOutlinedIcon`, `useColorMode`, `IconButton`

### Footer.jsx
- Added `useColorMode` import from `../App`
- Added `IconButton`, `Tooltip`, `DarkModeOutlinedIcon`, `LightModeOutlinedIcon` imports
- Added toggle `IconButton` between version text and About link (three-item space-between layout)

### tests/planning-poker.spec.js
- Updated chip label regex from `/^[a-f0-9]{8}$/` to `/^Session ID: [a-f0-9]{8}$/`
- Fixed `hostGame` helper to strip `"Session ID: "` prefix before returning session ID for use in join flows

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] E2e tests broken by chip label change**
- **Found during:** Task 2 verification
- **Issue:** Chip label changed to include "Session ID: " prefix, breaking the regex assertion and the multi-user `hostGame` helper which passed raw chip text as the join session ID
- **Fix:** Updated regex to match new label format; added `.replace()` in `hostGame` helper to extract the bare session ID
- **Files modified:** `planningpoker-web/tests/planning-poker.spec.js`
- **Commit:** 44ed94e

## Verification

- `npx vite build` — passed (both after Task 1 and Task 2)
- `npx playwright test` — 19/19 passed after test fixes

## Self-Check: PASSED

- [x] Header.jsx modified — confirmed at a0f9b2f
- [x] Footer.jsx modified — confirmed at 44ed94e
- [x] All 19 e2e tests pass
- [x] Build succeeds
