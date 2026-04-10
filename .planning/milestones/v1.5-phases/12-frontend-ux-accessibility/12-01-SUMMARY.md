---
phase: 12-frontend-ux-accessibility
plan: 01
subsystem: frontend
tags: [ux, label, explicit-submit, playwright, bug-fix]
dependency_graph:
  requires: []
  provides: [explicit-label-submit, e2e-label-coverage]
  affects: [Vote.jsx, PlayGame.jsx, session-labels-csv.spec.js]
tech_stack:
  added: []
  patterns: [MUI InputAdornment, controlled-submit pattern, STOMP burst timing guard]
key_files:
  created: []
  modified:
    - planningpoker-web/src/containers/Vote.jsx
    - planningpoker-web/src/pages/PlayGame.jsx
    - planningpoker-web/tests/session-labels-csv.spec.js
decisions:
  - "Set button + Enter key as sole dispatch trigger for setLabel (replaces 300ms debounce)"
  - "lastBroadcastLabel ref tracks last sent value to gate disabled state and prevent duplicate dispatches"
  - "4-second grace window in PlayGame kick detection to ignore stale USERS_MESSAGE bursts from pre-join session creation"
  - "waitForWsReady polls /refresh to actively trigger USERS_MESSAGE rather than passively waiting"
metrics:
  duration_minutes: 150
  completed: "2026-04-10T12:25:56Z"
  tasks_completed: 2
  files_modified: 3
---

# Phase 12 Plan 01: Explicit Label Submit (UX-01) Summary

Replaced keystroke-debounced label broadcast with an explicit submit model: MUI InputAdornment Set button inside the label TextField, plus Enter key support. Hosts now control precisely when a label becomes visible to participants. Added 11 Playwright tests covering the new behaviour. Fixed a pre-existing stale-burst false-kick race condition discovered during test authoring.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Replace debounced label broadcast with explicit Set button | 718463a | Vote.jsx |
| 2 | Update and add Playwright tests; fix stale-burst kick race | 30122a1 | session-labels-csv.spec.js, PlayGame.jsx |

Note: commit 4a5a004 (interim test state) is superseded by 30122a1.

## What Was Built

**Vote.jsx changes:**
- Removed `debounceRef`, `useRef`, `handleLabelChange`, and the 300ms `setTimeout` entirely
- Added `lastBroadcastLabel` state, initialised from and synced with `currentLabel` via `useEffect`
- `handleSubmit` dispatches `setLabel` only when `labelInput !== lastBroadcastLabel`; updates `lastBroadcastLabel` after dispatch
- `onChange` now only calls `setLabelInput` — no side effects
- `onKeyDown` calls `handleSubmit` on Enter
- `InputAdornment` with `Button` (aria-label="Set round label") — disabled when `labelInput === lastBroadcastLabel`

**PlayGame.jsx fix (Rule 1 — Bug):**
The kick detection effect had a stale-burst race: when a player joins, the host's original session-creation `burstUsersMessages` can still be delivering messages (for up to ~2.7 s after session creation). These bursts contain only the host's name. If the player's STOMP subscription becomes active within that window, they receive a USERS_MESSAGE without their own name and get incorrectly kicked. Fixed with a `sessionConfirmedAt` timestamp ref: kicks are only honoured after the player has been seen in the users list AND 4 seconds have elapsed, allowing all stale bursts to expire.

**Test file (session-labels-csv.spec.js):**
- 11 tests covering: Set button broadcast, Enter key broadcast, label on results screen, label clears on next round, non-host read-only display, empty Set clears label, Set button disabled state, Consensus chip, consensus override dropdown, CSV export button, CSV download filename/content
- All tests use `try/finally` to ensure browser context cleanup on failure (prevents resource exhaustion on retry)
- `waitForWsReady(page, sessionId, hostName)` now actively polls `/refresh` every 1 s to trigger USERS_MESSAGE, making it robust when STOMP connects after the initial join burst window

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] False-kick race from stale USERS_MESSAGE bursts**
- **Found during:** Task 2 (Playwright test authoring — player page unexpectedly navigated to `/` mid-test)
- **Issue:** Backend `burstUsersMessages` fired at session creation fires at t=0ms, 10ms, 60ms, 210ms, 710ms, 2710ms. The t=2710ms burst contained only the host's name. If the joining player's STOMP subscription became active between the joining burst (which included both users) and the t=2710ms stale burst, the stale burst triggered kick detection.
- **Root cause:** `confirmedInSession` guard was insufficient — it prevented kicks before first confirmation but not stale bursts that arrived milliseconds after confirmation.
- **Fix:** Replaced boolean `confirmedInSession` ref with timestamp `sessionConfirmedAt`. Kicks only fire if `Date.now() - sessionConfirmedAt.current > 4000` (4 s grace window covers the 2.7 s burst window plus margin).
- **Files modified:** `planningpoker-web/src/pages/PlayGame.jsx`
- **Commit:** 30122a1

**2. [Rule 3 — Blocking] Playwright context cleanup on failure causing resource exhaustion**
- **Found during:** Task 2 (test retries — `waitForWsReady` timing out at 15 s on retry runs)
- **Issue:** When a test failed mid-way, `hostCtx.close()` and `playerCtx.close()` were never reached, leaving STOMP WebSocket connections open. On retry, accumulated open connections caused new connections to fail.
- **Fix:** Wrapped all multi-context test bodies in `try/finally` ensuring `close()` is always called.
- **Files modified:** `planningpoker-web/tests/session-labels-csv.spec.js`
- **Commit:** 30122a1

**3. [Rule 3 — Blocking] waitForWsReady passively waiting for missed bursts**
- **Found during:** Task 2 (tests timing out even after fixing the false-kick race)
- **Issue:** The helper waited for Alice's name to appear in the users table — this relied on the joining burst being received. If STOMP connected after the burst window expired, the check timed out with no recourse.
- **Fix:** Replaced passive wait with active polling via `page.request.get('/refresh?sessionId=...')` every 1 s, triggering fresh USERS_MESSAGE deliveries until Alice appears.
- **Files modified:** `planningpoker-web/tests/session-labels-csv.spec.js`
- **Commit:** 30122a1

## Verification

```
✓ 31 Playwright tests pass (11 new/updated + 20 existing)
✓ Vote.jsx: all acceptance criteria greps pass
✓ ESLint: src/containers/Vote.jsx clean
✓ No debounceRef, handleLabelChange, or setTimeout in Vote.jsx
✓ Set button count in test file: 7 occurrences (≥4 required)
```

## Known Stubs

None — all acceptance criteria fully implemented and wired.

## Self-Check: PASSED

- `planningpoker-web/src/containers/Vote.jsx` — exists, modified ✓
- `planningpoker-web/src/pages/PlayGame.jsx` — exists, modified ✓
- `planningpoker-web/tests/session-labels-csv.spec.js` — exists, modified ✓
- Commit 718463a — exists ✓
- Commit 30122a1 — exists ✓
- All 31 Playwright tests pass ✓
