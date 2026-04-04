---
phase: 01-backend-foundation
verified: 2026-04-04T16:12:00Z
status: passed
score: 6/6 must-haves verified
re_verification: false
---

# Phase 01: Backend Foundation Verification Report

**Phase Goal:** The server has a canonical scheme model and per-session scheme storage that the API layer can depend on
**Verified:** 2026-04-04T16:12:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                                         | Status     | Evidence                                                                                                                                  |
|----|---------------------------------------------------------------------------------------------------------------|------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| 1  | SchemeType enum resolves Fibonacci, T-shirt, Simple presets to their exact value lists                        | ✓ VERIFIED | `SchemeType.java` lines 10-12: FIBONACCI (12 values), TSHIRT (6 values), SIMPLE (5 values). SchemeTypeTest 17/17 pass.                    |
| 2  | SchemeType.resolveValues() appends ? and Coffee symbols when toggles are true                                  | ✓ VERIFIED | `SchemeType.java` lines 47-52: `if (includeUnsure) result.add(UNSURE); if (includeCoffee) result.add(COFFEE)`. Tests confirm both paths.  |
| 3  | Custom scheme values are validated for count (2-20), length (<=10), and uniqueness                            | ✓ VERIFIED | `parseAndValidateCustom()` lines 56-78: null/blank guard, distinct(), size bounds, per-value length check. 6 tests cover all error paths. |
| 4  | SessionManager stores and retrieves SchemeConfig per session ID                                               | ✓ VERIFIED | `SessionManager.java` lines 29-30, 40-60, 62-69: two ConcurrentHashMaps, createSession(SchemeConfig), getSessionLegalValues, getSessionSchemeConfig. |
| 5  | Session eviction (both clearSessions and evictIdleSessions) removes scheme entries with no orphans           | ✓ VERIFIED | `clearSessions()` lines 88-96 clears both maps; `evictIdleSessions()` lines 134-135 removes per-session. Tests `testClearSessionsCleansSchemeData` and `testEvictIdleSessionsCleansSchemeData` confirm. |
| 6  | Existing no-arg createSession still works and defaults to Fibonacci with both meta-cards on                  | ✓ VERIFIED | `createSession()` line 37 delegates to `createSession(new SchemeConfig("fibonacci", null, true, true))`. `testCreateSessionDefaultScheme` confirms legal values equal full Fibonacci+toggles list. |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact                                                                                               | Expected                                             | Status     | Details                                                                                                   |
|--------------------------------------------------------------------------------------------------------|------------------------------------------------------|------------|-----------------------------------------------------------------------------------------------------------|
| `planningpoker-api/src/main/java/com/richashworth/planningpoker/model/SchemeType.java`                 | Enum with FIBONACCI, TSHIRT, SIMPLE + resolveValues  | ✓ VERIFIED | 79 lines; contains `public enum SchemeType`, all three variants, `resolveValues`, `parseAndValidateCustom` |
| `planningpoker-api/src/main/java/com/richashworth/planningpoker/model/SchemeConfig.java`               | Immutable record for scheme metadata transport        | ✓ VERIFIED | 10 lines; contains `public record SchemeConfig(String schemeType, List<String> customValues, boolean includeUnsure, boolean includeCoffee)` |
| `planningpoker-api/src/test/java/com/richashworth/planningpoker/model/SchemeTypeTest.java`             | Unit tests covering all resolution and validation    | ✓ VERIFIED | 132 lines; 17 test methods; all pass (0 failures, 0 errors per test XML)                                   |
| `planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java`           | Per-session scheme storage, retrieval, and cleanup   | ✓ VERIFIED | Contains `sessionLegalValues` field, `sessionSchemeConfigs` field, `createSession(SchemeConfig)`, both accessor methods, both cleanup paths |
| `planningpoker-api/src/test/java/com/richashworth/planningpoker/service/SessionManagerTest.java`       | Tests for scheme storage and eviction cleanup        | ✓ VERIFIED | Contains `testCreateSessionWithScheme`, `testClearSessionsCleansSchemeData`, `testEvictIdleSessionsCleansSchemeData`; 19 total tests, 0 failures |

### Key Link Verification

| From                                        | To                                          | Via                                              | Status     | Details                                                                                                            |
|---------------------------------------------|---------------------------------------------|--------------------------------------------------|------------|--------------------------------------------------------------------------------------------------------------------|
| `SessionManager.createSession(SchemeConfig)` | `SchemeType.resolveValues()`                | Calls resolveValues to compute legal values      | ✓ WIRED    | `SessionManager.java` line 55: `SchemeType.resolveValues(config.schemeType(), csvValues, config.includeUnsure(), config.includeCoffee())` |
| `SessionManager.clearSessions()`             | `sessionLegalValues`, `sessionSchemeConfigs` | Clears both new maps alongside existing maps     | ✓ WIRED    | Lines 94-95: `sessionLegalValues.clear(); sessionSchemeConfigs.clear()` inside `synchronized clearSessions()`      |
| `SessionManager.evictIdleSessions()`         | `sessionLegalValues`, `sessionSchemeConfigs` | Removes entries for each evicted session ID      | ✓ WIRED    | Lines 134-135: `sessionLegalValues.remove(sessionId); sessionSchemeConfigs.remove(sessionId)` inside eviction loop |

### Data-Flow Trace (Level 4)

Not applicable — this phase delivers backend model and service classes only, no components that render dynamic data to a UI. The data flow is internal to the service layer (config in -> legal values stored -> retrieved on demand). Wiring is fully verified at Level 3.

### Behavioral Spot-Checks

Test suite provides equivalent coverage. All 17 SchemeTypeTest and 19 SessionManagerTest cases pass with 0 failures and 0 errors per the test result XML at `planningpoker-api/build/test-results/`.

| Behavior                                              | Command                                                                                    | Result               | Status  |
|-------------------------------------------------------|--------------------------------------------------------------------------------------------|----------------------|---------|
| All SchemeTypeTest assertions pass                     | `./gradlew planningpoker-api:test --rerun-tasks`                                           | BUILD SUCCESSFUL, 17 tests, 0 failures | ✓ PASS |
| All SessionManagerTest assertions pass                 | `./gradlew planningpoker-api:test --rerun-tasks`                                           | BUILD SUCCESSFUL, 19 tests, 0 failures | ✓ PASS |
| Full backend test suite (no regressions)               | `./gradlew planningpoker-api:test --rerun-tasks`                                           | BUILD SUCCESSFUL in 7s, all suites 0 failures | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description                                                          | Status      | Evidence                                                                                                              |
|-------------|-------------|----------------------------------------------------------------------|-------------|-----------------------------------------------------------------------------------------------------------------------|
| API-04      | 01-01-PLAN  | Scheme state is stored per-session in SessionManager                 | ✓ SATISFIED | `sessionLegalValues` and `sessionSchemeConfigs` ConcurrentHashMaps in SessionManager; `createSession(SchemeConfig)` populates both; `getSessionLegalValues` and `getSessionSchemeConfig` retrieve them. `testCreateSessionWithScheme` and `testCreateSessionDefaultScheme` confirm. |
| API-05      | 01-01-PLAN  | Scheme state is cleaned up when sessions are evicted/cleared         | ✓ SATISFIED | Both `clearSessions()` and `evictIdleSessions()` remove entries from both maps. `testClearSessionsCleansSchemeData` and `testEvictIdleSessionsCleansSchemeData` confirm no orphans remain. |

No orphaned requirements — REQUIREMENTS.md maps exactly API-04 and API-05 to Phase 1, and both are covered by 01-01-PLAN.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | -    | -       | -        | -      |

No TODO/FIXME/placeholder comments, no empty implementations, no stub return values, no hardcoded empty data structures in the modified files.

**Note on CUSTOM enum variant:** The ROADMAP success criterion states "A SchemeType enum exists with Fibonacci, T-shirt, Simple, and Custom variants". In the implementation, `CUSTOM` is intentionally not an enum constant — custom values are handled via string comparison in `resolveValues()`. This is a documented design choice captured in the plan (`testFromStringCustomThrows` verifies `fromString("custom")` throws). The functional requirement (hosts can use custom value sets) is fully implemented. The ROADMAP wording is imprecise but the behavior is correct and tested.

### Human Verification Required

None. This phase delivers only backend model and service classes with no UI or external service integration. All behaviors are fully verifiable through the automated test suite.

### Gaps Summary

No gaps. All six observable truths verified, all five artifacts substantive and wired, all three key links confirmed by direct source reading, both requirements satisfied with test evidence, full test suite passing with zero regressions.

Both commits exist in git history:
- `6632c18` — SchemeType enum and SchemeConfig record with tests (3 files, 221 insertions)
- `fbd8b47` — SessionManager extended with scheme storage and cleanup (2 files, 103 insertions)

---

_Verified: 2026-04-04T16:12:00Z_
_Verifier: Claude (gsd-verifier)_
