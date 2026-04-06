---
phase: 05-backend-host-model
plan: "02"
subsystem: backend
tags: [host-identity, api-contract, websocket, tdd, session-response]
dependency_graph:
  requires: [SessionManager.getHost, SessionManager.setHost]
  provides: [SessionResponse.host, MessagingUtils.sendUsersMessage-enriched]
  affects:
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/model/SessionResponse.java
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/util/MessagingUtils.java
tech_stack:
  added: []
  patterns: [LinkedHashMap for ordered WebSocket payload, record accessor for host field]
key_files:
  created: []
  modified:
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/model/SessionResponse.java
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/util/MessagingUtils.java
    - planningpoker-api/src/test/java/com/richashworth/planningpoker/controller/GameControllerTest.java
    - planningpoker-api/src/test/java/com/richashworth/planningpoker/util/MessagingUtilsTest.java
decisions:
  - host field placed first in SessionResponse record for clean JSON output ordering
  - sendUsersMessage uses LinkedHashMap to ensure "users" precedes "host" in serialized JSON
  - usersMessage helper signature unchanged (Object payload) — only the value passed changes
  - Null host allowed in Map payload; Map.of not used because it rejects null values
metrics:
  duration: "~25 minutes"
  completed_date: "2026-04-06"
  tasks_completed: 2
  files_modified: 5
---

# Phase 05 Plan 02: Expose Host Identity in API and WebSocket Summary

**One-liner:** Added `host` field to `SessionResponse` record and enriched the users WebSocket payload with a `Map<String, Object>` containing both the user list and host username so REST clients and WebSocket subscribers can identify the session host.

## What Was Built

Host identity is now surfaced through two channels:

### REST API (Task 1)

**`SessionResponse.java`:**
- New `host` field added as the first record component (renders first in JSON output)
- Record now: `SessionResponse(String host, String sessionId, String schemeType, List<String> values, boolean includeUnsure, boolean includeCoffee)`

**`GameController.java`:**
- `createSession`: calls `sessionManager.getHost(sessionId)` after registration, passes host to `SessionResponse`
- `joinSession`: calls `sessionManager.getHost(sessionId)`, passes host to `SessionResponse`

**`GameControllerTest.java`:**
- `testCreateSession`: mocks `getHost` → `USER_NAME`, asserts `response.host() == USER_NAME`
- `testJoinSession`: mocks `getHost` → `"HostUser"`, asserts `response.host() == "HostUser"`
- `testCreateSessionWithTshirtScheme`: mocks `getHost` → `USER_NAME`, asserts `response.host() == USER_NAME`

### WebSocket Users Message (Task 2)

**`MessagingUtils.java`:**
- `sendUsersMessage` now builds a `LinkedHashMap<String, Object>` with keys `"users"` (list) and `"host"` (string or null) before calling `usersMessage(payload)`
- Null host handled safely — `LinkedHashMap` accepts null values unlike `Map.of()`
- `burstUsersMessages` calls `sendUsersMessage` in a loop, so the enriched payload is sent at all burst intervals

**`MessagingUtilsTest.java`:**
- `testSendUsersMessage`: updated to expect enriched Map payload with `USER_NAME` as host
- `testBurstUsersMessages`: updated to expect enriched Map payload
- `testSendUsersMessageIncludesHost`: new focused test using `ArgumentCaptor` to verify host key in payload
- `testSendUsersMessageWithNullHost`: new test verifying null host causes no NPE and payload contains `"host" -> null`

## Tasks Completed

| Task | Description | Commit | Type |
|------|-------------|--------|------|
| 1 RED+GREEN | SessionResponse host field + controller updates + tests | 33a8ef9 | feat |
| 2 RED+GREEN | MessagingUtils enriched users payload + tests | 6f56e7c | feat |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All host fields are populated from live `SessionManager.getHost()` calls.

## Threat Flags

None. Host field is server-set from `SessionManager.getHost()`. No client input is accepted for the host field. T-05-05 (spoofing) is mitigated as specified in the plan threat model.

## Self-Check: PASSED

- [x] `SessionResponse.java` contains `String host` as first field
- [x] `GameController.createSession` calls `sessionManager.getHost` and passes host to `SessionResponse`
- [x] `GameController.joinSession` calls `sessionManager.getHost` and passes host to `SessionResponse`
- [x] `MessagingUtils.sendUsersMessage` builds Map with `"users"` and `"host"` keys
- [x] `GameControllerTest` contains `response.host()` assertions in 3 tests
- [x] `MessagingUtilsTest` contains `testSendUsersMessageIncludesHost`
- [x] All backend tests pass (BUILD SUCCESSFUL)
- [x] Commits 33a8ef9 and 6f56e7c exist in git log
