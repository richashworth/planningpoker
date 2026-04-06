---
phase: 06-host-actions-websocket-events
plan: "02"
subsystem: backend
tags: [host-actions, kick, promote, tdd, 403-forbidden, websocket]
dependency_graph:
  requires: [06-01 (HostActionException, ErrorHandler 403, SessionManager.promoteHost)]
  provides: [GameController.kickUser, GameController.promoteUser]
  affects:
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java
    - planningpoker-api/src/test/java/com/richashworth/planningpoker/controller/GameControllerTest.java
tech_stack:
  added: []
  patterns: [HostActionException for 403 gate, synchronized host check (TOCTOU guard), burst messaging after state mutation]
key_files:
  created: []
  modified:
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java
    - planningpoker-api/src/test/java/com/richashworth/planningpoker/controller/GameControllerTest.java
decisions:
  - Self-kick/self-promote check fires before host check — getHost stub omitted from self-action tests to satisfy STRICT_STUBS
  - promoteUser does not call burstResultsMessages — promote does not change vote state
  - Both endpoints use synchronized(sessionManager) block for TOCTOU-safe host identity check
metrics:
  duration: "~20 minutes"
  completed_date: "2026-04-06"
  tasks_completed: 2
  files_modified: 2
---

# Phase 06 Plan 02: Kick and Promote Endpoints Summary

**One-liner:** Added `POST /kick` and `POST /promote` endpoints to GameController with host authorization, session membership validation, and WebSocket broadcast via existing burst mechanism.

## What Was Built

Two host-management endpoints wired into the existing controller/service/messaging stack:

### Task 1: kickUser endpoint (TDD)

**`GameController.kickUser`** (new method):
- `POST /kick?userName=&targetUser=&sessionId=`
- Validates caller is a session member via `validateSessionMembership`
- Throws `IllegalArgumentException("cannot kick yourself")` if `userName == targetUser`
- Throws `HostActionException("only the host can perform this action")` if caller is not host — maps to 403 via ErrorHandler
- Throws `IllegalArgumentException("target user is not a member of this session")` if target not in session
- Calls `sessionManager.removeUser(targetUser, sessionId)` — clears membership and estimates, auto-promotes host if kicked user was host
- All validation inside `synchronized(sessionManager)` block (D-02 TOCTOU guard)
- Broadcasts `burstUsersMessages` + `burstResultsMessages` after kick

**4 new tests in `GameControllerTest`:**
- `testKickUser` — happy path: host kicks another member
- `testKickUserNonHostRejected` — non-host caller throws HostActionException
- `testKickUserTargetNotInSession` — target not in session throws IllegalArgumentException
- `testKickUserCannotKickSelf` — self-kick throws IllegalArgumentException

### Task 2: promoteUser endpoint (TDD)

**`GameController.promoteUser`** (new method):
- `POST /promote?userName=&targetUser=&sessionId=`
- Validates caller is a session member via `validateSessionMembership`
- Throws `IllegalArgumentException("cannot promote yourself")` if `userName == targetUser`
- Throws `HostActionException("only the host can perform this action")` if caller is not host
- Calls `sessionManager.promoteHost(sessionId, targetUser)` — reassigns host without removing old host; validates target membership inside SessionManager
- All validation inside `synchronized(sessionManager)` block
- Broadcasts `burstUsersMessages` only — promote does not affect vote state

**3 new tests in `GameControllerTest`:**
- `testPromoteUser` — happy path: host promotes another member; burstResultsMessages NOT called
- `testPromoteUserNonHostRejected` — non-host caller throws HostActionException
- `testPromoteUserCannotPromoteSelf` — self-promote throws IllegalArgumentException

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unnecessary getHost stub from testKickUserCannotKickSelf**
- **Found during:** Task 1 GREEN phase
- **Issue:** The self-check (`userName.equalsIgnoreCase(targetUser)`) fires before the host check, so `getHost` was never called in the self-kick test. Mockito STRICT_STUBS detected the unused stub and failed the test.
- **Fix:** Removed `when(sessionManager.getHost(SESSION_ID)).thenReturn("Rich")` from `testKickUserCannotKickSelf`.
- **Files modified:** `GameControllerTest.java`
- **Commit:** 35ae0b0 (included in feat commit)

## Threat Surface Scan

Two new network endpoints introduced: `POST /kick` and `POST /promote`. Both are within the plan's threat model (T-06-03, T-06-04, T-06-06) — no new trust boundaries discovered beyond what was planned. The `validateSessionMembership` + synchronized host check pattern matches the mitigations specified.

## Self-Check

### Files created/modified exist:
- [x] `planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java`
- [x] `planningpoker-api/src/test/java/com/richashworth/planningpoker/controller/GameControllerTest.java`

### Commits exist:
- [x] `9feb556`: test(06-02): add failing tests for kickUser endpoint
- [x] `35ae0b0`: feat(06-02): add kickUser endpoint to GameController with host authorization
- [x] `f974998`: test(06-02): add failing tests for promoteUser endpoint
- [x] `59812f6`: feat(06-02): add promoteUser endpoint to GameController with host authorization

## Self-Check: PASSED
