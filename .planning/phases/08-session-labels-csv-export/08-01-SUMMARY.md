---
phase: 08-session-labels-csv-export
plan: "01"
subsystem: session-labels
tags: [backend, frontend, websocket, redux, label]
dependency_graph:
  requires: []
  provides: [label-storage, set-label-endpoint, label-broadcast, label-redux-state, label-ui]
  affects: [MessagingUtils, SessionManager, GameController, PlayGame, Vote, Results]
tech_stack:
  added: []
  patterns: [ConcurrentHashMap label storage, host-only POST endpoint, debounced TextField, backwards-compat payload extraction]
key_files:
  created: []
  modified:
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/util/MessagingUtils.java
    - planningpoker-api/src/test/java/com/richashworth/planningpoker/controller/GameControllerTest.java
    - planningpoker-api/src/test/java/com/richashworth/planningpoker/util/MessagingUtilsTest.java
    - planningpoker-web/src/actions/index.js
    - planningpoker-web/src/reducers/reducer_game.js
    - planningpoker-web/src/pages/PlayGame.jsx
    - planningpoker-web/src/containers/Vote.jsx
    - planningpoker-web/src/containers/Results.jsx
decisions:
  - Label piggybacked on RESULTS_MESSAGE as {results, label} map rather than separate WebSocket topic
  - Host-only label setting enforced at controller level (same HostActionException pattern as kick/promote)
  - Debounced label dispatch (300ms) via useRef+setTimeout to avoid dependency on lodash.debounce
  - Label cleared on resetSession (new round) so each round starts clean
  - Backwards compat: old bare-array RESULTS_MESSAGE payload still handled in PlayGame
metrics:
  duration_minutes: 25
  completed_date: "2026-04-08"
  tasks_completed: 2
  files_modified: 10
---

# Phase 08 Plan 01: Session Labels Summary

Host can type a round label (e.g. "Login page redesign") that broadcasts in real time via RESULTS_MESSAGE WebSocket to all participants, displayed on both voting and results screens, cleared on round reset.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Backend label storage, endpoint, and WebSocket broadcast | b578db3 | SessionManager.java, GameController.java, MessagingUtils.java, GameControllerTest.java |
| 2 | Frontend label state, actions, and UI | 8454336 | actions/index.js, reducer_game.js, PlayGame.jsx, Vote.jsx, Results.jsx |

## What Was Built

**Backend:**
- `SessionManager`: `sessionLabels` ConcurrentHashMap with `setLabel`/`getLabel`; label trimmed to 100 chars. `resetSession` clears label; `clearSessions` and `evictIdleSessions` clean up sessionLabels.
- `GameController`: `POST /setLabel` — validates session membership, host-only check (HostActionException for non-hosts), 100-char limit, control-char stripping, then calls `burstResultsMessages`.
- `MessagingUtils`: `sendResultsMessage` payload changed from bare list to `{ results: [...], label: "..." }` map.

**Frontend:**
- `actions/index.js`: `SET_LABEL`, `LABEL_UPDATED` constants; `labelUpdated` event creator; `setLabel` thunk (POST /setLabel via URLSearchParams).
- `reducer_game.js`: `currentLabel: ''` in initial state; handles `LABEL_UPDATED` (set) and `RESET_SESSION` (clear).
- `PlayGame.jsx`: `RESULTS_MESSAGE` handler extracts results and label separately; backwards compat for old bare-array payload.
- `Vote.jsx`: Host sees debounced TextField (300ms, maxLength 100); non-host sees italic read-only label if non-empty.
- `Results.jsx`: Shows `currentLabel` as body2 text below the Results heading when non-empty.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated MessagingUtilsTest for new results payload shape**
- **Found during:** Task 2 verification (full test suite run)
- **Issue:** `testSendResultsMessage` and `testBurstResultsMessages` called `resultsMessage(RESULTS)` with a bare list, but `sendResultsMessage` now builds a `{ results, label }` map — 2 tests failed.
- **Fix:** Updated both tests to mock `sessionManager.getLabel` and construct the expected `{ results, label }` LinkedHashMap before comparing.
- **Files modified:** `MessagingUtilsTest.java`
- **Commit:** 306943c

## Known Stubs

None — label is fully wired from host input through WebSocket broadcast to all participant UIs.

## Threat Flags

None — no new network endpoints beyond `/setLabel` which was in the plan's threat model (T-08-01 mitigated: host-only check enforced).

## Self-Check: PASSED

- SUMMARY.md: FOUND
- Commit b578db3 (Task 1): FOUND
- Commit 8454336 (Task 2): FOUND
- Commit 306943c (deviation fix): FOUND
