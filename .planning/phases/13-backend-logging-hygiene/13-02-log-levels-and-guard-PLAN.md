---
phase: 13-backend-logging-hygiene
plan: 02
type: execute
wave: 2
depends_on:
  - 13-01
files_modified:
  - planningpoker-api/src/main/resources/application.properties
  - planningpoker-api/src/test/java/com/richashworth/planningpoker/logging/LoggingHygieneTest.java
autonomous: true
requirements:
  - LOG-03
must_haves:
  truths:
    - "application.properties sets explicit production log levels that are honored in the fat JAR"
    - "Hot-path classes (VoteController, MessagingUtils) default to WARN in production but are env-var-overridable"
    - "A regression test fails if any source file under src/main/java introduces `logger.info/warn/error` with a raw sessionId, userName, or estimateValue variable"
    - "All backend unit tests still pass"
  artifacts:
    - path: "planningpoker-api/src/main/resources/application.properties"
      provides: "Deliberate production log levels with env-var overrides"
      contains: "logging.level.com.richashworth.planningpoker"
    - path: "planningpoker-api/src/test/java/com/richashworth/planningpoker/logging/LoggingHygieneTest.java"
      provides: "Grep-based regression guard against reintroducing PII in logs"
  key_links:
    - from: "application.properties"
      to: "Spring Boot Logback binding"
      via: "logging.level.* keys"
      pattern: "logging\\.level\\."
    - from: "LoggingHygieneTest"
      to: "source tree scan"
      via: "Files.walk + regex"
      pattern: "Files\\.walk"
---

<objective>
Set deliberate production log levels in `application.properties` with environment-variable overrides, and add a grep-based regression test that prevents future contributors from reintroducing raw session IDs, usernames, or vote values into INFO/WARN/ERROR log statements.

Purpose: LOG-03 — operator-configurable log verbosity honored in the fat JAR, with a durable guard against regression.
Output: Updated `application.properties` + new `LoggingHygieneTest`.
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
@planningpoker-api/src/main/resources/application.properties
@.planning/phases/13-backend-logging-hygiene/13-01-scrub-and-downgrade-PLAN.md

<interfaces>
Current application.properties logging section (lines 12-14):
```
logging.level.org.springframework=INFO
logging.level.com.richashworth.planningpoker=DEBUG
```

Spring Boot honors `logging.level.{logger}` keys and supports property placeholders with defaults:
`logging.level.foo=${LOG_LEVEL_FOO:INFO}` — reads env var `LOG_LEVEL_FOO`, defaults to `INFO`.

Package layout for hot-path classes:
- `com.richashworth.planningpoker.controller.VoteController`
- `com.richashworth.planningpoker.util.MessagingUtils`
- `com.richashworth.planningpoker.controller.GameController` (mostly lifecycle at INFO, setLabel at DEBUG)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Configure production log levels with env-var overrides</name>
  <files>planningpoker-api/src/main/resources/application.properties</files>
  <read_first>
    - planningpoker-api/src/main/resources/application.properties
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/util/MessagingUtils.java
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/VoteController.java
  </read_first>
  <action>
    Replace lines 12-14 of `planningpoker-api/src/main/resources/application.properties` (the current `# Logging configuration` block) with exactly:

    ```properties
    # Logging configuration
    # Root and framework noise: quiet by default, overridable via $LOG_LEVEL_ROOT / $LOG_LEVEL_SPRING.
    logging.level.root=${LOG_LEVEL_ROOT:INFO}
    logging.level.org.springframework=${LOG_LEVEL_SPRING:INFO}
    # Application package: INFO in production; lifecycle events only, all PII scrubbed via LogSafeIds.
    logging.level.com.richashworth.planningpoker=${LOG_LEVEL_APP:INFO}
    # Hot-path classes (burst messaging + vote dispatch): WARN by default to suppress per-interaction noise.
    # Operators can raise to DEBUG via $LOG_LEVEL_HOTPATH without a redeploy.
    logging.level.com.richashworth.planningpoker.util.MessagingUtils=${LOG_LEVEL_HOTPATH:WARN}
    logging.level.com.richashworth.planningpoker.controller.VoteController=${LOG_LEVEL_HOTPATH:WARN}
    ```

    Keep every other property in the file unchanged. Do NOT remove `server.port`, `spring.main.banner-mode`, websocket size limits, actuator settings, `server.error.include-stacktrace`, or `app.cors.allowed-origins`.

    After editing, build the fat JAR and verify the packaged file contains the new keys:

    ```bash
    cd planningpoker-web && npm ci && npm run build && cd ..
    ./gradlew planningpoker-web:jar --no-daemon
    ./gradlew planningpoker-api:bootJar --no-daemon
    unzip -p planningpoker-api/build/libs/planningpoker-api-*.jar BOOT-INF/classes/application.properties | grep "logging.level"
    ```

    The grep output must list all five `logging.level.*` keys.
  </action>
  <verify>
    <automated>grep -c "LOG_LEVEL_HOTPATH" planningpoker-api/src/main/resources/application.properties</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "logging.level.root" planningpoker-api/src/main/resources/application.properties` returns 1.
    - `grep -c "logging.level.com.richashworth.planningpoker=" planningpoker-api/src/main/resources/application.properties` returns 1.
    - `grep -c "logging.level.com.richashworth.planningpoker.util.MessagingUtils" planningpoker-api/src/main/resources/application.properties` returns 1.
    - `grep -c "logging.level.com.richashworth.planningpoker.controller.VoteController" planningpoker-api/src/main/resources/application.properties` returns 1.
    - `grep -c "LOG_LEVEL_HOTPATH:WARN" planningpoker-api/src/main/resources/application.properties` returns 2.
    - `grep -c "LOG_LEVEL_APP:INFO" planningpoker-api/src/main/resources/application.properties` returns 1.
    - `grep -c "logging.level.com.richashworth.planningpoker=DEBUG" planningpoker-api/src/main/resources/application.properties` returns 0 (old DEBUG default removed).
    - `unzip -p planningpoker-api/build/libs/planningpoker-api-*.jar BOOT-INF/classes/application.properties | grep -c "LOG_LEVEL_HOTPATH"` returns 2.
    - `./gradlew planningpoker-api:test --no-daemon` exits 0.
  </acceptance_criteria>
  <done>Production application.properties ships with root=INFO, app=INFO, hot-path=WARN, every level overridable via `LOG_LEVEL_*` env vars, and the packaged fat JAR contains the new keys.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Regression test guarding against PII in logs</name>
  <files>planningpoker-api/src/test/java/com/richashworth/planningpoker/logging/LoggingHygieneTest.java</files>
  <read_first>
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/VoteController.java
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/util/LogSafeIds.java
  </read_first>
  <behavior>
    - Test scans every `.java` file under `planningpoker-api/src/main/java/com/richashworth/planningpoker/`.
    - For every line matching `logger.(info|warn|error)(...)`, the test fails if the argument list contains a bare reference to a forbidden variable name: `sessionId`, `userName`, `targetUser`, `estimateValue`, or `request.userName()`.
    - "Bare reference" means the variable appears as an argument NOT wrapped in `LogSafeIds.hash(...)`.
    - `logger.debug(...)` calls are exempt — hot-path debug can reference hashed values for troubleshooting; test only guards INFO/WARN/ERROR levels.
    - Literal strings containing the word "sessionId" (e.g. a format string) are allowed — the regex must target argument positions, not the format string itself. Simplest approach: split the logger call into `(format_string, args)` by finding the first `,` after the opening `(`, then check `args` does not contain `\bsessionId\b|\buserName\b|\btargetUser\b|\bestimateValue\b` unless immediately preceded by `LogSafeIds.hash(`.
    - Test is named `LoggingHygieneTest` with a single `@Test` method `testNoRawPiiInInfoWarnErrorLogs()`.
    - Test is deterministic: no network, no build output dependency, only reads source files via `java.nio.file`.
    - Test fails with a clear message listing the offending file and line number(s) so a future contributor sees exactly what broke.
  </behavior>
  <action>
    Create `planningpoker-api/src/test/java/com/richashworth/planningpoker/logging/LoggingHygieneTest.java`:

    ```java
    package com.richashworth.planningpoker.logging;

    import static org.junit.jupiter.api.Assertions.assertTrue;

    import java.io.IOException;
    import java.nio.file.Files;
    import java.nio.file.Path;
    import java.nio.file.Paths;
    import java.util.ArrayList;
    import java.util.List;
    import java.util.regex.Matcher;
    import java.util.regex.Pattern;
    import java.util.stream.Stream;
    import org.junit.jupiter.api.Test;

    /**
     * LOG-02 regression guard: no raw session ID, username, or vote value may appear
     * in logger.info / logger.warn / logger.error calls under src/main/java.
     *
     * Wrapped calls like {@code LogSafeIds.hash(sessionId)} are allowed.
     * logger.debug is exempt (hot-path troubleshooting).
     */
    class LoggingHygieneTest {

      private static final Path SRC_ROOT =
          Paths.get("src/main/java/com/richashworth/planningpoker");

      private static final Pattern LOGGER_CALL =
          Pattern.compile("logger\\.(info|warn|error)\\s*\\((.*)\\);");

      private static final String[] FORBIDDEN =
          new String[] {"sessionId", "userName", "targetUser", "estimateValue"};

      @Test
      void testNoRawPiiInInfoWarnErrorLogs() throws IOException {
        List<String> violations = new ArrayList<>();
        try (Stream<Path> paths = Files.walk(SRC_ROOT)) {
          paths
              .filter(p -> p.toString().endsWith(".java"))
              .forEach(
                  p -> {
                    try {
                      List<String> lines = Files.readAllLines(p);
                      for (int i = 0; i < lines.size(); i++) {
                        String line = lines.get(i);
                        Matcher m = LOGGER_CALL.matcher(line);
                        if (!m.find()) continue;
                        String args = m.group(2);
                        // Strip all LogSafeIds.hash(...) wrapped expressions before scanning.
                        String scrubbed = args.replaceAll(
                            "LogSafeIds\\.hash\\([^)]*\\)", "HASHED");
                        for (String bad : FORBIDDEN) {
                          if (scrubbed.matches(".*\\b" + bad + "\\b.*")) {
                            violations.add(
                                p + ":" + (i + 1) + " -> " + line.trim());
                          }
                        }
                      }
                    } catch (IOException e) {
                      throw new RuntimeException(e);
                    }
                  });
        }
        assertTrue(
            violations.isEmpty(),
            "Raw PII found in logger.info/warn/error calls (LOG-02 violation):\n"
                + String.join("\n", violations));
      }
    }
    ```

    Run the test. If it reports violations, fix the offending logger call(s) in plan 01 files before merging — do NOT loosen this test. If the test itself has false positives on a legitimate call, refine the regex, not the scope.
  </action>
  <verify>
    <automated>./gradlew planningpoker-api:test --tests "com.richashworth.planningpoker.logging.LoggingHygieneTest" --no-daemon</automated>
  </verify>
  <acceptance_criteria>
    - File `planningpoker-api/src/test/java/com/richashworth/planningpoker/logging/LoggingHygieneTest.java` exists.
    - `grep -c "LogSafeIds\\\\.hash" planningpoker-api/src/test/java/com/richashworth/planningpoker/logging/LoggingHygieneTest.java` returns at least 1.
    - `grep -c "sessionId" planningpoker-api/src/test/java/com/richashworth/planningpoker/logging/LoggingHygieneTest.java` returns at least 1 (forbidden list).
    - `./gradlew planningpoker-api:test --tests "com.richashworth.planningpoker.logging.LoggingHygieneTest"` exits 0 (i.e. the test passes against the already-scrubbed codebase from plan 01).
    - `./gradlew planningpoker-api:test --no-daemon` (full suite) exits 0.
  </acceptance_criteria>
  <done>LoggingHygieneTest exists, passes against the scrubbed codebase, and will fail loudly if a future contributor adds `logger.info("... {}", sessionId)` without `LogSafeIds.hash(...)`.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Railway env vars → JVM → Logback config | Operator-supplied log level overrides |
| Future contributor commits → CI → merge | Source changes that could reintroduce PII in logs |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-13-06 | Information Disclosure | Misconfigured production log level (DEBUG leaking) | mitigate | `application.properties` hardcodes `INFO` and `WARN` defaults via `${LOG_LEVEL_*:INFO}` syntax; omitting the env var yields the safe default. The old `logging.level.com.richashworth.planningpoker=DEBUG` is removed. |
| T-13-07 | Information Disclosure | Packaged fat JAR does not honor the new properties | mitigate | Task 1 acceptance criteria verify the keys are present inside `BOOT-INF/classes/application.properties` within the built JAR via `unzip -p`. |
| T-13-08 | Tampering / Regression | Future contributor adds `logger.info("... {}", sessionId)` without `LogSafeIds.hash` | mitigate | `LoggingHygieneTest` scans all `.java` sources on every `./gradlew planningpoker-api:test` run and fails with file:line detail. CI (`unit-tests` job on every PR) will block the merge. |
| T-13-09 | Denial of Service | Env-var override raises all loggers to TRACE, overwhelming Railway stdout | accept | Operator-initiated; easily reverted. Documented via property comment. |
</threat_model>

<verification>
1. `./gradlew planningpoker-api:test --no-daemon` passes, including `LoggingHygieneTest`.
2. `unzip -p planningpoker-api/build/libs/planningpoker-api-*.jar BOOT-INF/classes/application.properties | grep LOG_LEVEL_` lists 4 distinct env-var references.
3. Smoke run the fat JAR locally with `LOG_LEVEL_APP=INFO java -jar planningpoker-api/build/libs/planningpoker-api-*.jar` and confirm startup logs contain no raw session IDs (the app starts with no sessions, so this is a smoke check of format; actual E2E PII verification happens in the full UAT pass).
</verification>

<success_criteria>
- All five `logging.level.*` keys in `application.properties` resolve via `${LOG_LEVEL_*:default}` placeholders.
- Hot-path classes default to WARN.
- Packaged fat JAR contains the updated properties.
- LoggingHygieneTest exists, is wired into the default test task, and passes green.
- Full `./gradlew planningpoker-api:test` exits 0.
- LOG-03 requirement satisfied.
</success_criteria>

<output>
After completion, create `.planning/phases/13-backend-logging-hygiene/13-02-SUMMARY.md`
</output>
