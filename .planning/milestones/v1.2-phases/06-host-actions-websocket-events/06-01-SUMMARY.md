---
phase: 06-host-actions-websocket-events
plan: "01"
subsystem: backend
tags: [host-actions, error-handling, session-manager, tdd, 403-forbidden]
dependency_graph:
  requires: [05-01 (SessionManager.getHost/setHost/sessionHosts)]
  provides: [HostActionException, ErrorHandler.handleForbidden, SessionManager.promoteHost]
  affects:
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/HostActionException.java
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/ErrorHandler.java
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java
    - planningpoker-api/src/test/java/com/richashworth/planningpoker/controller/ErrorHandlerTest.java
    - planningpoker-api/src/test/java/com/richashworth/planningpoker/service/SessionManagerTest.java
tech_stack:
  added: []
  patterns: [HostActionException as typed 403 signal, containsIgnoreCase for membership validation]
key_files:
  created:
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/HostActionException.java
    - planningpoker-api/src/test/java/com/richashworth/planningpoker/controller/ErrorHandlerTest.java
  modified:
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/ErrorHandler.java
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java
    - planningpoker-api/src/test/java/com/richashworth/planningpoker/service/SessionManagerTest.java
decisions:
  - HostActionException is a plain RuntimeException subclass — message set by caller per D-01
  - promoteHost uses full qualified CollectionUtils call (no static import needed, import already indirect via util package)
  - promoteHost validates membership before reassigning host, consistent with D-02 threat mitigation T-06-02
metrics:
  duration: "~15 minutes"
  completed_date: "2026-04-06"
  tasks_completed: 2
  files_modified: 5
---

# Phase 06 Plan 01: Host Action Infrastructure Summary

**One-liner:** Added `HostActionException` with HTTP 403 mapping in ErrorHandler, and `SessionManager.promoteHost()` with membership validation, tested via TDD.

## What Was Built

Two foundational building blocks for the Phase 6 kick/promote endpoints:

### Task 1: HostActionException + ErrorHandler 403 mapping

**`HostActionException.java`** (new):
- Simple `RuntimeException` subclass in the `controller` package
- Message set by callers (per D-01: "only the host can perform this action")

**`ErrorHandler.java`** (modified):
- New `@ExceptionHandler(HostActionException.class)` method: `handleForbidden`
- Returns `ResponseEntity` with `HttpStatus.FORBIDDEN` (403) and JSON `{"error": message}`
- Existing `handleBadRequest` for `IllegalArgumentException` → 400 unchanged

**`ErrorHandlerTest.java`** (new):
- `testHandleForbidden`: verifies 403 status and correct error body
- `testHandleBadRequestStillReturns400`: regression guard for existing 400 handler

### Task 2: SessionManager.promoteHost() with TDD

**`SessionManager.java`** (modified):
- New method: `public void promoteHost(String sessionId, String targetUser)`
- Validates target is a session member via `CollectionUtils.containsIgnoreCase`
- Throws `IllegalArgumentException("target user is not a member of this session")` if not a member
- Directly reassigns host via `sessionHosts.put(sessionId, targetUser)` — does NOT remove old host
- Calls `touchSession` to update last-activity timestamp

**`SessionManagerTest.java`** (modified):
- `testPromoteHost`: verifies host is reassigned and both users remain in session
- `testPromoteHostToNonMemberThrows`: verifies correct exception and message for non-member target
- `testPromoteHostPreservesAllUsers`: verifies all three users remain after promotion

## Deviations from Plan

None — plan executed exactly as written.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. Both HostActionException and promoteHost are internal backend components. Consistent with the plan's threat model which found no new trust boundaries.

## Self-Check

### Files created/modified exist:
- [x] `planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/HostActionException.java`
- [x] `planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/ErrorHandler.java`
- [x] `planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java`
- [x] `planningpoker-api/src/test/java/com/richashworth/planningpoker/controller/ErrorHandlerTest.java`
- [x] `planningpoker-api/src/test/java/com/richashworth/planningpoker/service/SessionManagerTest.java`

### Commits exist:
- [x] `672720a`: feat(06-01): add HostActionException and 403 handler to ErrorHandler
- [x] `3e736b4`: feat(06-01): add promoteHost() to SessionManager with membership validation

## Self-Check: PASSED
