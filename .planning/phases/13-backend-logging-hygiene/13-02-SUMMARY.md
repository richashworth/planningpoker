---
phase: 13-backend-logging-hygiene
plan: 02
subsystem: backend
tags: [logging, observability, configuration, security, regression-guard]
requirements: [LOG-03]
dependency_graph:
  requires:
    - 13-01 (LogSafeIds helper + scrubbed call sites)
  provides:
    - Deliberate production log levels honored by fat JAR
    - Env-var-driven runtime log-level overrides (LOG_LEVEL_ROOT, LOG_LEVEL_SPRING, LOG_LEVEL_APP, LOG_LEVEL_HOTPATH)
    - LoggingHygieneTest regression guard against raw PII re-entering logs
  affects:
    - Railway runtime log volume (INFO lifecycle only by default)
    - CI unit-tests job (new test wired into default test task)
tech_stack:
  added: []
  patterns:
    - Spring Boot property placeholder with default `${ENV_VAR:default}` for runtime overrides
    - Source-tree regex scan as JUnit 5 regression guard
key_files:
  created:
    - planningpoker-api/src/test/java/com/richashworth/planningpoker/logging/LoggingHygieneTest.java
  modified:
    - planningpoker-api/src/main/resources/application.properties
decisions:
  - Hot-path classes (VoteController, MessagingUtils) default to WARN, not DEBUG, so even a misconfigured operator cannot flood stdout with per-interaction noise
  - Single shared env var (LOG_LEVEL_HOTPATH) controls both hot-path loggers so operators flip them together for incident debugging
  - Regression guard implemented as a source-file scan rather than an AspectJ runtime interceptor — deterministic, zero dependency, runs in the existing unit-test task
  - Multi-line logger calls joined by depth-tracking parenthesis walk rather than single-line regex, so split-arg style (common in GameController) is not a blind spot
  - logger.debug exempted from the guard so hashed-identifier debug output remains available for hot-path troubleshooting
metrics:
  duration: ~12 minutes
  completed: 2026-04-10
  tasks: 2
  commits: 2
---

# Phase 13 Plan 02: Production Log Levels & Regression Guard Summary

Locked production log levels to INFO (application) and WARN (hot paths) in `application.properties` with env-var overrides, and added `LoggingHygieneTest` — a source-scanning JUnit 5 regression guard that fails loudly if any contributor reintroduces raw session IDs, usernames, target users, or vote values into `logger.info/warn/error` calls.

## What Was Built

### Task 1 — application.properties log levels (commit `a74677c`)

Replaced the old 2-line logging block with 5 deliberate `logging.level.*` keys, each backed by an env-var placeholder:

```properties
logging.level.root=${LOG_LEVEL_ROOT:INFO}
logging.level.org.springframework=${LOG_LEVEL_SPRING:INFO}
logging.level.com.richashworth.planningpoker=${LOG_LEVEL_APP:INFO}
logging.level.com.richashworth.planningpoker.util.MessagingUtils=${LOG_LEVEL_HOTPATH:WARN}
logging.level.com.richashworth.planningpoker.controller.VoteController=${LOG_LEVEL_HOTPATH:WARN}
```

- Removed the old `logging.level.com.richashworth.planningpoker=DEBUG` default (T-13-06 mitigation — DEBUG could have leaked verbose traces into Railway stdout on a fresh deploy).
- Hot-path loggers default to WARN so vote dispatch and burst messaging never emit per-interaction log lines unless an operator explicitly flips `LOG_LEVEL_HOTPATH=DEBUG` for debugging.
- All other properties in the file (server.port, banner-mode, websocket sizes, actuator, error stacktrace, CORS) preserved verbatim.

**Packaging verification (T-13-07):** Built the fat JAR via the documented separate-invocation chain (`planningpoker-web:jar` → `planningpoker-api:bootJar`) and confirmed the packaged `BOOT-INF/classes/application.properties` contains all five new keys via `unzip -p`.

### Task 2 — LoggingHygieneTest (commit `6751edf`)

New test class `planningpoker-api/src/test/java/com/richashworth/planningpoker/logging/LoggingHygieneTest.java`:

- Walks `src/main/java/com/richashworth/planningpoker`, reads every `.java` file.
- For each `logger.(info|warn|error)(` match, walks forward through the source characters counting `(`/`)` depth until the matching close-paren — so multi-line logger calls (common in `GameController`) are fully captured.
- Strips every `LogSafeIds.hash(...)` wrapped expression from the joined argument buffer, then fails if any of `sessionId`, `userName`, `targetUser`, `estimateValue` appears as a bare identifier.
- `logger.debug` is exempt (VoteController's hashed-identifier debug line and GameController.setLabel's DEBUG log remain valid).
- Failure message lists each offending `file:line -> source-line` so a future contributor sees the exact violation in the CI log.

**Meta-verification:** Temporarily dropped a `TestViolation.java` containing both a single-line `logger.info("session {}", sessionId)` and a multi-line `logger.info(\n "user {} joined {}", userName, LogSafeIds.hash(sessionId))`. The test failed with both violations reported at the correct line numbers, confirming the scanner catches both the trivial and the split-across-lines regression modes. File was removed before commit.

## Verification Results

- `grep -c "logging.level.root" planningpoker-api/src/main/resources/application.properties` → 1
- `grep -c "logging.level.com.richashworth.planningpoker=" planningpoker-api/src/main/resources/application.properties` → 1
- `grep -c "logging.level.com.richashworth.planningpoker.util.MessagingUtils" planningpoker-api/src/main/resources/application.properties` → 1
- `grep -c "logging.level.com.richashworth.planningpoker.controller.VoteController" planningpoker-api/src/main/resources/application.properties` → 1
- `grep -c "LOG_LEVEL_HOTPATH:WARN" planningpoker-api/src/main/resources/application.properties` → 2
- `grep -c "LOG_LEVEL_APP:INFO" planningpoker-api/src/main/resources/application.properties` → 1
- `grep -c "logging.level.com.richashworth.planningpoker=DEBUG" planningpoker-api/src/main/resources/application.properties` → 0 (old default removed)
- `unzip -p planningpoker-api/build/libs/planningpoker-api-*.jar BOOT-INF/classes/application.properties | grep -c LOG_LEVEL_HOTPATH` → 2
- `grep -c "LogSafeIds\\.hash" LoggingHygieneTest.java` → 2 (comment + replaceAll call)
- `grep -c "sessionId" LoggingHygieneTest.java` → 2 (forbidden list + comment)
- `./gradlew planningpoker-api:test` — all tests pass (including LoggingHygieneTest); MessagingUtilsTest, GameControllerTest, VoteControllerTest, SessionManagerTest, etc. all green.
- `./gradlew planningpoker-api:spotlessCheck` — clean after one `spotlessApply` cycle on LoggingHygieneTest.
- `./gradlew planningpoker-api:test --tests "com.richashworth.planningpoker.logging.LoggingHygieneTest"` — exit 0.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test scanner upgraded to handle multi-line logger calls**
- **Found during:** Task 2 authoring, reading GameController.java
- **Issue:** The plan's prescribed regex `logger\.(info|warn|error)\s*\((.*)\);` requires the whole call on a single line ending in `);`. GameController has 5 multi-line `logger.info(` calls (joinSession, createSession, kickUser, promoteUser, reset) which the single-line regex would skip entirely — a silent blind spot in the regression guard.
- **Fix:** Replaced single-line regex with a start-pattern (`logger.(info|warn|error)\s*\(`) plus a paren-depth walker that joins source characters across lines until the matching close-paren. Behaviour on single-line calls is identical to the original spec; multi-line calls are now scanned end-to-end.
- **Meta-verified:** Injected a temporary `TestViolation.java` with both single-line and multi-line raw-PII `logger.info` calls; the test failed with both violations reported. File removed before commit.
- **Files modified:** LoggingHygieneTest.java only (plan's prescribed file).
- **Commit:** folded into Task 2 commit `6751edf`.

**2. [Rule 3 - Blocking] Frontend rebuild before bootJar packaging verification**
- **Found during:** Task 1 fat-JAR verification
- **Issue:** Worktree lacked `planningpoker-web/node_modules/` and `build/`, so the flatDir dependency `planningpoker-web.jar` was either stale or missing, blocking the `unzip -p` acceptance check on the packaged properties file.
- **Fix:** Ran `npm ci && npm run build` in `planningpoker-web/`, then `planningpoker-web:jar` and `planningpoker-api:bootJar` as separate Gradle invocations per CLAUDE.md. `unzip -p` then listed all five logging keys from the packaged properties.
- **Files modified:** none (build artifacts only).
- **Commit:** no commit needed; verification only.

**3. [Rule 1 - Bug] Spotless formatting pass on LoggingHygieneTest**
- **Found during:** Post-Task-2 `spotlessCheck`
- **Issue:** googleJavaFormat wanted `LOGGER_START` field on one line rather than the split the Write tool produced.
- **Fix:** `./gradlew planningpoker-api:spotlessApply` then re-ran full test suite to confirm still green.
- **Files modified:** LoggingHygieneTest.java (whitespace only).
- **Commit:** rolled into Task 2 commit `6751edf` (staged after spotlessApply).

### Notes on TDD

Task 2 is marked `tdd="true"`. The plan describes this as "test passes against the already-scrubbed codebase from plan 01" — i.e. the invariant was first captured in a test against source that already satisfies it. Red-green split was not meaningful here (there is no production code to write; the test guards existing production code). The meta-verification with `TestViolation.java` served as an explicit RED check that the scanner catches real violations, followed by removing the fake file to return to GREEN.

## Known Stubs

None.

## Threat Flags

None — phase 13 threat model already covers all surface touched by this plan (T-13-06, T-13-07, T-13-08, T-13-09 are the threats this plan explicitly mitigates or accepts).

## Self-Check: PASSED

- FOUND: planningpoker-api/src/main/resources/application.properties (modified)
- FOUND: planningpoker-api/src/test/java/com/richashworth/planningpoker/logging/LoggingHygieneTest.java
- FOUND commit a74677c (feat(13-02): configure production log levels with env-var overrides)
- FOUND commit 6751edf (test(13-02): add LoggingHygieneTest guarding against raw PII in logs)
- VERIFIED: fat JAR packaged with all 5 new `logging.level.*` keys (unzip -p check)
- VERIFIED: full `./gradlew planningpoker-api:test` exit 0
- VERIFIED: LoggingHygieneTest catches both single-line and multi-line raw-PII regressions (meta-check with temporary TestViolation.java)
