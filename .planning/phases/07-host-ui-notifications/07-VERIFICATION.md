---
phase: 07-host-ui-notifications
verified: 2026-04-06T23:05:00Z
status: human_needed
score: 5/5 must-haves verified
re_verification:
  previous_status: verified
  previous_score: N/A (no structured scoring in prior report)
  gaps_closed: []
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Host star indicator renders for all participants in two-browser session"
    expected: "Gold star with 'Host' tooltip appears next to host name for both host and non-host browser windows"
    why_human: "Cannot verify real-time WebSocket rendering or visual appearance programmatically"
  - test: "Host sees kick/promote icons on non-host rows only"
    expected: "Swap and PersonRemove icons visible next to non-host participants; not visible on host's own row; not visible in non-host window"
    why_human: "Conditional rendering based on runtime Redux state requires browser verification"
  - test: "Kick confirmation dialog — cancel does not kick"
    expected: "Clicking kick icon opens Dialog; Cancel closes without removing user"
    why_human: "UI interaction flow requires browser"
  - test: "Kicked user redirect with toast (end-to-end)"
    expected: "After confirming kick, kicked user's browser navigates to Welcome; info Snackbar 'You have been removed from the session by the host.' appears at top-center for 6 seconds"
    why_human: "Cross-page sessionStorage toast flow requires two live browser sessions; cannot verify with static analysis"
  - test: "Promote transfers host in real-time for all participants"
    expected: "After clicking promote, star moves to new host and action icons update instantly for all connected browsers"
    why_human: "Real-time WebSocket propagation and visual update requires live sessions"
---

# Phase 7: Host UI & Notifications — Verification Report

**Phase Goal:** Participants can see who the current host is, the host sees inline kick and promote controls next to each participant, and a kicked user lands on the welcome page with a clear explanation
**Verified:** 2026-04-06T23:05:00Z
**Status:** human_needed
**Re-verification:** Yes — supersedes prior 07-VERIFICATION.md (no structured scoring; this report applies the full GSD verification protocol including Plan 07-03 gap-closure fixes)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every participant sees visual host indicator next to current host name | VERIFIED | `StarRounded` rendered at UsersTable.jsx:64-66 with Tooltip "Host"; comparison uses `name.toLowerCase() === host?.toLowerCase()` on original (non-startCase) username |
| 2 | Host sees kick and promote icons next to every non-host participant | VERIFIED | `isHost && name.toLowerCase() !== host?.toLowerCase()` conditional at line 68 guards `SwapHorizRounded` and `PersonRemoveRounded` icons |
| 3 | Non-host users see no kick or promote icons | VERIFIED | Same `isHost` conditional — evaluates false for non-host; icons are not rendered |
| 4 | Clicking kick opens confirmation dialog; kick only executes after confirmation | VERIFIED | `setKickTarget(name)` on click opens Dialog; `dispatch(kickUser(...))` fires only on "Remove" button inside Dialog |
| 5 | Kicked participant redirected to Welcome page with toast explanation | VERIFIED | PlayGame.jsx sets `sessionStorage('pp-kicked-message')`; KICKED reducer resets `isRegistered` triggering navigate('/'); Welcome.jsx reads sessionStorage on mount and renders `<Snackbar>` |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `planningpoker-web/src/reducers/reducer_users.js` | Extracts users array from enriched {users, host} WS payload | VERIFIED | Line 8: `return action.payload.users \|\| action.payload` — enriched payload + backward-compatible fallback |
| `planningpoker-web/src/reducers/reducer_game.js` | Stores host from REST and WS; KICKED resets with message | VERIFIED | Lines 12-13: `host: ''`, `kickedMessage: ''` in initialState; lines 28, 44: host from CREATE/JOIN_GAME; line 47: host from USERS_UPDATED; line 49: KICKED case sets kickedMessage |
| `planningpoker-web/src/actions/index.js` | kickUser, promoteUser, kicked action creators; KICKED, KICK_USER, PROMOTE_USER constants | VERIFIED | Lines 13-15: constants; line 31: `kicked()`; lines 102-126: `kickUser`, `promoteUser` with axios + error handling |
| `planningpoker-web/src/containers/UsersTable.jsx` | Host star, kick/promote icons, confirmation Dialog; original usernames for comparisons/dispatch | VERIFIED | Line 30: `allUsers` uses original usernames (no startCase); line 61: startCase only in Typography; line 73: `promoteUser(currentUser, name, sessionId)` — original name; line 106: `kickUser(currentUser, kickTarget, sessionId)` — original name |
| `planningpoker-web/src/pages/PlayGame.jsx` | Kick detection useEffect; sessionStorage message passing | VERIFIED | Lines 29-35: kick detection via users list absence; lines 38-42: sessionStorage.setItem on kickedMessage |
| `planningpoker-web/src/pages/Welcome.jsx` | Snackbar toast reads sessionStorage on mount | VERIFIED | Lines 12-18: useEffect reads 'pp-kicked-message', sets toast state, removes from storage; lines 61-70: Snackbar with Alert severity="info" |
| `planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java` | Case-insensitive removeUser | VERIFIED | Line 128: `sessionUsers.get(sessionId).removeIf(u -> u.equalsIgnoreCase(userName))` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `PlayGame.jsx` USERS_MESSAGE handler | `reducer_users.js` + `reducer_game.js` | `dispatch(usersUpdated(msg.payload))` — payload is `{users, host}` | WIRED | PlayGame.jsx:56-57 dispatches usersUpdated; reducer_users:7-8 extracts `.users`; reducer_game:46-47 extracts `.host` |
| `reducer_game.js` host field | `UsersTable.jsx` star and isHost | `useSelector(state => state.game.host)` | WIRED | UsersTable.jsx:24: `const host = useSelector(state => state.game.host)`; used in comparisons at lines 26, 63, 68 |
| `UsersTable.jsx` kick icon | `/kick` endpoint | `dispatch(kickUser(currentUser, kickTarget, sessionId))` | WIRED | Line 106 dispatches kickUser; actions/index.js:103 posts to `/kick` with URLSearchParams |
| `UsersTable.jsx` promote icon | `/promote` endpoint | `dispatch(promoteUser(currentUser, name, sessionId))` | WIRED | Line 73 dispatches promoteUser; actions/index.js:116 posts to `/promote` |
| `PlayGame.jsx` kicked() dispatch | redirect to '/' | KICKED resets `isRegistered` to false; existing navigate('/') useEffect fires | WIRED | Lines 22-26: `!isUserRegistered` triggers `navigate('/')` which fires after KICKED resets state |
| `PlayGame.jsx` sessionStorage write | `Welcome.jsx` Snackbar | `sessionStorage.setItem('pp-kicked-message', ...)` / `sessionStorage.getItem(...)` | WIRED | PlayGame.jsx:40 writes; Welcome.jsx:13 reads on mount, clears on read |
| `SessionManager.removeUser` | `sessionUsers` ListMultimap | `removeIf(u -> u.equalsIgnoreCase(userName))` | WIRED | Line 128 — case-insensitive removal confirmed |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `UsersTable.jsx` host star | `host` (from `state.game.host`) | WS USERS_MESSAGE -> `usersUpdated(msg.payload)` -> reducer_game USERS_UPDATED | Yes — server-set in MessagingUtils.sendUsersMessage from sessionHosts map | FLOWING |
| `UsersTable.jsx` allUsers list | `users` (from `state.users`) | WS USERS_MESSAGE -> `usersUpdated(msg.payload)` -> reducer_users USERS_UPDATED | Yes — server sends live session participant list | FLOWING |
| `Welcome.jsx` Snackbar | `toast` state | `sessionStorage.getItem('pp-kicked-message')` on mount | Yes — set by PlayGame after KICKED dispatch | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Frontend tests pass | `cd planningpoker-web && npx vitest run` | 4 files, 30 tests passed | PASS |
| Backend tests pass | `./gradlew planningpoker-api:test --rerun-tasks` | BUILD SUCCESSFUL, 95 tests across 10 test suites | PASS |
| Case-insensitive removeUser tests | SessionManagerTest.java lines 349-371 | 3 dedicated tests: exact match, different case, no false match | PASS |
| KICKED reducer test | reducer_game.test.js:78-88 | `kickedMessage` set, `isRegistered` false | PASS |
| Enriched WS payload parsing | reducer_users.test.js:10-13 | Returns `['alice', 'bob']` from `{users, host}` payload | PASS |
| Legacy array payload fallback | reducer_users.test.js:15-17 | Returns `['alice']` from plain array | PASS |
| Vite proxy routes for kick/promote | vite.config.js lines 37-38 | `/kick` and `/promote` proxied to localhost:9000 | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| HOST-03 | 07-01, 07-03 | All participants can see who the current host is (visual indicator) | SATISFIED | StarRounded icon with Tooltip "Host" in UsersTable; host from Redux state.game.host; real-time via USERS_UPDATED |
| ACT-03 | 07-02, 07-03 | Kick action requires confirmation before executing | SATISFIED | Dialog with Cancel/Remove; `setKickTarget` on icon click; dispatch only fires in Remove button handler |
| UI-01 | 07-02, 07-03 | Host sees inline kick/promote icons next to each participant in users list | SATISFIED | `isHost && name.toLowerCase() !== host?.toLowerCase()` conditional renders SwapHorizRounded + PersonRemoveRounded |
| UI-02 | 07-01 | Non-host users do not see host control icons | SATISFIED | `isHost` evaluates false for non-hosts; action icon block not rendered |
| NOTIF-01 | 07-02 | Kicked user is redirected to welcome page with toast message explaining removal | SATISFIED | KICKED reducer resets isRegistered; navigate('/') fires; sessionStorage carries message; Welcome Snackbar displays it |

**Orphaned requirements check (REQUIREMENTS.md Phase 7 row):** REQUIREMENTS.md maps HOST-03, ACT-03, NOTIF-01, UI-01, UI-02 to Phase 7. All five are covered by plans 07-01 and 07-02. No orphaned requirements.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/actions/index.js` | 12 | `export const HOST_UPDATED = 'host-updated'` — defined but never imported or used anywhere | Info | Dead export; no functional impact. Host updates flow via USERS_UPDATED which carries both users and host. Not a stub — the export is defined and the mechanism works via USERS_UPDATED. |

No blockers or warnings. The single info-level finding is a dead export from the original plan that was superseded by using USERS_UPDATED to carry the host field.

### Human Verification Required

#### 1. Host star indicator — visual and real-time

**Test:** Open two browser tabs at http://localhost:3000. Host New Game as "Alice" in tab 1. Join as "Bob" in tab 2 (same session ID).
**Expected:** Both tabs show a gold star icon with "Host" tooltip next to "Alice" in the Players list. No star next to "Bob".
**Why human:** Visual rendering and real-time WebSocket-driven update cannot be verified statically.

#### 2. Host action icons — host sees, non-host does not

**Test:** In Alice's tab (host), verify SwapHorizRounded and PersonRemoveRounded icons appear next to "Bob" but NOT next to "Alice". In Bob's tab, verify no action icons appear at all.
**Expected:** Host sees two small icons per non-host row; non-host sees only the star indicator on Alice's row.
**Why human:** Conditional rendering based on runtime Redux identity state requires browser.

#### 3. Kick confirmation cancel path

**Test:** In Alice's tab, click the kick (person-remove) icon next to Bob. Verify the Dialog opens with "Are you sure you want to remove Bob from the session?" text. Click Cancel. Verify Bob is still in the session.
**Expected:** Dialog appears; Cancel closes it without any change to participant list.
**Why human:** UI dialog interaction requires browser.

#### 4. Kicked user redirect with toast (end-to-end)

**Test:** In Alice's tab, click kick icon next to Bob, then click Remove. Observe Bob's tab.
**Expected:** Bob's tab navigates to the Welcome page. An info-colored Snackbar appears at top-center: "You have been removed from the session by the host." It auto-dismisses after 6 seconds.
**Why human:** Cross-page sessionStorage toast flow and redirect requires two live browser sessions.

#### 5. Promote transfers host in real-time

**Test:** In Alice's tab, click the SwapHorizRounded (transfer host) icon next to Bob. Observe both tabs.
**Expected:** Star moves from Alice to Bob in both tabs simultaneously. Alice's tab no longer shows action icons (she is no longer host). Bob's tab now shows action icons next to Alice.
**Why human:** Real-time WebSocket propagation and UI re-rendering requires live session observation.

### Gaps Summary

No gaps found. All 5 roadmap success criteria are verified in code. All 5 Phase 7 requirements (HOST-03, ACT-03, UI-01, UI-02, NOTIF-01) are satisfied. The gap-closure plan (07-03) correctly addressed the three UAT failures:

- startCase display transform separated from comparison/dispatch logic (allUsers holds original names)
- kick/promote dispatches send original username, not lowercased
- `SessionManager.removeUser` uses case-insensitive `removeIf(equalsIgnoreCase)` — confirmed by 3 TDD tests

Test suites: 30/30 frontend tests pass; 95/95 backend tests pass.

The only open item is human verification of the visual and real-time behavior — a standard requirement for any UI feature that cannot be verified by static analysis alone.

---

_Verified: 2026-04-06T23:05:00Z_
_Verifier: Claude (gsd-verifier)_
