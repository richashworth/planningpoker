---
phase: 05-backend-host-model
plan: "01"
subsystem: backend
tags: [host-tracking, session-manager, tdd, host-management]
dependency_graph:
  requires: []
  provides: [SessionManager.getHost, SessionManager.setHost, host-auto-promotion]
  affects: [planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java]
tech_stack:
  added: []
  patterns: [ConcurrentHashMap for host state, putIfAbsent for first-user-as-host]
key_files:
  created: []
  modified:
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java
    - planningpoker-api/src/test/java/com/richashworth/planningpoker/service/SessionManagerTest.java
decisions:
  - sessionHosts uses ConcurrentHashMap matching existing sessionSchemeConfigs pattern
  - putIfAbsent atomically sets first registered user as host without race conditions
  - removeUser reads remaining users from sessionUsers list to determine next host by join order
  - setHost is package-accessible; Phase 6 controllers will add caller validation per T-05-01
metrics:
  duration: "~20 minutes"
  completed_date: "2026-04-06"
  tasks_completed: 1
  files_modified: 2
---

# Phase 05 Plan 01: Host Tracking in SessionManager Summary

**One-liner:** Added `sessionHosts` ConcurrentHashMap to SessionManager with `getHost`/`setHost` methods, `putIfAbsent` first-user-as-host logic, and join-order auto-promotion on `removeUser`.

## What Was Built

Host identity tracking was added to `SessionManager` as the foundation for v1.2 Host Management (HOST-01, HOST-02). The implementation follows the same ConcurrentHashMap pattern already established by `sessionSchemeConfigs`.

### Key changes

**`SessionManager.java`:**
- New field: `private final ConcurrentHashMap<String, String> sessionHosts`
- New method: `getHost(String sessionId)` — returns current host or null
- New method: `setHost(String sessionId, String userName)` — explicit host assignment
- `registerUser`: calls `sessionHosts.putIfAbsent(sessionId, userName)` so the first registrant becomes host atomically
- `removeUser`: after removal, if the departing user was host, promotes `remainingUsers.get(0)` (first remaining by join order) or removes the key if no users remain
- `clearSessions`: adds `sessionHosts.clear()`
- `evictIdleSessions`: adds `sessionHosts.remove(sessionId)` in the eviction loop

**`SessionManagerTest.java`:**
9 new tests added covering all specified behaviours.

## Tasks Completed

| Task | Description | Commit | Type |
|------|-------------|--------|------|
| RED | Add 9 failing host-tracking tests | fe97ea6 | test |
| GREEN | Implement host tracking in SessionManager | 77a5d6e | feat |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All methods are fully implemented with live in-memory state.

## Threat Flags

None. `sessionHosts` is an internal ConcurrentHashMap — no new network endpoints or trust boundaries introduced. Threat T-05-01 (spoofing via setHost) is accepted per plan: setHost is only called internally by registerUser/removeUser; controller-level caller validation is deferred to Phase 6.

## Self-Check: PASSED

- [x] `SessionManager.java` contains `sessionHosts` field
- [x] `SessionManager.java` contains `getHost` method
- [x] `SessionManager.java` contains `setHost` method
- [x] `SessionManager.java` registerUser contains `sessionHosts.putIfAbsent`
- [x] `SessionManager.java` removeUser contains `sessionHosts` auto-promotion
- [x] `SessionManager.java` clearSessions contains `sessionHosts.clear()`
- [x] `SessionManager.java` evictIdleSessions contains `sessionHosts.remove(sessionId)`
- [x] `SessionManagerTest.java` contains `testGetHostReturnsCreator`
- [x] `SessionManagerTest.java` contains `testHostAutoPromotesOnRemoval`
- [x] `SessionManagerTest.java` contains `testHostPromotesToNextByJoinOrder`
- [x] `SessionManagerTest.java` contains `testHostNullWhenLastUserLeaves`
- [x] `SessionManagerTest.java` contains `testSetHostExplicitly`
- [x] All SessionManagerTest tests pass (BUILD SUCCESSFUL)
- [x] Commits fe97ea6 and 77a5d6e exist in git log
