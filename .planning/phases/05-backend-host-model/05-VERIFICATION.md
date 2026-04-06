---
phase: 05-backend-host-model
verified: 2026-04-06T17:10:00Z
status: passed
score: 9/9 must-haves verified
re_verification: false
---

# Phase 5: Backend Host Model Verification Report

**Phase Goal:** Track host identity server-side and auto-promote on departure
**Verified:** 2026-04-06T17:10:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | When a session is created and a user registered, that user is stored as host | VERIFIED | `SessionManager.registerUser` calls `sessionHosts.putIfAbsent(sessionId, userName)` (line 115). `testGetHostReturnsCreator` asserts this. |
| 2 | `getHost(sessionId)` returns the current host username | VERIFIED | `getHost` returns `sessionHosts.get(sessionId)` (lines 72-74). 9 new tests exercise this. |
| 3 | When the host is removed, the next user by join order becomes host | VERIFIED | `removeUser` promotes `remainingUsers.get(0)` after host departure (lines 124-132). `testHostAutoPromotesOnRemoval` and `testHostPromotesToNextByJoinOrder` cover this. |
| 4 | When the last user is removed, `getHost` returns null without error | VERIFIED | `removeUser` calls `sessionHosts.remove(sessionId)` when list is empty (line 130). `testHostNullWhenLastUserLeaves` confirms no NPE. |
| 5 | `clearSessions` and `evictIdleSessions` clean up host data | VERIFIED | `clearSessions` calls `sessionHosts.clear()` (line 105). `evictIdleSessions` calls `sessionHosts.remove(sessionId)` (line 156). Both covered by dedicated tests. |
| 6 | `createSession` response includes the host username | VERIFIED | `GameController.createSession` calls `sessionManager.getHost(sessionId)` and passes host to `SessionResponse` (lines 72-74). `testCreateSession` asserts `response.host() == USER_NAME`. |
| 7 | `joinSession` response includes the current host username | VERIFIED | `GameController.joinSession` calls `sessionManager.getHost(sessionId)` and passes host to `SessionResponse` (lines 55-57). `testJoinSession` asserts `response.host() == "HostUser"`. |
| 8 | `refresh` triggers a users WebSocket message that includes the host username alongside the user list | VERIFIED | `MessagingUtils.sendUsersMessage` builds a `LinkedHashMap` with `"users"` and `"host"` keys (lines 44-49). `refresh` calls `sendUsersMessage`. `testSendUsersMessageIncludesHost` and `testSendUsersMessageWithNullHost` cover this. |
| 9 | After host leaves, the next API call reflects the new host | VERIFIED | Auto-promotion happens inside `SessionManager.removeUser` which is called synchronously within `leaveSession` before the response returns. The subsequent burst users message includes the promoted host. |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java` | Host tracking with `sessionHosts` ConcurrentHashMap | VERIFIED | Contains `sessionHosts` field, `getHost`, `setHost`, `putIfAbsent` in `registerUser`, auto-promotion in `removeUser`, cleanup in `clearSessions` and `evictIdleSessions`. |
| `planningpoker-api/src/test/java/com/richashworth/planningpoker/service/SessionManagerTest.java` | Tests for host tracking and auto-promotion | VERIFIED | Contains all 9 required host tests: `testGetHostReturnsCreator`, `testHostAutoPromotesOnRemoval`, `testHostPromotesToNextByJoinOrder`, `testHostNullWhenLastUserLeaves`, `testSetHostExplicitly`, `testClearSessionsCleansHostData`, `testEvictIdleSessionsCleansHostData`, `testGetHostReturnsNullForUnknownSession`, `testHostDoesNotChangeWhenNonHostLeaves`. 28 total tests, 0 failures. |
| `planningpoker-api/src/main/java/com/richashworth/planningpoker/model/SessionResponse.java` | `SessionResponse` record with `host` field | VERIFIED | `String host` is the first field in the record. |
| `planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java` | Controllers that pass host to `SessionResponse` | VERIFIED | Both `createSession` and `joinSession` call `sessionManager.getHost(sessionId)` and pass it to `SessionResponse`. |
| `planningpoker-api/src/main/java/com/richashworth/planningpoker/util/MessagingUtils.java` | Users WebSocket message includes host | VERIFIED | `sendUsersMessage` builds `LinkedHashMap` with `"users"` and `"host"` keys. |
| `planningpoker-api/src/test/java/com/richashworth/planningpoker/controller/GameControllerTest.java` | Tests verifying host in responses | VERIFIED | Contains `response.host()` assertions in `testCreateSession`, `testJoinSession`, `testCreateSessionWithTshirtScheme`. 12 total tests, 0 failures. |
| `planningpoker-api/src/test/java/com/richashworth/planningpoker/util/MessagingUtilsTest.java` | Test verifying users message includes host | VERIFIED | Contains `testSendUsersMessageIncludesHost`, `testSendUsersMessageWithNullHost`. 7 total tests, 0 failures. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `SessionManager.registerUser` | `sessionHosts` | `putIfAbsent` sets first registered user as host | WIRED | Line 115: `sessionHosts.putIfAbsent(sessionId, userName)` |
| `SessionManager.removeUser` | `sessionHosts` | auto-promotes next user when host leaves | WIRED | Lines 124-132: reads current host, compares, promotes `remainingUsers.get(0)` or removes key |
| `GameController.createSession` | `SessionManager.getHost` | fetches host after registration to include in response | WIRED | Line 72: `String host = sessionManager.getHost(sessionId);` |
| `GameController.joinSession` | `SessionManager.getHost` | fetches host to include in join response | WIRED | Line 55: `String host = sessionManager.getHost(sessionId);` |
| `MessagingUtils.sendUsersMessage` | `SessionManager.getHost` | includes host in users WebSocket payload | WIRED | Line 47: `payload.put("host", sessionManager.getHost(sessionId));` |

### Data-Flow Trace (Level 4)

All artifacts are service/controller layer with no rendering — data flows through in-memory `ConcurrentHashMap` to REST response and WebSocket payload. No static returns or empty fallbacks on the data paths that matter.

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| `SessionManager.sessionHosts` | `String host` | `ConcurrentHashMap` populated by `registerUser` / `removeUser` | Yes — live in-memory state | FLOWING |
| `SessionResponse.host` | `host` field | `sessionManager.getHost(sessionId)` | Yes — reads from live map | FLOWING |
| `MessagingUtils` users payload | `"host"` key | `sessionManager.getHost(sessionId)` | Yes — reads from live map | FLOWING |

### Behavioral Spot-Checks

Tests are the runnable entry point for this phase (pure backend service/controller logic). The Gradle test suite was executed directly:

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All `SessionManagerTest` host tests pass | `./gradlew planningpoker-api:test --rerun-tasks` | 28 tests, 0 failures, 0 errors | PASS |
| All `GameControllerTest` host assertion tests pass | same run | 12 tests, 0 failures, 0 errors | PASS |
| All `MessagingUtilsTest` host payload tests pass | same run | 7 tests, 0 failures, 0 errors | PASS |
| BUILD result | `BUILD SUCCESSFUL in 4s` | Exit 0 | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| HOST-01 | 05-01-PLAN, 05-02-PLAN | Session creator is tracked as host server-side in SessionManager | SATISFIED | `sessionHosts.putIfAbsent` in `registerUser`; `testGetHostReturnsCreator` passes; host returned in `createSession` and `joinSession` responses. |
| HOST-02 | 05-01-PLAN, 05-02-PLAN | When host leaves, next participant by join order automatically becomes host | SATISFIED | `removeUser` auto-promotes `remainingUsers.get(0)`; `testHostAutoPromotesOnRemoval` and `testHostPromotesToNextByJoinOrder` pass; `leaveSession` calls `removeUser` synchronously before responding. |

No orphaned requirements: REQUIREMENTS.md maps HOST-01 and HOST-02 to Phase 5 only. Both are accounted for.

### Anti-Patterns Found

None. Scanned all five modified source files for TODO/FIXME/placeholder comments, stub returns, and hardcoded empty values — none found.

### Human Verification Required

None. All success criteria are fully verifiable from the source code and test results.

### Gaps Summary

No gaps. All phase must-haves are verified at all levels (exists, substantive, wired, data-flowing). All 47 backend tests pass. Requirements HOST-01 and HOST-02 are fully satisfied.

**Note on SC2 wording ("refresh API responses"):** The ROADMAP says host is "returned in joinSession and refresh API responses." The `refresh` endpoint returns void — host is surfaced via the WebSocket users message that `refresh` triggers. This is the correct and intended design per the plan (`05-02-PLAN.md` Task 2 rationale), not a gap.

---

_Verified: 2026-04-06T17:10:00Z_
_Verifier: Claude (gsd-verifier)_
