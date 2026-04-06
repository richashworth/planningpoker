---
status: partial
phase: 07-host-ui-notifications
source: [07-VERIFICATION.md]
started: 2026-04-06T23:06:00Z
updated: 2026-04-06T23:06:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Host star renders visually
expected: Gold star with tooltip appears next to host name in both host and non-host browser windows
result: [pending]

### 2. Host sees action icons on non-host rows only
expected: Kick/promote icons visible on non-host participant rows; absent on host's own row; absent entirely for non-host users
result: [pending]

### 3. Kick dialog cancel path
expected: Clicking kick icon shows confirmation dialog; clicking Cancel dismisses dialog and leaves user in session
result: [pending]

### 4. Kicked user redirect + toast
expected: Kicked user is redirected to Welcome page with info Snackbar notification at top-center
result: [pending]

### 5. Promote transfers host in real-time
expected: After promote, star indicator moves to new host and action icons swap in both tabs simultaneously
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
