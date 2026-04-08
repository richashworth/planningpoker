---
phase: quick
plan: 260407-x1g
subsystem: frontend
tags: [accessibility, contrast, wcag, ui]
dependency_graph:
  requires: []
  provides: [high-contrast-scheme-tiles]
  affects: [planningpoker-web/src/components/SchemeTile.jsx]
tech_stack:
  added: []
  patterns: [MUI theme tokens for accessible color values]
key_files:
  modified:
    - planningpoker-web/src/components/SchemeTile.jsx
decisions:
  - Used theme token text.secondary instead of hardcoded hex for icon and selected-caption colors to stay in sync with theme definitions
metrics:
  duration: "3 minutes"
  completed: "2026-04-07"
  tasks_completed: 1
  files_changed: 1
---

# Phase quick Plan 260407-x1g: Increase contrast on SchemeTile text elements to meet WCAG AA

Three color fixes in SchemeTile.jsx — icon, unselected caption, and selected caption — replacing near-invisible values with WCAG AA-compliant alternatives using MUI theme tokens and explicit hex values.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Increase contrast on all SchemeTile text elements | 554346b | planningpoker-web/src/components/SchemeTile.jsx |

## What Was Done

### Task 1: Increase contrast on all SchemeTile text elements

Three changes in `SchemeTile.jsx`:

1. **Icon color** — unselected state changed from `text.disabled` to `text.secondary`
   - Dark: `#71717a` → `#a1a1aa` on `#1c1c20` (~1.8:1 → ~5.3:1)
   - Light: `#a1a1aa` → `#71717a` on `#fff` (~2.6:1 → ~4.7:1)

2. **Values caption (unselected)** — hardcoded hex swapped for accessible values
   - Dark: `#3f3f46` → `#a1a1aa` on `#1c1c20` (~1.3:1 → ~5.3:1)
   - Light: `#a1a1aa` → `#71717a` on `#fff` (~2.6:1 → ~4.7:1)

3. **Values caption (selected)** — changed from `text.disabled` to `text.secondary`
   - Dark: `#71717a` → `#a1a1aa` on `#1c1c20` (~1.8:1 → ~5.3:1)
   - Light: `#a1a1aa` → `#71717a` on `#fff` (~2.6:1 → ~4.7:1)

Selected tile visual distinction preserved: border uses `primary.main`, icon and name use `primary.main` / `text.primary`.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- All 53 vitest unit tests pass (8 test files)
- No new files created; no untracked files

## Known Stubs

None.

## Threat Flags

None — pure color/style change, no new network surface or auth paths.

## Self-Check: PASSED

- `planningpoker-web/src/components/SchemeTile.jsx` — modified, committed at 554346b
- Commit 554346b present in git log
