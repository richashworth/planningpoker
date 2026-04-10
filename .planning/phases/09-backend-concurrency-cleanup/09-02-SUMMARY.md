---
phase: 09-backend-concurrency-cleanup
plan: "02"
subsystem: backend
tags: [concurrency, messaging, websocket, tdd]
dependency_graph:
  requires: []
  provides: [snapshot-based-burst-messaging]
  affects: [MessagingUtils, WebSocket delivery]
tech_stack:
  added: []
  patterns: [snapshot-before-loop, TDD red-green]
key_files:
  created: []
  modified:
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/util/MessagingUtils.java
    - planningpoker-api/src/test/java/com/richashworth/planningpoker/util/MessagingUtilsTest.java
decisions:
  - "Snapshot captured into a pre-built Message object before the loop — single object reference sent in all iterations, immune to post-read mutations"
  - "sendResultsMessage and sendUsersMessage intentionally left unchanged — single-send for refresh endpoint correctly reads live state"
metrics:
  duration_minutes: 15
  completed_date: "2026-04-09"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 2
requirements: [CONC-03]
---

# Phase 09 Plan 02: Snapshot-Based Burst Messaging Summary

**One-liner:** Burst messaging now captures a single state snapshot before the loop, preventing concurrent mutations from causing different iterations to send inconsistent data.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (RED) | Failing tests for snapshot burst messaging | 4cbb44e | MessagingUtilsTest.java |
| 1 (GREEN) | Snapshot-based burst messaging implementation | 7a1807d | MessagingUtils.java |

## What Was Built

### MessagingUtils.java

`burstResultsMessages` and `burstUsersMessages` were refactored from calling `sendResultsMessage`/`sendUsersMessage` in a loop (which re-read live state each iteration) to:

1. Read `getResults` + `getLabel` (or `getSessionUsers` + `getHost`) **once** before the loop
2. Build the `Message` object once
3. Send that same object reference in every burst iteration

This eliminates the TOCTOU window where another thread could mutate session state between burst iterations separated by delays up to 5 seconds.

### MessagingUtilsTest.java

Four tests updated or added:
- `testBurstResultsMessages`: now verifies `getResults` and `getLabel` called `times(1)`, not `LATENCIES.length` times
- `testBurstUsersMessages`: now verifies `getSessionUsers` and `getHost` called `times(1)`
- `testBurstResultsMessagesSendsConsistentSnapshot`: mocks `getResults` to return different values on successive calls; asserts all burst sends use only the first snapshot
- `testBurstUsersMessagesSendsConsistentSnapshot`: same pattern for users

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree needed its own Gradle build rather than main repo**

- **Found during:** Task 1 RED phase
- **Issue:** Plan's verification command pointed to `/Users/richard/Projects/planningpoker` which had a pre-existing duplicate `setLabel` compile error from the main branch. Worktree has clean source.
- **Fix:** Ran Gradle from the worktree directory `/Users/richard/Projects/planningpoker/.claude/worktrees/agent-a8d4b2f8` where the compile error doesn't exist.
- **Files modified:** None — configuration discovery only

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced. This change is internal to the burst messaging loop.

## Self-Check: PASSED

- [x] MessagingUtils.java modified — confirmed
- [x] MessagingUtilsTest.java modified — confirmed
- [x] Commit 4cbb44e exists (RED tests)
- [x] Commit 7a1807d exists (GREEN implementation)
- [x] All 10 MessagingUtilsTest tests pass
- [x] `burstResultsMessages` does not call `sendResultsMessage`
- [x] `burstUsersMessages` does not call `sendUsersMessage`
- [x] `getResults` called before for loop (not inside it)
- [x] `getSessionUsers` called before for loop (not inside it)
- [x] `testBurstResultsMessagesSendsConsistentSnapshot` exists and passes
- [x] `testBurstUsersMessagesSendsConsistentSnapshot` exists and passes
