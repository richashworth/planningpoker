---
phase: 07-host-ui-notifications
plan: "02"
subsystem: ui
tags: [react, redux, mui, websocket, dialog, snackbar]

requires:
  - phase: 07-host-ui-notifications
    provides: Redux host state (plan 01) for conditional rendering
  - phase: 06-host-actions-websocket-events
    provides: Backend /kick and /promote endpoints
provides:
  - Host-only kick and promote action icons in UsersTable
  - Kick confirmation dialog with Cancel/Remove buttons
  - Kick detection via WebSocket user list changes
  - Kicked user redirect to Welcome page with info toast
affects: [host-management-e2e-tests]

tech-stack:
  added: ["@mui/icons-material PersonRemoveRounded", "@mui/icons-material SwapHorizRounded", "MUI Dialog", "MUI Snackbar"]
  patterns: [kick-detection-via-ws, session-storage-toast-passing, confirmation-dialog]

key-files:
  created: []
  modified:
    - planningpoker-web/src/actions/index.js
    - planningpoker-web/src/containers/UsersTable.jsx
    - planningpoker-web/src/pages/PlayGame.jsx
    - planningpoker-web/src/pages/Welcome.jsx
    - planningpoker-web/src/reducers/reducer_game.js
    - planningpoker-web/src/reducers/__tests__/reducer_game.test.js

key-decisions:
  - "Kick detection via WS user list: if registered user not in users array, dispatch kicked()"
  - "sessionStorage for cross-page message passing: avoids Redux state surviving navigation"
  - "Promote executes immediately (no confirmation) since it is non-destructive"
  - "Kick requires confirmation dialog to prevent accidental removals"

patterns-established:
  - "sessionStorage toast pattern: writer sets pp-kicked-message, reader clears on mount"
  - "Confirmation dialog for destructive actions: useState(null) target, Dialog with Cancel/Confirm"

requirements-completed: [ACT-03, NOTIF-01, UI-01]

duration: 10min
completed: 2026-04-06
---

# Plan 07-02: Host Controls & Kick Notification Summary

**Inline kick/promote controls for host with confirmation dialog and kicked-user toast redirect**

## Performance

- **Duration:** 10 min
- **Started:** 2026-04-06T22:24:00Z
- **Completed:** 2026-04-06T22:34:00Z
- **Tasks:** 2 (auto) + 1 checkpoint (auto-approved)
- **Files modified:** 6

## Accomplishments
- kickUser and promoteUser action creators calling /kick and /promote endpoints with error handling
- KICKED reducer case resets game state and sets kickedMessage for toast display
- PlayGame detects kick via WebSocket user list absence and passes message via sessionStorage
- Welcome page shows info Snackbar toast on mount if pp-kicked-message exists
- UsersTable renders SwapHorizRounded (promote) and PersonRemoveRounded (kick) icons for host only
- Kick requires MUI Dialog confirmation before dispatching; promote executes immediately
- Non-host users see no action icons (isHost conditional check)

## Task Commits

Each task was committed atomically:

1. **Task 1: Kick/promote actions, kick detection, kicked toast** - `6c12d7c` (feat)
2. **Task 2: Inline kick/promote icons and confirmation dialog** - `2efd962` (feat)

## Files Created/Modified
- `planningpoker-web/src/actions/index.js` - Added KICK_USER, PROMOTE_USER, KICKED constants; kickUser, promoteUser, kicked creators
- `planningpoker-web/src/reducers/reducer_game.js` - Added KICKED case with kickedMessage, kickedMessage in initialGameState
- `planningpoker-web/src/reducers/__tests__/reducer_game.test.js` - Added KICKED test, updated initialState with kickedMessage
- `planningpoker-web/src/pages/PlayGame.jsx` - Kick detection useEffect, sessionStorage message passing
- `planningpoker-web/src/pages/Welcome.jsx` - Snackbar/Alert toast for kicked message
- `planningpoker-web/src/containers/UsersTable.jsx` - Kick/promote icons, confirmation Dialog, dispatch wiring

## Decisions Made
- Used sessionStorage (not Redux) for cross-page kicked message because Redux state resets on KICKED dispatch
- Promote icon (SwapHorizRounded) chosen over AdminPanelSettings for clarity of "transfer" semantics
- Case-insensitive name comparison for kick/promote dispatch since backend does containsIgnoreCase

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
- Test initialState needed kickedMessage field added after reducer_game gained it (fixed in same commit)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Complete host management UI is functional end-to-end
- Ready for verification and e2e testing

---
*Phase: 07-host-ui-notifications*
*Completed: 2026-04-06*
