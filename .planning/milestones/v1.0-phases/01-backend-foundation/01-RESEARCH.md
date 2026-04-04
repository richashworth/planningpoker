# Phase 1: Backend Foundation - Research

**Researched:** 2026-04-04
**Domain:** Java 21 / Spring Boot 3.4 — enum design, Java records, Jackson serialisation, in-memory state management
**Confidence:** HIGH

---

## Summary

Phase 1 is a pure backend, zero-dependency task: introduce a `SchemeType` enum and a `SchemeConfig` record into the model layer, then extend `SessionManager` to store and evict that config alongside every other per-session map it already manages. No API surface changes, no frontend touches, and no new libraries are required.

The codebase is already well-structured for this work. `SessionManager` uses four synchronized maps today; adding two more follows an established pattern. `Estimate.java` is a Lombok `@Data` class — the new `SchemeConfig` can be a native Java record instead (Java 21, no Lombok needed, Jackson serialises it out of the box). The test suite uses JUnit 5 + Mockito with constructor injection, which makes the new code straightforward to unit-test.

The design spec at `docs/superpowers/specs/2026-04-04-estimation-schemes-design.md` is detailed and authoritative. The pre-existing implementation plan at `docs/superpowers/plans/2026-04-04-estimation-schemes.md` includes exact test code for `SchemeTypeTest`. Research confirms that plan is correct and requires no deviation.

**Primary recommendation:** Implement `SchemeType` as a Java enum with a `getValues()` method and a static `resolveValues()` factory, implement `SchemeConfig` as a Java record, and add two `ConcurrentHashMap` entries to `SessionManager` — one for resolved legal values (used in Phase 2 by `VoteController`), one for the full config (used in Phase 2 by `GameController`).

---

## Project Constraints (from CLAUDE.md)

- **Tech stack locked:** Spring Boot 3.4 + Java 21 backend, React 18 + MUI v5 frontend — no new frameworks or libraries
- **Backwards compatibility:** Default to Fibonacci so existing flows work unchanged
- **In-memory state only:** No database — scheme config stored in SessionManager maps like existing state
- **API evolution (Phase 2 concern):** createSession response changes from String to JSON — not addressed in Phase 1
- **Build commands:** `planningpoker-web:jar` and `planningpoker-api:bootJar` must be separate Gradle invocations
- **No TypeScript:** Frontend is plain JS — not relevant to this phase
- **Naming conventions:** Java classes PascalCase, test classes `<ClassName>Test`, test methods `test<MethodName>`
- **No Lombok for records:** `Estimate.java` uses `@Data @AllArgsConstructor`; `SchemeConfig` should use a Java record (cleaner, no annotation processor needed)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| API-04 | Scheme state is stored per-session in SessionManager | Add two `ConcurrentHashMap<String, ...>` fields; follow existing pattern from `lastActivity` map |
| API-05 | Scheme state is cleaned up when sessions are evicted/cleared | All four eviction/clear paths in `SessionManager` must be extended: `clearSessions()`, `evictIdleSessions()` |
</phase_requirements>

---

## Standard Stack

### Core (all already in project)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Java 21 | 21 (JDK) | Language runtime; records, sealed types | Project requirement |
| Spring Boot | 3.4.4 | Application framework | Project requirement |
| Jackson (via spring-boot-starter-web) | 2.18.x (BOM) | JSON serialisation | Auto-configured by Spring Boot |
| JUnit 5 | 5.11.4 | Unit tests | Declared in build.gradle |
| Mockito | 5.15.2 | Mocking | Declared in build.gradle |
| Lombok | 1.18.36 | Used by Estimate; NOT needed for SchemeConfig record | Already in build.gradle |

### No New Dependencies

Phase 1 requires zero new entries in `build.gradle`. Java records and enums are language features. Jackson serialises records natively since Jackson 2.12 (Spring Boot 3.x ships 2.18.x).

**Installation:** none required.

---

## Architecture Patterns

### Recommended File Structure (changes only)

```
planningpoker-api/src/main/java/com/richashworth/planningpoker/
├── model/
│   ├── Estimate.java          (existing, untouched)
│   ├── SchemeType.java        (NEW — enum)
│   └── SchemeConfig.java      (NEW — record)
└── service/
    └── SessionManager.java    (MODIFY — add two maps + methods)

planningpoker-api/src/test/java/com/richashworth/planningpoker/
├── model/
│   └── SchemeTypeTest.java    (NEW)
└── service/
    └── SessionManagerTest.java (MODIFY — extend for scheme storage/eviction)
```

### Pattern 1: Java Enum with Behaviour

**What:** An enum whose constants carry immutable value lists, plus a static factory method for resolving a scheme name + custom values + toggles into a final `List<String>`.

**When to use:** When a fixed set of named variants each carry associated data. Avoids switch statements scattered across call sites.

**Example:**
```java
// Source: Java Language Spec / project pattern
public enum SchemeType {
    FIBONACCI(List.of("0", "0.5", "1", "2", "3", "5", "8", "13", "20", "50", "100", "\u221e")),
    TSHIRT(List.of("XS", "S", "M", "L", "XL", "XXL")),
    SIMPLE(List.of("1", "2", "3", "4", "5"));

    private static final String UNSURE  = "?";
    private static final String COFFEE  = "\u2615";
    private static final int MAX_CUSTOM = 20;
    private static final int MIN_CUSTOM = 2;
    private static final int MAX_VALUE_LEN = 10;

    private final List<String> values;

    SchemeType(List<String> values) {
        this.values = values;
    }

    public List<String> getValues() {
        return values;
    }

    public static SchemeType fromString(String name) {
        // throws IllegalArgumentException for "custom" and unknown names
        for (SchemeType t : values()) {
            if (t.name().equalsIgnoreCase(name)) return t;
        }
        throw new IllegalArgumentException("Unknown scheme type: " + name);
    }

    /**
     * Resolves any scheme (preset or custom) to the final ordered legal values list.
     */
    public static List<String> resolveValues(
            String schemeType,
            String customValuesCsv,
            boolean includeUnsure,
            boolean includeCoffee) {
        // ... see Pitfalls for custom value validation
    }
}
```

### Pattern 2: Java Record for Config Transport

**What:** A record holding the scheme metadata that needs to travel from SessionManager to the controller layer (Phase 2) and eventually to the JSON response.

**When to use:** Immutable data carriers without behaviour. Jackson serialises records as POJOs: field names become JSON keys.

**Example:**
```java
// Source: Java 21 JEP 395
public record SchemeConfig(
    String schemeType,
    List<String> customValues,   // null for presets
    boolean includeUnsure,
    boolean includeCoffee
) {}
```

Jackson notes (confidence: HIGH — verified against Spring Boot 3.x / Jackson 2.12+ behaviour):
- Records are serialised by Jackson automatically — no `@JsonProperty` needed when field names match desired JSON keys.
- `List<String> customValues` serialises as a JSON array; `null` serialises as `null` (not omitted unless `@JsonInclude(NON_NULL)` is added).
- No-arg constructor is not required for deserialization when Jackson has access to the canonical constructor (records always have one).

### Pattern 3: SessionManager Map Extension

**What:** Follow the exact pattern of the existing `lastActivity` `ConcurrentHashMap`. Add two new maps, populate them in `createSession()`, and remove them in every eviction path.

**Current eviction paths (ALL must be covered):**

| Method | Trigger | Maps cleared today |
|--------|---------|-------------------|
| `clearSessions()` | Weekly cron + `ClearSessionsTask` | `sessionUsers`, `sessionEstimates`, `activeSessions`, `lastActivity` |
| `evictIdleSessions()` | Every 5 min via `ClearSessionsTask` | same four per idle session |

Both methods must call `removeAll` / `remove` on the two new maps.

**Example addition to `SessionManager`:**
```java
// Two new fields — parallel to existing maps
private final ConcurrentHashMap<String, List<String>> sessionLegalValues = new ConcurrentHashMap<>();
private final ConcurrentHashMap<String, SchemeConfig> sessionSchemeConfigs = new ConcurrentHashMap<>();
```

### Anti-Patterns to Avoid

- **Storing scheme resolution logic in SessionManager:** SessionManager is a stateful store, not a domain logic class. Keep `resolveValues()` in `SchemeType`, call it from SessionManager's `createSession` overload.
- **Using Lombok @Data on SchemeConfig:** A Java record is cleaner and idiomatic for Java 21. Lombok is only present for `Estimate.java` which predates records.
- **Exposing mutable List from getSessionLegalValues:** Wrap with `List.copyOf(...)` exactly as `getResults()` does today.
- **Forgetting to clear in `clearSessions()` synchronized block:** The entire `clearSessions()` body is inside a `synchronized(this)` implicit scope. New map clears must be inside the same synchronized block.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON serialisation of SchemeConfig | Custom serialiser / MapStruct | Jackson via `@RestController` (auto) | Spring Boot auto-configures Jackson; records are natively supported since Jackson 2.12 |
| Thread-safe map operations | Custom locking | `ConcurrentHashMap` (existing pattern) | Already used for `lastActivity`; same guarantees needed |
| Enum string lookup | Hand-coded `if/else` chain | `Enum.valueOf()` or loop over `values()` | Standard Java; throw `IllegalArgumentException` on miss for controller error propagation |

---

## Common Pitfalls

### Pitfall 1: Orphaned Map Entries After Eviction

**What goes wrong:** New maps (`sessionLegalValues`, `sessionSchemeConfigs`) are populated on `createSession` but one of the two eviction paths (`clearSessions` or `evictIdleSessions`) is missed. The entry leaks indefinitely and grows the heap.

**Why it happens:** Developer adds cleanup to `evictIdleSessions` but forgets `clearSessions` (or vice versa) because the two methods look independent.

**How to avoid:** Search for every call site where `activeSessions`, `sessionEstimates`, or `sessionUsers` have entries removed. The new maps must mirror them exactly.

**Warning signs:** `SessionManagerTest.testClearSessions()` and `testEvictIdleSessions()` must both assert the new maps are empty after their respective operations.

### Pitfall 2: Custom Value Validation Order

**What goes wrong:** Resolving custom values without validating count, length, and duplicates before building the list. Duplicate values cause ambiguous vote matching downstream.

**Why it happens:** Splitting on comma and streaming looks clean; validation is an afterthought.

**How to avoid:** In `SchemeType.resolveValues()`, validate strictly in this order: (1) split and trim, (2) check count in `[MIN_CUSTOM, MAX_CUSTOM]`, (3) check each value length <= `MAX_VALUE_LEN`, (4) check no duplicates. Throw `IllegalArgumentException` at first violation — `ErrorHandler` catches it and returns HTTP 400.

**Warning signs:** Tests `resolveCustomRejectsTooFew`, `resolveCustomRejectsTooMany`, `resolveCustomRejectsTooLong`, `resolveCustomTrimsAndDeduplicates` all in the pre-existing test spec.

### Pitfall 3: Meta-Card Symbols in Enum vs Controller

**What goes wrong:** The `?` and coffee symbol (`\u2615`) are defined in `Constants.js` (frontend) and hardcoded in `VoteController.LEGAL_ESTIMATES` (backend). Putting new copies in `SchemeType` creates three sources of truth.

**Why it happens:** Copy-paste from the spec without checking existing constants.

**How to avoid:** In `SchemeType`, define `UNSURE = "?"` and `COFFEE = "\u2615"` as private static final constants inside the enum. In Phase 2, `VoteController.LEGAL_ESTIMATES` will be deleted entirely and replaced by per-session lookup, eliminating the duplication. For Phase 1 (no API changes), `VoteController` is untouched — the symbols only need to live in `SchemeType` for now.

### Pitfall 4: Jackson Fails to Serialise Record with Null List

**What goes wrong:** `SchemeConfig.customValues` is `null` for presets. Jackson serialises it as `"customValues": null` by default. This is fine for Phase 1 (no API surface yet), but Phase 2 may want to omit the field.

**Why it happens:** Default Jackson behaviour includes null fields.

**How to avoid:** For Phase 1, no action needed — the record is stored in-memory only. In Phase 2, add `@JsonInclude(JsonInclude.Include.NON_NULL)` to the record or configure it globally if desired. Do not pre-optimise in Phase 1.

### Pitfall 5: Synchronized Block Scope in createSession

**What goes wrong:** The new `sessionLegalValues.put(...)` call is placed outside the `synchronized (sessionManager)` block in the controller (Phase 2 concern), creating a window where the session ID is active but has no scheme entry.

**Why it happens:** The resolved values computation is done before the synchronized block to minimise lock time, but the map insertion is missed.

**How to avoid:** In Phase 1, the scheme maps are populated inside `SessionManager.createSession()` itself, which already runs inside the `synchronized (sessionManager)` block in `GameController`. The encapsulation keeps the invariant safe.

---

## Code Examples

### SchemeType enum skeleton

```java
// Package: com.richashworth.planningpoker.model
public enum SchemeType {
    FIBONACCI(List.of("0", "0.5", "1", "2", "3", "5", "8", "13", "20", "50", "100", "\u221e")),
    TSHIRT(List.of("XS", "S", "M", "L", "XL", "XXL")),
    SIMPLE(List.of("1", "2", "3", "4", "5"));

    private static final String UNSURE = "?";
    private static final String COFFEE = "\u2615";
    private static final int MAX_CUSTOM_VALUES = 20;
    private static final int MIN_CUSTOM_VALUES = 2;
    private static final int MAX_VALUE_LENGTH = 10;

    private final List<String> values;

    SchemeType(List<String> values) { this.values = values; }

    public List<String> getValues() { return values; }

    public static SchemeType fromString(String name) {
        for (SchemeType t : values()) {
            if (t.name().equalsIgnoreCase(name)) return t;
        }
        throw new IllegalArgumentException("Unknown scheme type: " + name);
    }

    public static List<String> resolveValues(String schemeType, String customValuesCsv,
                                             boolean includeUnsure, boolean includeCoffee) {
        List<String> base;
        if ("custom".equalsIgnoreCase(schemeType)) {
            base = parseAndValidateCustom(customValuesCsv);
        } else {
            base = new ArrayList<>(fromString(schemeType).getValues());
        }
        if (includeUnsure) base.add(UNSURE);
        if (includeCoffee) base.add(COFFEE);
        return Collections.unmodifiableList(base);
    }

    private static List<String> parseAndValidateCustom(String csv) {
        if (csv == null || csv.isBlank()) {
            throw new IllegalArgumentException("Custom values must not be empty");
        }
        String[] parts = csv.split(",");
        List<String> trimmed = Arrays.stream(parts)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .collect(Collectors.toList());
        if (trimmed.size() < MIN_CUSTOM_VALUES) {
            throw new IllegalArgumentException("Custom scheme requires at least " + MIN_CUSTOM_VALUES + " values");
        }
        if (trimmed.size() > MAX_CUSTOM_VALUES) {
            throw new IllegalArgumentException("Custom scheme allows at most " + MAX_CUSTOM_VALUES + " values");
        }
        for (String v : trimmed) {
            if (v.length() > MAX_VALUE_LENGTH) {
                throw new IllegalArgumentException("Custom value '" + v + "' exceeds max length of " + MAX_VALUE_LENGTH);
            }
        }
        return new ArrayList<>(trimmed);
    }
}
```

### SchemeConfig record

```java
// Package: com.richashworth.planningpoker.model
public record SchemeConfig(
    String schemeType,
    List<String> customValues,
    boolean includeUnsure,
    boolean includeCoffee
) {}
```

### SessionManager additions

```java
// New fields
private final ConcurrentHashMap<String, List<String>> sessionLegalValues = new ConcurrentHashMap<>();
private final ConcurrentHashMap<String, SchemeConfig> sessionSchemeConfigs = new ConcurrentHashMap<>();

// New overload (Phase 1 adds this; createSession() with no args stays for backward compat)
public String createSession(SchemeConfig config) {
    // ... existing ID generation ...
    String sessionId = /* existing logic */ ;
    activeSessions.add(sessionId);
    List<String> legal = SchemeType.resolveValues(
            config.schemeType(), config.customValues() != null ? String.join(",", config.customValues()) : null,
            config.includeUnsure(), config.includeCoffee());
    sessionLegalValues.put(sessionId, legal);
    sessionSchemeConfigs.put(sessionId, config);
    touchSession(sessionId);
    return sessionId;
}

// New accessors
public List<String> getSessionLegalValues(String sessionId) {
    return List.copyOf(sessionLegalValues.getOrDefault(sessionId, List.of()));
}

public SchemeConfig getSessionSchemeConfig(String sessionId) {
    return sessionSchemeConfigs.get(sessionId);
}

// In clearSessions()
sessionLegalValues.clear();
sessionSchemeConfigs.clear();

// In evictIdleSessions() for each toEvict entry
sessionLegalValues.remove(sessionId);
sessionSchemeConfigs.remove(sessionId);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Lombok `@Data` for all model classes | Java records for immutable data carriers | Java 16 (stable Java 21) | `SchemeConfig` should be a record, not a Lombok class |
| `Enum.valueOf()` for string-to-enum | Loop + `equalsIgnoreCase` | N/A | `Enum.valueOf()` is case-sensitive; need case-insensitive lookup |
| Custom serialisers for complex types | Jackson native record support | Jackson 2.12 (Spring Boot 2.5+) | No configuration needed for `SchemeConfig` record |

---

## Open Questions

1. **Should `createSession()` with no args remain?**
   - What we know: `GameController.createSession()` currently calls `sessionManager.createSession()` with no scheme args. Phase 2 will add scheme params to the controller endpoint.
   - What's unclear: Should Phase 1 add a new overload `createSession(SchemeConfig)` alongside the existing no-arg version, or modify the signature directly?
   - Recommendation: Add a new overload for Phase 1. The no-arg version can default to `FIBONACCI` with both toggles on. Phase 2 will wire the controller to pass the actual config. This keeps Phase 1 self-contained and existing tests unbroken.

2. **Where does custom values CSV parsing live?**
   - What we know: The spec shows `customValuesCsv` as a comma-separated string parameter.
   - What's unclear: Should parsing/validation happen in `SchemeType.resolveValues()` or in `GameController` before calling SessionManager?
   - Recommendation: Keep it in `SchemeType.resolveValues()` — this is domain logic, not controller logic, and keeps it unit-testable without Spring context.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — pure Java model and service layer, no new tools or services required)

---

## Sources

### Primary (HIGH confidence)
- `docs/superpowers/specs/2026-04-04-estimation-schemes-design.md` — canonical design for scheme values, API shape, and SessionManager changes
- `docs/superpowers/plans/2026-04-04-estimation-schemes.md` — pre-written test code for `SchemeTypeTest`, file map
- `planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java` — existing patterns for map management and eviction
- `planningpoker-api/src/test/java/com/richashworth/planningpoker/service/SessionManagerTest.java` — existing test patterns and reflection-based field backdating

### Secondary (MEDIUM confidence)
- Jackson 2.12 release notes — native record support (Spring Boot 3.x ships 2.18.x; confirmed via Spring Boot BOM)
- Java 16+ JEP 395 — records are stable and fully supported in Java 21

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all libraries already in build.gradle
- Architecture: HIGH — patterns taken directly from existing code and authoritative design spec
- Pitfalls: HIGH — derived from careful reading of all eviction paths in SessionManager and the existing test suite

**Research date:** 2026-04-04
**Valid until:** 2026-05-04 (stable domain — Spring Boot 3.4 and Java 21 are not fast-moving for this feature set)
