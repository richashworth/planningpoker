---
phase: 01-backend-foundation
plan: 01
subsystem: api
tags: [java, spring-boot, estimation-schemes, session-management]

# Dependency graph
requires: []
provides:
  - SchemeType enum with FIBONACCI, TSHIRT, SIMPLE presets and resolveValues() factory
  - SchemeConfig record for scheme metadata transport
  - SessionManager extended with per-session scheme storage (sessionLegalValues, sessionSchemeConfigs)
  - Session eviction (clearSessions, evictIdleSessions) cleans up scheme maps
  - Backward-compatible no-arg createSession() defaults to Fibonacci with both meta-cards on
affects:
  - 02-api-contract
  - Any phase touching VoteController or GameController (vote validation)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Java enum with factory method resolveValues() for scheme-to-values resolution"
    - "Java record for immutable config transport (SchemeConfig)"
    - "ConcurrentHashMap fields in SessionManager for per-session keyed state"
    - "Defensive copy pattern: List.copyOf() for accessor return values"
    - "TDD: RED (failing test) -> GREEN (implementation) per task"

key-files:
  created:
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/model/SchemeType.java
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/model/SchemeConfig.java
    - planningpoker-api/src/test/java/com/richashworth/planningpoker/model/SchemeTypeTest.java
  modified:
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java
    - planningpoker-api/src/test/java/com/richashworth/planningpoker/service/SessionManagerTest.java

key-decisions:
  - "Scheme resolved to concrete value list at session creation time and stored in SessionManager (single source of truth for vote validation)"
  - "No-arg createSession() delegates to createSession(SchemeConfig) with Fibonacci defaults, preserving backward compatibility"
  - "Custom values deduplication handled in parseAndValidateCustom() before storage"

patterns-established:
  - "resolveValues(schemeType, customValuesCsv, includeUnsure, includeCoffee) is the canonical entry point for computing legal vote values"
  - "getSessionLegalValues() returns defensive copy; returns empty list for unknown sessions (not null)"
  - "getSessionSchemeConfig() returns null for unknown sessions"

requirements-completed: [API-04, API-05]

# Metrics
duration: 3min
completed: 2026-04-04
---

# Phase 01 Plan 01: Backend Foundation Summary

**SchemeType enum and SchemeConfig record added; SessionManager extended with per-session scheme storage, retrieval, and cleanup via two new ConcurrentHashMap fields**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-04T15:05:51Z
- **Completed:** 2026-04-04T15:08:24Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- SchemeType enum resolves FIBONACCI (12 values), TSHIRT (6 values), SIMPLE (5 values) presets to exact value lists; resolveValues() appends ? and Coffee when toggles are true
- SchemeConfig record provides immutable transport for scheme configuration (schemeType, customValues, includeUnsure, includeCoffee)
- SessionManager stores SchemeConfig and resolved legal values per session; both eviction paths clean up scheme maps with no orphans
- Existing no-arg createSession() preserved and defaults to Fibonacci with both meta-cards on
- 24 new test assertions: 17 in SchemeTypeTest, 7 in SessionManagerTest

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SchemeType enum and SchemeConfig record with tests** - `6632c18` (feat)
2. **Task 2: Extend SessionManager with per-session scheme storage and cleanup** - `fbd8b47` (feat)

_Note: TDD tasks - tests written first (RED), then implementation (GREEN)_

## Files Created/Modified
- `planningpoker-api/src/main/java/com/richashworth/planningpoker/model/SchemeType.java` - Enum with FIBONACCI/TSHIRT/SIMPLE presets, resolveValues() factory, custom value validation
- `planningpoker-api/src/main/java/com/richashworth/planningpoker/model/SchemeConfig.java` - Immutable record for scheme metadata transport
- `planningpoker-api/src/test/java/com/richashworth/planningpoker/model/SchemeTypeTest.java` - 17 tests covering all resolution and validation paths
- `planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java` - Extended with sessionLegalValues, sessionSchemeConfigs maps, new createSession(SchemeConfig) overload, accessors, and eviction cleanup
- `planningpoker-api/src/test/java/com/richashworth/planningpoker/service/SessionManagerTest.java` - 7 new tests for scheme storage, retrieval, defensive copies, and cleanup

## Decisions Made
- Used Java record for SchemeConfig (immutable, no boilerplate, Jackson-serializable natively)
- resolveValues() returns Collections.unmodifiableList for safety
- getSessionLegalValues() returns empty list (not null) for unknown sessions to ease null-check burden on callers

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - implementation files (SchemeType.java, SchemeConfig.java, SchemeTypeTest.java) were already present in the worktree from prior work; confirmed they matched the plan spec exactly and proceeded directly to GREEN verification.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Backend model layer complete; Phase 2 (API contract) can now build createSession endpoint accepting SchemeConfig in request body
- SessionManager.getSessionLegalValues(sessionId) ready for vote validation in VoteController
- SessionManager.getSessionSchemeConfig(sessionId) ready for joinSession response enrichment

---
*Phase: 01-backend-foundation*
*Completed: 2026-04-04*

## Self-Check: PASSED

- SchemeType.java: FOUND
- SchemeConfig.java: FOUND
- SchemeTypeTest.java: FOUND
- 01-01-SUMMARY.md: FOUND
- Commit 6632c18: FOUND
- Commit fbd8b47: FOUND
