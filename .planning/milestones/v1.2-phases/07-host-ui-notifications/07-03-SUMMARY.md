---
phase: 07-host-ui-notifications
plan: 03
subsystem: ui
tags: [react, lodash, startCase, sessionmanager, java, guava]

# Dependency graph
requires:
  - phase: 07-host-ui-notifications
    provides: UsersTable with host star indicator and kick/promote icons (07-01, 07-02)
  - phase: 06-host-actions-websocket-events
    provides: kick/promote endpoints that require original-case usernames
provides:
  - UsersTable with correct host detection and action dispatch using original usernames
  - SessionManager.removeUser with case-insensitive user removal
affects: [e2e tests, kick/promote flows, host indicator display for multi-word usernames]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Display-transform separation: keep original values for logic, apply startCase only at render time"
    - "Case-insensitive ListMultimap removal via removeIf(equalsIgnoreCase)"

key-files:
  created: []
  modified:
    - planningpoker-web/src/containers/UsersTable.jsx
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java
    - planningpoker-api/src/test/java/com/richashworth/planningpoker/service/SessionManagerTest.java

key-decisions:
  - "Remove .map(startCase) from allUsers array build; apply startCase only in JSX display elements"
  - "Send original username (unmodified) as targetUser to kick/promote endpoints"
  - "Use ListMultimap.get(sessionId).removeIf(equalsIgnoreCase) for case-insensitive session user removal"

patterns-established:
  - "Display-transform separation: apply visual transforms (startCase, etc.) only at the JSX render layer, never in data arrays used for comparisons or API calls"

requirements-completed: [HOST-03, ACT-03, UI-01]

# Metrics
duration: 15min
completed: 2026-04-06
---

# Phase 07 Plan 03: Gap Closure — Username Transform Bugs Summary

**Fixed startCase display-transform corruption in UsersTable and case-sensitive user removal in SessionManager, ensuring host indicators, kick, and promote work for all username formats**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-06T21:58:00Z
- **Completed:** 2026-04-06T22:00:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Separated display names from original usernames in UsersTable — `allUsers` now holds original values; `startCase` applied only at render time
- Host star indicator now correctly detects host for multi-word usernames (comparison uses original names, case-insensitive)
- `kickUser` and `promoteUser` dispatch calls now send the original username as `targetUser` — matching server-stored casing
- `SessionManager.removeUser` now uses `removeIf(equalsIgnoreCase)` — case-insensitive removal unblocks kick for any username casing variant
- Three new TDD tests confirm case-insensitive removal (exact match, different case, no false match)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix UsersTable to separate display names from original usernames** - `435135f` (fix)
2. **Task 2 RED: Add failing tests for case-insensitive removeUser** - `32906a2` (test)
3. **Task 2 GREEN: Make SessionManager.removeUser case-insensitive** - `fcda348` (feat)

## Files Created/Modified

- `planningpoker-web/src/containers/UsersTable.jsx` - Removed `.map(startCase)` from allUsers; `startCase` moved to JSX display only; dispatch calls use original name
- `planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java` - `removeUser` uses `removeIf(equalsIgnoreCase)` instead of case-sensitive `remove()`
- `planningpoker-api/src/test/java/com/richashworth/planningpoker/service/SessionManagerTest.java` - Three new tests for case-insensitive removal

## Decisions Made

- Send original username (not lowercased, not startCased) to `kickUser`/`promoteUser` — server validates session membership by name and this preserves the server-stored casing contract
- Use `ListMultimap.get(sessionId).removeIf()` rather than wrapping removal in a loop — the live view means modifications are reflected in the multimap, and the synchronized wrapper ensures thread safety

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- Worktree was initialized from old master (a22c164) rather than the Phase 07 feature branch HEAD (4b920a9). Required `git reset --soft` then `git checkout HEAD -- .` to restore working tree before applying fixes. No code impact.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All three UAT failures addressed: host star for multi-word usernames, host exclusion from own row, and kick actually removing the user
- Kicked user redirect and toast (unblocked by this fix) should now work end-to-end
- All backend tests pass (36 tests), all frontend unit tests pass (27 tests)

## Self-Check: PASSED

- FOUND: 07-03-SUMMARY.md
- FOUND: UsersTable.jsx
- FOUND: SessionManager.java
- FOUND: commit 435135f (fix UsersTable)
- FOUND: commit 32906a2 (test removeUser RED)
- FOUND: commit fcda348 (feat removeUser GREEN)

---
*Phase: 07-host-ui-notifications*
*Completed: 2026-04-06*
