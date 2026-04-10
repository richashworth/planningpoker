---
phase: 13-backend-logging-hygiene
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - planningpoker-api/src/main/java/com/richashworth/planningpoker/util/LogSafeIds.java
  - planningpoker-api/src/test/java/com/richashworth/planningpoker/util/LogSafeIdsTest.java
  - planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java
  - planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/VoteController.java
  - planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java
  - planningpoker-api/src/main/java/com/richashworth/planningpoker/util/MessagingUtils.java
autonomous: true
requirements:
  - LOG-01
  - LOG-02
must_haves:
  truths:
    - "No logger statement at any level emits a raw session ID, username, or vote value"
    - "Hot-path logs in MessagingUtils and VoteController emit at DEBUG, not INFO"
    - "Lifecycle events (session create/destroy, host transfer, scheduled cleanup) remain at INFO"
    - "A log-safe helper produces deterministic, non-reversible short identifiers for correlation"
    - "All existing backend unit tests pass after the scrub"
  artifacts:
    - path: "planningpoker-api/src/main/java/com/richashworth/planningpoker/util/LogSafeIds.java"
      provides: "SHA-256 prefix helper for session/user log-safe correlation IDs"
      contains: "public static String hash"
    - path: "planningpoker-api/src/test/java/com/richashworth/planningpoker/util/LogSafeIdsTest.java"
      provides: "Unit tests asserting determinism, length, and null handling"
    - path: "planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java"
      provides: "Scrubbed lifecycle logs using LogSafeIds.hash(sessionId)"
    - path: "planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/VoteController.java"
      provides: "DEBUG-level vote dispatch log with no PII"
  key_links:
    - from: "GameController"
      to: "LogSafeIds.hash"
      via: "static import"
      pattern: "LogSafeIds\\.hash"
    - from: "VoteController"
      to: "logger.debug"
      via: "downgraded vote log"
      pattern: "logger\\.debug"
---

<objective>
Introduce a `LogSafeIds` helper and rewrite every logger call in `planningpoker-api/src/main/java` so that no raw session ID, username, or vote value ever reaches the logs, and hot-path noise is downgraded from INFO to DEBUG.

Purpose: LOG-01 and LOG-02 — privacy-preserving, operator-friendly logs with lifecycle-only INFO.
Output: New `LogSafeIds` utility with tests, plus scrubbed call sites in `GameController`, `VoteController`, `SessionManager`, `MessagingUtils`.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@CLAUDE.md
@planningpoker-api/src/main/java/com/richashworth/planningpoker/util/MessagingUtils.java
@planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java
@planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/VoteController.java
@planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java
@planningpoker-api/src/main/java/com/richashworth/planningpoker/util/CollectionUtils.java

<interfaces>
Existing logger usage (all to be rewritten):

GameController (SLF4J logger):
- L47 `logger.info("{} has joined session {}", userName, sessionId);`
- L65 `logger.info("{} has created session {}", request.userName(), sessionId);`
- L81 `logger.info("{} has left session {}", userName, sessionId);`
- L115 `logger.info("{} has kicked {} from session {}", userName, targetUser, sessionId);`
- L135 `logger.info("{} has promoted {} to host in session {}", userName, targetUser, sessionId);`
- L146 `logger.info("{} has reset session {}", userName, sessionId);`
- L168 `logger.info("{} has set label for session {}", userName, sessionId);`

VoteController:
- L43 `logger.info("{} has voted {} in session {}", userName, estimateValue, sessionId);`

SessionManager:
- L120 `logger.info("Clearing all sessions");`
- L176 `logger.info("Evicting idle session {}", sessionId);`
- L187 `logger.info("Evicted {} idle session(s)", toEvict.size());`

MessagingUtils: currently has NO logger field. Confirm and add only if a DEBUG log is introduced.

Clock.java L18: `logger.warn("Sleep interrupted during pause of {}ms", latency, e);` — no PII, leave as-is.
ErrorHandler.java L33: `logger.error("Unexpected error", e);` — no PII, leave as-is.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create LogSafeIds helper with unit tests</name>
  <files>
    planningpoker-api/src/main/java/com/richashworth/planningpoker/util/LogSafeIds.java,
    planningpoker-api/src/test/java/com/richashworth/planningpoker/util/LogSafeIdsTest.java
  </files>
  <read_first>
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/util/CollectionUtils.java (sibling util style)
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/util/Clock.java (sibling util style)
    - CLAUDE.md (Java naming conventions section)
  </read_first>
  <behavior>
    - `LogSafeIds.hash(null)` returns the literal string `"none"`.
    - `LogSafeIds.hash("")` returns the literal string `"none"`.
    - `LogSafeIds.hash("abc12345")` returns an 8-character lowercase hex string that is the first 8 chars of SHA-256("abc12345").
    - `LogSafeIds.hash("abc12345")` returns the same value across multiple invocations (determinism).
    - `LogSafeIds.hash("abc12345")` is NOT equal to `"abc12345"` (i.e. input is never echoed).
    - `LogSafeIds.hash("alice")` and `LogSafeIds.hash("bob")` produce different outputs (collision-resistance smoke test).
    - The class has no public mutable state; constructor is private; class is `final`.
  </behavior>
  <action>
    Create `planningpoker-api/src/main/java/com/richashworth/planningpoker/util/LogSafeIds.java` with exactly this structure:

    ```java
    package com.richashworth.planningpoker.util;

    import java.nio.charset.StandardCharsets;
    import java.security.MessageDigest;
    import java.security.NoSuchAlgorithmException;

    /**
     * Produces short, deterministic, non-reversible identifiers for log correlation.
     * Used instead of raw session IDs or usernames so logs carry no PII.
     */
    public final class LogSafeIds {

      private static final String EMPTY_MARKER = "none";
      private static final int HASH_PREFIX_CHARS = 8;

      private LogSafeIds() {}

      /**
       * Returns the first 8 hex chars of SHA-256(value), or "none" if value is null/empty.
       * Safe to log: non-reversible, stable across calls, short enough for grep-friendly correlation.
       */
      public static String hash(String value) {
        if (value == null || value.isEmpty()) {
          return EMPTY_MARKER;
        }
        try {
          MessageDigest md = MessageDigest.getInstance("SHA-256");
          byte[] digest = md.digest(value.getBytes(StandardCharsets.UTF_8));
          StringBuilder sb = new StringBuilder(HASH_PREFIX_CHARS);
          for (int i = 0; i < HASH_PREFIX_CHARS / 2; i++) {
            sb.append(String.format("%02x", digest[i]));
          }
          return sb.toString();
        } catch (NoSuchAlgorithmException e) {
          // SHA-256 is guaranteed by the JRE; this is unreachable.
          throw new IllegalStateException("SHA-256 not available", e);
        }
      }
    }
    ```

    Create `planningpoker-api/src/test/java/com/richashworth/planningpoker/util/LogSafeIdsTest.java` with JUnit 5 tests covering every behaviour listed above. Use `org.junit.jupiter.api.Test` and `org.junit.jupiter.api.Assertions.*`. Test method names use `test` prefix per project convention (e.g., `testHashReturnsNoneForNull`, `testHashIsDeterministic`, `testHashDoesNotEchoInput`, `testHashDiffersForDifferentInputs`, `testHashIsEightHexChars`).
  </action>
  <verify>
    <automated>./gradlew planningpoker-api:test --tests "com.richashworth.planningpoker.util.LogSafeIdsTest" --no-daemon</automated>
  </verify>
  <acceptance_criteria>
    - File `planningpoker-api/src/main/java/com/richashworth/planningpoker/util/LogSafeIds.java` exists.
    - `grep -c "private LogSafeIds()" planningpoker-api/src/main/java/com/richashworth/planningpoker/util/LogSafeIds.java` returns 1.
    - `grep -c "SHA-256" planningpoker-api/src/main/java/com/richashworth/planningpoker/util/LogSafeIds.java` returns at least 1.
    - `grep -c "@Test" planningpoker-api/src/test/java/com/richashworth/planningpoker/util/LogSafeIdsTest.java` returns at least 5.
    - `./gradlew planningpoker-api:test --tests "com.richashworth.planningpoker.util.LogSafeIdsTest"` exits 0.
  </acceptance_criteria>
  <done>LogSafeIds helper exists with private constructor and static `hash(String)` method; all new unit tests pass.</done>
</task>

<task type="auto">
  <name>Task 2: Scrub call sites and downgrade hot-path logs</name>
  <files>
    planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java,
    planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/VoteController.java,
    planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java
  </files>
  <read_first>
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/VoteController.java
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/util/LogSafeIds.java (from Task 1)
    - planningpoker-api/src/test/java/com/richashworth/planningpoker/controller/GameControllerTest.java
    - planningpoker-api/src/test/java/com/richashworth/planningpoker/controller/VoteControllerTest.java
  </read_first>
  <action>
    Rewrite every logger statement listed below. Add `import com.richashworth.planningpoker.util.LogSafeIds;` wherever `LogSafeIds.hash(...)` is used.

    **GameController.java** — lifecycle events STAY at INFO, but all user-supplied strings pass through `LogSafeIds.hash(...)`. Replace the eight `logger.info` lines with exactly:

    - L47 → `logger.info("user {} joined session {}", LogSafeIds.hash(userName), LogSafeIds.hash(sessionId));`
    - L65 → `logger.info("user {} created session {}", LogSafeIds.hash(request.userName()), LogSafeIds.hash(sessionId));`
    - L81 → `logger.info("user {} left session {}", LogSafeIds.hash(userName), LogSafeIds.hash(sessionId));`
    - L115 → `logger.info("host {} kicked user {} from session {}", LogSafeIds.hash(userName), LogSafeIds.hash(targetUser), LogSafeIds.hash(sessionId));`
    - L135 → `logger.info("host {} promoted user {} in session {}", LogSafeIds.hash(userName), LogSafeIds.hash(targetUser), LogSafeIds.hash(sessionId));`
    - L146 → `logger.info("host {} reset session {}", LogSafeIds.hash(userName), LogSafeIds.hash(sessionId));`
    - L168 → DOWNGRADE to DEBUG (label changes are per-interaction noise once the frontend debounces; keep correlation via hashes): `logger.debug("host {} set label in session {}", LogSafeIds.hash(userName), LogSafeIds.hash(sessionId));`

    Do NOT log the raw label text, the username, or the session ID in any of the above.

    **VoteController.java** — L43: replace with DEBUG and scrubbed IDs. Vote value is PII per LOG-02, so do NOT log it:

    ```java
    logger.debug("user {} voted in session {} (estimate hash {})",
        LogSafeIds.hash(userName),
        LogSafeIds.hash(sessionId),
        LogSafeIds.hash(estimateValue));
    ```

    Add `import com.richashworth.planningpoker.util.LogSafeIds;` near the other imports.

    **SessionManager.java** — lifecycle events stay at INFO but scrub session IDs:

    - L120 → `logger.info("Clearing all sessions (count={})", activeSessions.size());` (this emits a count, no IDs)
    - L176 → `logger.info("Evicting idle session {}", LogSafeIds.hash(sessionId));`
    - L187 → leave as-is (already a count, no PII): `logger.info("Evicted {} idle session(s)", toEvict.size());`

    Add `import com.richashworth.planningpoker.util.LogSafeIds;` to SessionManager imports.

    **Do NOT modify** `Clock.java`, `ErrorHandler.java`, or `MessagingUtils.java` in this task — Clock and ErrorHandler have no PII; MessagingUtils currently has no logger at all (confirmed by `grep -n logger planningpoker-api/src/main/java/com/richashworth/planningpoker/util/MessagingUtils.java`) and this plan does not add one.

    After editing, run all existing unit tests to confirm no test asserted on the old log message text. If any test breaks solely because of log message assertions, update that test to assert the new scrubbed message shape (but do NOT re-introduce PII).
  </action>
  <verify>
    <automated>./gradlew planningpoker-api:test --no-daemon</automated>
  </verify>
  <acceptance_criteria>
    - `grep -nE "logger\.(info|warn|error).*\b(sessionId|userName|estimateValue|targetUser)\b" planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/VoteController.java planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java` returns 0 matches (only `logger.debug` may reference these variables, and only via `LogSafeIds.hash(...)`).
    - `grep -nE "logger\.(info|debug).*\b(sessionId|userName|estimateValue|targetUser|request\.userName\(\))\b" planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java` shows EVERY match wrapped in `LogSafeIds.hash(...)`.
    - `grep -c "logger.info" planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/VoteController.java` returns 0.
    - `grep -c "logger.debug" planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/VoteController.java` returns 1.
    - `grep -c "LogSafeIds" planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java` returns at least 8 (one import + 7 call sites).
    - `grep -c "LogSafeIds" planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java` returns at least 2.
    - `./gradlew planningpoker-api:test --no-daemon` exits 0.
    - Manual grep inspection of `GameController.java` L168 (old setLabel log) confirms it uses `logger.debug` (not `logger.info`) and does not contain the raw `label` variable.
  </acceptance_criteria>
  <done>
    Every PII-carrying log statement now uses `LogSafeIds.hash(...)`; hot-path setLabel and vote logs are at DEBUG; lifecycle logs (join/create/leave/kick/promote/reset/clear/evict) remain at INFO with hashed identifiers only; full backend test suite passes.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| HTTP client → REST controller | Untrusted usernames, session IDs, and vote values arrive as request params |
| Application → Logback → stdout → Railway | Log output leaves the JVM and is persisted by the platform operator |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-13-01 | Information Disclosure | GameController / VoteController / SessionManager log lines | mitigate | Every logger call that previously referenced `sessionId`, `userName`, `targetUser`, or `estimateValue` now wraps the value in `LogSafeIds.hash(...)` which emits an 8-char SHA-256 prefix. Raw values never reach the log appender. |
| T-13-02 | Information Disclosure | `setLabel` free-text label argument | mitigate | The label log is downgraded to DEBUG AND does not include the label string at all — only hashed user/session identifiers. |
| T-13-03 | Information Disclosure | `vote` estimate value in VoteController | mitigate | Estimate value is logged only as `LogSafeIds.hash(estimateValue)` at DEBUG level; the raw card value never reaches logs. |
| T-13-04 | Tampering | LogSafeIds helper reversibility | accept | SHA-256 on an 8-char session ID is theoretically brute-forceable offline, but session IDs are ephemeral (evicted after 24h idle) and contain no user data. Accept residual risk; document via comment on the helper. |
| T-13-05 | Repudiation | Inability to correlate user actions across lifecycle events | mitigate | Hashing is deterministic, so the same user/session produces the same hash across all log lines within an eviction window — correlation is preserved for operators. |
</threat_model>

<verification>
1. `./gradlew planningpoker-api:test --no-daemon` passes.
2. `grep -rnE "logger\.(info|warn|error).*(sessionId|userName|estimateValue|targetUser|\.userName\(\))" planningpoker-api/src/main/java/com/richashworth/planningpoker/ | grep -v LogSafeIds` returns zero lines.
3. `grep -rn "logger.info" planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/VoteController.java` returns zero lines (vote log downgraded).
4. Visual inspection of `GameController.java` `setLabel` confirms DEBUG + no raw label text.
</verification>

<success_criteria>
- LogSafeIds helper and its unit tests exist and pass.
- All nine flagged logger statements are rewritten per the action spec.
- `./gradlew planningpoker-api:test` passes.
- Grep checks in acceptance_criteria all return the expected counts.
- LOG-01 and LOG-02 requirements are fully satisfied at code level (LOG-03 is handled in plan 02).
</success_criteria>

<output>
After completion, create `.planning/phases/13-backend-logging-hygiene/13-01-SUMMARY.md`
</output>
