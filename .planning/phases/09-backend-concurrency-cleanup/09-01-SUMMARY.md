---
phase: 09-backend-concurrency-cleanup
plan: "01"
subsystem: backend
tags: [concurrency, thread-safety, session-manager, testing]
dependency_graph:
  requires: []
  provides: [thread-safe-session-creation, thread-safe-user-removal, concurrency-tests]
  affects: [SessionManager, GameController]
tech_stack:
  added: []
  patterns: [synchronized-method, tdd-concurrent-test, executor-service-stress-test]
key_files:
  created: []
  modified:
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java
    - planningpoker-api/src/test/java/com/richashworth/planningpoker/service/SessionManagerTest.java
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java
decisions:
  - "Synchronized on method signature rather than body blocks — Java synchronized methods use the instance monitor, matching existing synchronized(sessionManager) blocks in controllers (reentrant, no deadlock)"
  - "Kept existing synchronized(sessionManager) blocks in GameController — they protect multi-step sequences spanning multiple SessionManager calls and remain correct with reentrant locking"
metrics:
  duration: "~25 minutes"
  completed: "2026-04-09T20:54:22Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
requirements: [CONC-01, CONC-02, CLN-02]
---

# Phase 9 Plan 01: Backend Concurrency Cleanup — SessionManager Thread Safety Summary

**One-liner:** Internally synchronized createSession/removeUser with 50-thread concurrency stress tests proving TOCTOU race elimination in SessionManager.

## What Was Built

Made `SessionManager` thread-safe by internalizing the locking contract for `createSession` and `removeUser`. Previously, these methods carried Javadoc comments requiring callers to hold the lock (`synchronized(sessionManager)` in controllers). Now the methods enforce atomicity themselves via `synchronized` on the method signature.

Key changes:
- `createSession()` and `createSession(SchemeConfig)` — both now `synchronized`; the no-arg overload delegates to the SchemeConfig overload (reentrant, works correctly)
- `removeUser()` — now `synchronized`; the compound check-remove-promote-sequence is atomic without caller coordination
- Removed `@GuardedBy` Javadoc comments from both methods
- `clearSessions()` and `evictIdleSessions()` — already `synchronized`, no change needed
- No `getSessions()` method exists (CLN-02 verified)

Two new concurrency stress tests added:
- `testConcurrentCreateSession` — 50 threads create sessions simultaneously; asserts 50 unique IDs
- `testEvictionAtomicity` — eviction thread runs concurrently with 20 reader threads; asserts no partial-eviction state (active=true but users=empty) is ever visible

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking Bug] Duplicate setLabel method in GameController**
- **Found during:** Task 1 (compilation failure)
- **Issue:** `GameController.java` had two identical `setLabel` methods — a duplicate introduced by a squash merge from the Phase 8 branch. This caused a compilation error blocking all tests.
- **Fix:** Removed the second `@PostMapping("setLabel")` method (identical to the first). The fix matches commit `cf68e4b` that was present in the main branch but absent in the worktree's base commit.
- **Files modified:** `planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java`
- **Commit:** `47a4180`

## Verification Results

```
grep -c "synchronized" SessionManager.java → 8 (createSession x2, clearSessions, evictIdleSessions, removeUser, plus synchronized-set operations in body)
grep "public synchronized" SessionManager.java → 5 methods
grep "getSessions" SessionManager.java → no matches
All 35 SessionManagerTest tests pass
All backend tests pass (BUILD SUCCESSFUL)
```

## Threat Coverage

| Threat ID | Status | Evidence |
|-----------|--------|----------|
| T-09-01 | Mitigated | createSession is `synchronized`; contains+add is atomic within one monitor acquisition |
| T-09-02 | Verified | evictIdleSessions was already `synchronized`; testEvictionAtomicity confirms no partial state |
| T-09-03 | Mitigated | Atomic eviction prevents stale session data from partially-cleaned maps |

## Known Stubs

None.

## Self-Check: PASSED

- SessionManager.java exists and contains `public synchronized String createSession`
- SessionManagerTest.java contains `testConcurrentCreateSession` and `testEvictionAtomicity`
- Commit `47a4180` exists
- All backend tests BUILD SUCCESSFUL
