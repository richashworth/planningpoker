---
status: diagnosed
phase: 07-host-ui-notifications
source: 07-01-SUMMARY.md, 07-02-SUMMARY.md
started: 2026-04-06T21:35:00Z
updated: 2026-04-06T21:50:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Host Star Indicator
expected: In the participants list, the session host has a gold star icon next to their name with a "Host" tooltip on hover. All participants see this indicator.
result: issue
reported: "Star icon does not appear for multi-word usernames (e.g. HostUser → startCase → 'Host User'). The comparison name.toLowerCase() === host?.toLowerCase() fails because startCase inserts spaces ('host user' !== 'hostuser'). Works correctly for single-word names."
severity: major

### 2. Host Sees Kick and Promote Icons
expected: When you are the host, each non-host participant row shows a swap/transfer icon (promote) and a person-remove icon (kick). These icons are NOT visible to non-host users.
result: issue
reported: "Same startCase bug as Test 1: with multi-word names, the host sees kick/promote icons on their own row (should only see star). The isHost check and name !== host exclusion both fail due to casing mismatch. Works correctly for single-word names."
severity: major

### 3. Kick Confirmation Dialog
expected: Clicking the kick icon opens a confirmation dialog (e.g., "Remove [username]?") with Cancel and Remove buttons. Cancelling closes the dialog without kicking.
result: pass

### 4. Kick Executes and Removes User
expected: Confirming the kick dialog removes the participant from the session. They disappear from the participants list for all remaining users.
result: issue
reported: "Kick returns 200 OK but does not actually remove the user. The frontend sends targetUser as lowercase (name.toLowerCase() in UsersTable dispatch), but SessionManager.removeUser() uses case-sensitive ListMultimap.remove(). Server stores 'Bob' but receives 'bob', so removal is a no-op. Also, Vite proxy was missing /kick and /promote routes (fixed during testing)."
severity: blocker

### 5. Kicked User Redirect with Toast
expected: A kicked user is automatically redirected to the Welcome page and sees an informational toast/snackbar explaining they were removed from the session.
result: blocked
blocked_by: prior-phase
reason: "Cannot test — kick does not actually remove the user (Test 4 blocker). Redirect and toast logic exists in code but is unreachable until kick works."

### 6. Promote Transfers Host Immediately
expected: Clicking the promote icon on a participant immediately transfers host status to them. The star indicator moves to the new host. No confirmation dialog is shown (non-destructive action).
result: pass

### 7. Non-Host Sees No Action Controls
expected: When you are NOT the host, you see the host star indicator but no kick or promote icons next to any participant.
result: pass

## Summary

total: 7
passed: 3
issues: 3
pending: 0
skipped: 0
blocked: 1

## Gaps

- truth: "Host star indicator appears for all usernames including multi-word names"
  status: failed
  reason: "User reported: startCase transforms 'HostUser' to 'Host User', breaking toLowerCase comparison with Redux host value 'hostuser' vs 'host user'"
  severity: major
  test: 1
  root_cause: "UsersTable.jsx line 62: name.toLowerCase() === host?.toLowerCase() fails when startCase-transformed display name has different word boundaries than the original stored name"
  artifacts:
    - path: "planningpoker-web/src/containers/UsersTable.jsx"
      issue: "startCase display name used in comparison instead of original name"
  missing:
    - "Compare against original (pre-startCase) username, not the display-transformed name"
  debug_session: ""

- truth: "Host does not see kick/promote icons on their own row"
  status: failed
  reason: "User reported: same startCase casing mismatch causes isHost check and name !== host exclusion to fail for multi-word names"
  severity: major
  test: 2
  root_cause: "Same root cause as Test 1 — startCase breaks name comparisons in UsersTable.jsx"
  artifacts:
    - path: "planningpoker-web/src/containers/UsersTable.jsx"
      issue: "isHost and host exclusion comparisons use startCase-transformed names"
  missing:
    - "Use original usernames for all comparisons, only use startCase for display"
  debug_session: ""

- truth: "Kick actually removes the targeted user from the session"
  status: failed
  reason: "User reported: kick returns 200 but user stays. Frontend sends lowercase targetUser, backend ListMultimap.remove() is case-sensitive"
  severity: blocker
  test: 4
  root_cause: "Two issues: (1) UsersTable.jsx line 72 sends name.toLowerCase() as targetUser but server stores original casing. (2) SessionManager.removeUser() uses ListMultimap.remove() which is case-sensitive, so 'bob' does not match stored 'Bob'. (3) Vite proxy missing /kick and /promote routes."
  artifacts:
    - path: "planningpoker-web/src/containers/UsersTable.jsx"
      issue: "Sends lowercase targetUser to kick/promote endpoints"
    - path: "planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java"
      issue: "removeUser uses case-sensitive ListMultimap.remove()"
    - path: "planningpoker-web/vite.config.js"
      issue: "Missing /kick and /promote proxy routes (already fixed during testing)"
  missing:
    - "Send original username (not lowercased) to kick/promote endpoints"
    - "Or make removeUser case-insensitive"
  debug_session: ""
