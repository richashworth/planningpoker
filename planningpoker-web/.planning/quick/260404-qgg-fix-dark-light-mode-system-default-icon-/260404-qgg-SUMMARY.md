---
phase: quick
plan: 260404-qgg
subsystem: frontend-ui
tags: [theme, ux, dark-mode, accessibility]
dependency_graph:
  requires: []
  provides: [system-default-theme-detection, always-visible-theme-toggle]
  affects: [planningpoker-web/src/App.jsx, planningpoker-web/src/containers/Header.jsx]
tech_stack:
  added: [MUI Switch]
  patterns: [matchMedia for OS preference detection, aria-label on Switch for accessibility]
key_files:
  modified:
    - planningpoker-web/src/App.jsx
    - planningpoker-web/src/containers/Header.jsx
    - planningpoker-web/tests/planning-poker.spec.js
decisions:
  - Simpler icon-flanking approach (sun icon | Switch | moon icon) chosen over SVG thumb pseudo-elements
  - Theme toggle removed from player dropdown menu entirely; always in toolbar for discoverability
metrics:
  duration: ~5min
  completed: 2026-04-04T18:09:03Z
  tasks_completed: 2
  files_modified: 3
---

# Quick Task 260404-qgg: Fix Dark/Light Mode — System Default + Icon Switch

**One-liner:** OS matchMedia default theme detection with always-visible sun/moon Switch replacing the context-dependent text button.

## What Was Done

**Task 1 — System default theme + always-visible Switch (1ce7359)**

- `App.jsx`: `useState` initializer now checks `localStorage('pp-theme')` first, then `window.matchMedia('(prefers-color-scheme: dark)').matches`, then falls back to `'light'`. Context default updated from `'dark'` to `'light'` for consistency.
- `Header.jsx`: Added MUI `Switch` (checked when dark mode) flanked by `LightModeOutlinedIcon` and `DarkModeOutlinedIcon`, placed before the session-conditional block so it is always visible regardless of game state.
- Removed the theme toggle `MenuItem` from the player dropdown — logout is the only item there now.
- Removed the standalone theme toggle `Button` in the no-session else-branch.
- Removed the `handleThemeToggle` wrapper function; Switch calls `toggleColorMode` directly.

**Task 2 — Updated e2e test (731ef2f)**

- `planning-poker.spec.js`: Dark/Light Mode test now uses `page.emulateMedia({ colorScheme: 'dark' })` before `page.goto('/')` to reliably start in dark mode.
- Toggle located via `page.getByRole('checkbox', { name: 'Toggle dark mode' })` (MUI Switch renders as a checkbox input).
- Assertions updated: `toBeChecked()` / `not.toBeChecked()` replace the old button-text checks.

## Verification

- `npx vite build` passes with no errors (both tasks verified).
- Full e2e run requires backend on port 9000 — manual verification step.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- `/Users/richard/Projects/planningpoker/planningpoker-web/src/App.jsx` — modified, committed 1ce7359
- `/Users/richard/Projects/planningpoker/planningpoker-web/src/containers/Header.jsx` — modified, committed 1ce7359
- `/Users/richard/Projects/planningpoker/planningpoker-web/tests/planning-poker.spec.js` — modified, committed 731ef2f
