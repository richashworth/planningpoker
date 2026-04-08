---
phase: 08-session-labels-csv-export
plan: "02"
subsystem: csv-export-consensus
tags: [frontend, redux, csv, consensus, utils]
dependency_graph:
  requires: [08-01]
  provides: [consensus-display, host-override, round-history, csv-export]
  affects: [Results, reducer_rounds, actions, reducers/index]
tech_stack:
  added: []
  patterns: [TDD utility modules, Redux round accumulation, Blob download trigger, CSV injection protection]
key_files:
  created:
    - planningpoker-web/src/utils/consensus.js
    - planningpoker-web/src/utils/consensus.test.js
    - planningpoker-web/src/utils/csvExport.js
    - planningpoker-web/src/utils/csvExport.test.js
    - planningpoker-web/src/reducers/reducer_rounds.js
  modified:
    - planningpoker-web/src/actions/index.js
    - planningpoker-web/src/reducers/index.js
    - planningpoker-web/src/containers/Results.jsx
decisions:
  - consensus tie-breaking uses alphabetical sort so deterministic across sessions
  - host override stored as local useState (null = auto); only non-null value persisted to round history
  - ROUND_COMPLETED dispatched before resetSession to guarantee label is captured before reducer clears it
  - downloadCsv uses Blob + temporary anchor element (no server round-trip)
  - CSV injection protection: prefix =, +, -, @ with single quote per OWASP recommendation
metrics:
  duration_minutes: 15
  completed_date: "2026-04-08"
  tasks_completed: 2
  files_modified: 8
---

# Phase 08 Plan 02: Consensus, Round History, and CSV Export Summary

Consensus auto-calculated from vote mode after each round; host can override via dropdown; clicking Next Item saves round history to Redux; Export CSV downloads all completed rounds with per-player votes, timestamps, and stats.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (RED) | Failing tests for consensus and csvExport utilities | 23cbf7f | consensus.test.js, csvExport.test.js |
| 1 (GREEN) | Implement consensus and csvExport utilities | c391566 | consensus.js, csvExport.js, csvExport.test.js (jsdom env) |
| 2 | Round history reducer, consensus UI, host override, CSV export button | a7e929b | reducer_rounds.js, reducers/index.js, actions/index.js, Results.jsx |

## What Was Built

**consensus.js:**
- `calcConsensus(results)` — returns mode of votes; tie-breaks alphabetically; returns null for empty array.
- `calcStats(results)` — returns `{ mode, min, max, variance }`. For numeric schemes all four fields populated (variance = population variance, 2dp). For non-numeric (T-shirt, custom text), min/max/variance are null; only mode returned.

**csvExport.js:**
- `generateCsv(rounds, playerNames)` — builds CSV string with header `Label,Consensus,Timestamp,Mode,Min,Max,Variance,Player1,...`. Per-player votes in sorted name order; missing votes are empty string. Values with commas/quotes/newlines wrapped in double-quotes with internal quotes doubled.
- `downloadCsv(csvString, filename)` — creates Blob(text/csv), object URL, temporary anchor, triggers click, revokes URL. Default filename `planning-poker-export.csv`.
- Formula injection protection: values starting with `=`, `+`, `-`, `@` prefixed with `'` (single quote).

**reducer_rounds.js:**
- Initial state: `[]`
- `ROUND_COMPLETED`: appends round object `{ label, consensus, votes, timestamp, mode, min, max, variance }` to array.
- `LEAVE_GAME`: resets to `[]`. Does NOT clear on `RESET_SESSION` (history accumulates).

**actions/index.js additions:**
- `ROUND_COMPLETED = 'round-completed'`
- `SET_CONSENSUS_OVERRIDE = 'set-consensus-override'`
- `roundCompleted(round)` action creator
- `setConsensusOverride(value)` action creator

**Results.jsx updates:**
- Reads `results` and `rounds` from Redux state.
- Computes `autoConsensus` via `calcConsensus(results)`; local `consensusOverride` state (null = use auto).
- Shows `Chip` with `Consensus: {value}` — host can click to open inline `Select` dropdown with unique vote values from current round; selecting a value sets override.
- "Next Item" button: builds round object with `calcStats`, dispatches `roundCompleted`, resets override, then dispatches `resetSession`.
- "Export CSV" button (host-only, outlined, DownloadIcon): disabled when `rounds.length === 0`; on click calls `generateCsv` + `downloadCsv`.
- Round count badge (`Typography caption`) shown when rounds > 0.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added jsdom environment annotation to csvExport.test.js**
- **Found during:** Task 1 GREEN phase
- **Issue:** `downloadCsv` tests use `document.createElement` and `document.body` which require a DOM environment. Vitest runs in node environment by default, causing `ReferenceError: document is not defined`.
- **Fix:** Added `// @vitest-environment jsdom` docblock at top of `csvExport.test.js`.
- **Files modified:** `planningpoker-web/src/utils/csvExport.test.js`
- **Commit:** c391566

## Known Stubs

None — all features fully wired: consensus computed from live Redux results, override captured in local state, round history accumulates across resets, CSV export reads full rounds array.

## Threat Flags

None — all changes are client-side only. CSV export writes to user's local filesystem via Blob download. No new network endpoints. T-08-07 (CSV injection) mitigated as planned.

## Self-Check: PASSED

- consensus.js: FOUND at planningpoker-web/src/utils/consensus.js
- csvExport.js: FOUND at planningpoker-web/src/utils/csvExport.js
- reducer_rounds.js: FOUND at planningpoker-web/src/reducers/reducer_rounds.js
- Commit 23cbf7f (RED tests): FOUND
- Commit c391566 (GREEN implementation): FOUND
- Commit a7e929b (Task 2): FOUND
- All 19 tests pass
- Full build succeeds (npm run build)
