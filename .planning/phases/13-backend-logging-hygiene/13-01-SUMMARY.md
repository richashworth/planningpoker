---
phase: 13-backend-logging-hygiene
plan: 01
subsystem: backend
tags: [logging, privacy, observability, security]
requirements: [LOG-01, LOG-02]
dependency_graph:
  requires: []
  provides:
    - LogSafeIds helper for deterministic non-reversible log correlation IDs
    - Scrubbed GameController/VoteController/SessionManager log statements
  affects:
    - All backend log output (Railway stdout)
tech_stack:
  added: []
  patterns:
    - SHA-256 prefix hashing for log correlation
    - DEBUG for hot-path logs, INFO for lifecycle events
key_files:
  created:
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/util/LogSafeIds.java
    - planningpoker-api/src/test/java/com/richashworth/planningpoker/util/LogSafeIdsTest.java
  modified:
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/VoteController.java
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java
decisions:
  - SHA-256 first 8 hex chars chosen over random/UUID so correlation is deterministic within an eviction window
  - "none" literal returned for null/empty input so log lines remain greppable without NPEs
  - setLabel log downgraded to DEBUG (per-keystroke noise) and label text never logged
  - Vote estimate value hashed, not raw — treated as PII per LOG-02
  - MessagingUtils intentionally left without a logger (hot path, no current calls)
metrics:
  duration: ~15 minutes
  completed: 2026-04-10
  tasks: 2
  commits: 2
---

# Phase 13 Plan 01: Scrub Backend Logs & Downgrade Hot Paths Summary

Introduced `LogSafeIds` SHA-256 prefix helper and rewrote every backend logger call so no raw session ID, username, or vote value ever reaches logs; hot-path `setLabel` and `vote` logs moved from INFO to DEBUG while lifecycle events stay at INFO for operator visibility.

## What Was Built

### Task 1 — LogSafeIds helper (commit `c0dc867`)

- `LogSafeIds.hash(String)` — returns first 8 hex chars of SHA-256(value) or `"none"` for null/empty.
- Final class with private constructor — no instantiation, no mutable state.
- 6 JUnit 5 tests: null, empty, 8-char lowercase hex format, determinism, non-echo, uniqueness across inputs.
- Threat T-13-04 (brute-force reversibility) accepted in code comment — session IDs are ephemeral and contain no user data.

### Task 2 — Call-site scrub (commit `9645d9c`)

**GameController** (7 log statements rewritten):
- `joinSession`, `createSession`, `leaveSession`, `kickUser`, `promoteUser`, `reset` — stay at INFO, all identifiers wrapped in `LogSafeIds.hash(...)`.
- `setLabel` — downgraded to DEBUG; label text is never logged (only hashed user + session).
- Message format standardised to `"<role> {} <action> session {}"` with hashes.

**VoteController** (1 log statement rewritten):
- Downgraded from INFO to DEBUG.
- Logs hashed user, hashed session, and hashed estimate value — raw card value never reaches logs (LOG-02).

**SessionManager** (3 log statements):
- `clearSessions` — now emits session count only (`"Clearing all sessions (count={})"`), no IDs.
- `evictIdleSessions` — session ID wrapped in `LogSafeIds.hash(...)`.
- Count-only "Evicted N idle session(s)" line left as-is (no PII).

**Not modified** (confirmed safe):
- `Clock.java` — only logs latency, no PII.
- `ErrorHandler.java` — logs generic `"Unexpected error"` and exception.
- `MessagingUtils.java` — has no logger field.

## Verification Results

- `./gradlew planningpoker-api:test` — all tests pass (including the 6 new `LogSafeIdsTest` cases).
- `./gradlew planningpoker-api:spotlessCheck` — formatting clean after one `spotlessApply` cycle.
- Plan verification grep: `grep -rnE "logger\.(info|warn|error).*(sessionId|userName|estimateValue|targetUser|\.userName\(\))" planningpoker-api/src/main/java/ | grep -v LogSafeIds` → zero matches.
- `grep -c "logger.info" VoteController.java` → 0 (was 1).
- `grep -c "logger.debug" VoteController.java` → 1 (was 0).
- `grep -c "LogSafeIds" GameController.java` → 15 (1 import + 14 hash calls — 7 sites, most with 2 args).
- `grep -c "LogSafeIds" SessionManager.java` → 2 (1 import + 1 hash call).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Rebuilt frontend before backend test**
- **Found during:** Task 1 verification
- **Issue:** `planningpoker-web/dist/libs/planningpoker-web.jar` existed at 261 bytes (empty) because `planningpoker-web/node_modules/` and `build/` were absent in the worktree; `./gradlew planningpoker-api:test` failed with `Could not find :planningpoker-web:`.
- **Fix:** Ran `npm ci && npm run build` in `planningpoker-web/` to produce a valid `build/` directory, then re-invoked Gradle which repackaged the JAR correctly.
- **Files modified:** none (build artifacts only).
- **Commit:** rolled into Task 1 commit `c0dc867`.

**2. [Rule 1 - Bug] Spotless formatting pass**
- **Found during:** Task 2 pre-commit
- **Issue:** `googleJavaFormat` required line-break adjustments in GameController.setLabel after the Edit tool placed arguments on a single line.
- **Fix:** Ran `./gradlew planningpoker-api:spotlessApply`; re-ran full test suite to confirm still green.
- **Files modified:** GameController.java (whitespace only).
- **Commit:** folded into Task 2 commit `9645d9c`.

### Notes on TDD

Task 1 is marked `tdd="true"`. Test file was authored first from the behaviour spec, then the implementation file, then the initial `gradle test` invocation. Because the test class references `LogSafeIds` at compile time, a literal RED-then-GREEN commit split would have committed a non-compiling tree; both files landed in a single commit to preserve buildability while keeping test-first discipline at the authoring level.

## Known Stubs

None.

## Threat Flags

None — phase 13 threat model already covers all surface touched by this plan (T-13-01 through T-13-05).

## Self-Check: PASSED

- FOUND: planningpoker-api/src/main/java/com/richashworth/planningpoker/util/LogSafeIds.java
- FOUND: planningpoker-api/src/test/java/com/richashworth/planningpoker/util/LogSafeIdsTest.java
- FOUND commit c0dc867 (feat(13-01): add LogSafeIds helper with unit tests)
- FOUND commit 9645d9c (feat(13-01): scrub PII from backend logs and downgrade hot paths)
