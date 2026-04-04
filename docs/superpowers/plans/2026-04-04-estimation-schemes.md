# Estimation Schemes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let hosts choose an estimation scheme (Fibonacci, T-shirt, Simple, Custom) when creating a game, with toggleable ? and coffee meta-cards.

**Architecture:** Add per-session scheme storage in `SessionManager`. `createSession` and `joinSession` return JSON with scheme metadata. Frontend resolves scheme name to values locally; custom values are transmitted explicitly. Vote validation uses per-session scheme instead of a hardcoded set.

**Tech Stack:** Spring Boot 3.4 (Java 21), React 18, Redux 4, MUI v5, Vitest, JUnit 5/Mockito, Playwright

**Spec:** `docs/superpowers/specs/2026-04-04-estimation-schemes-design.md`

---

## File Map

### Backend — Create
- `planningpoker-api/src/main/java/com/richashworth/planningpoker/model/SchemeConfig.java` — record holding scheme type, custom values, toggle flags
- `planningpoker-api/src/main/java/com/richashworth/planningpoker/model/SchemeType.java` — enum with preset value lists

### Backend — Modify
- `planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java` — add scheme storage per session
- `planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java` — accept scheme params, return JSON
- `planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/VoteController.java` — per-session vote validation

### Backend — Test
- `planningpoker-api/src/test/java/com/richashworth/planningpoker/model/SchemeTypeTest.java`
- `planningpoker-api/src/test/java/com/richashworth/planningpoker/service/SessionManagerTest.java`
- `planningpoker-api/src/test/java/com/richashworth/planningpoker/controller/GameControllerTest.java`
- `planningpoker-api/src/test/java/com/richashworth/planningpoker/controller/VoteControllerTest.java`
- `planningpoker-api/src/test/java/com/richashworth/planningpoker/common/PlanningPokerTestFixture.java`

### Frontend — Create
- `planningpoker-web/src/config/Schemes.js` — preset definitions + resolver function

### Frontend — Modify
- `planningpoker-web/src/config/Constants.js` — remove LEGAL_ESTIMATES
- `planningpoker-web/src/actions/index.js` — pass scheme params, parse JSON responses
- `planningpoker-web/src/reducers/reducer_game.js` — add scheme fields to state
- `planningpoker-web/src/pages/CreateGame.jsx` — scheme selector UI
- `planningpoker-web/src/containers/Vote.jsx` — dynamic card rendering
- `planningpoker-web/src/containers/ResultsChart.jsx` — dynamic chart labels

### Frontend — Test
- `planningpoker-web/src/reducers/__tests__/reducer_game.test.js`
- `planningpoker-web/tests/planning-poker.spec.js` (e2e)

---

## Task 1: SchemeType enum and SchemeConfig record

**Files:**
- Create: `planningpoker-api/src/main/java/com/richashworth/planningpoker/model/SchemeType.java`
- Create: `planningpoker-api/src/main/java/com/richashworth/planningpoker/model/SchemeConfig.java`
- Create: `planningpoker-api/src/test/java/com/richashworth/planningpoker/model/SchemeTypeTest.java`

- [ ] **Step 1: Write SchemeType test**

```java
package com.richashworth.planningpoker.model;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SchemeTypeTest {

    @Test
    void fibonacciHasExpectedValues() {
        List<String> values = SchemeType.FIBONACCI.getValues();
        assertEquals(List.of("0", "0.5", "1", "2", "3", "5", "8", "13", "20", "50", "100", "\u221e"), values);
    }

    @Test
    void tshirtHasExpectedValues() {
        List<String> values = SchemeType.TSHIRT.getValues();
        assertEquals(List.of("XS", "S", "M", "L", "XL", "XXL"), values);
    }

    @Test
    void simpleHasExpectedValues() {
        List<String> values = SchemeType.SIMPLE.getValues();
        assertEquals(List.of("1", "2", "3", "4", "5"), values);
    }

    @Test
    void fromStringMatchesCaseInsensitive() {
        assertEquals(SchemeType.FIBONACCI, SchemeType.fromString("fibonacci"));
        assertEquals(SchemeType.TSHIRT, SchemeType.fromString("tshirt"));
        assertEquals(SchemeType.SIMPLE, SchemeType.fromString("simple"));
    }

    @Test
    void fromStringRejectsUnknown() {
        assertThrows(IllegalArgumentException.class, () -> SchemeType.fromString("bogus"));
    }

    @Test
    void fromStringRejectsCustom() {
        assertThrows(IllegalArgumentException.class, () -> SchemeType.fromString("custom"));
    }

    @Test
    void resolvePresetWithToggles() {
        List<String> values = SchemeType.resolveValues("tshirt", null, true, true);
        assertEquals(List.of("XS", "S", "M", "L", "XL", "XXL", "?", "\u2615"), values);
    }

    @Test
    void resolvePresetWithoutToggles() {
        List<String> values = SchemeType.resolveValues("tshirt", null, false, false);
        assertEquals(List.of("XS", "S", "M", "L", "XL", "XXL"), values);
    }

    @Test
    void resolveCustomValues() {
        List<String> values = SchemeType.resolveValues("custom", "Low,Med,High", true, false);
        assertEquals(List.of("Low", "Med", "High", "?"), values);
    }

    @Test
    void resolveCustomTrimsAndDeduplicates() {
        List<String> values = SchemeType.resolveValues("custom", " A , B , A , C ", false, false);
        assertEquals(List.of("A", "B", "C"), values);
    }

    @Test
    void resolveCustomRejectsTooFew() {
        assertThrows(IllegalArgumentException.class,
                () -> SchemeType.resolveValues("custom", "Solo", false, false));
    }

    @Test
    void resolveCustomRejectsTooMany() {
        String csv = "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21";
        assertThrows(IllegalArgumentException.class,
                () -> SchemeType.resolveValues("custom", csv, false, false));
    }

    @Test
    void resolveCustomRejectsTooLong() {
        assertThrows(IllegalArgumentException.class,
                () -> SchemeType.resolveValues("custom", "Short,ThisValueIsWayTooLongForACard", false, false));
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./gradlew planningpoker-api:test --tests "com.richashworth.planningpoker.model.SchemeTypeTest"`
Expected: Compilation failure — `SchemeType` does not exist

- [ ] **Step 3: Implement SchemeType**

```java
package com.richashworth.planningpoker.model;

import java.util.*;
import java.util.stream.Collectors;

public enum SchemeType {
    FIBONACCI(List.of("0", "0.5", "1", "2", "3", "5", "8", "13", "20", "50", "100", "\u221e")),
    TSHIRT(List.of("XS", "S", "M", "L", "XL", "XXL")),
    SIMPLE(List.of("1", "2", "3", "4", "5"));

    private final List<String> values;

    SchemeType(List<String> values) {
        this.values = values;
    }

    public List<String> getValues() {
        return values;
    }

    public static SchemeType fromString(String name) {
        try {
            return valueOf(name.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown scheme type: " + name);
        }
    }

    public static List<String> resolveValues(String schemeType, String customValues,
                                              boolean includeUnsure, boolean includeCoffee) {
        List<String> base;
        if ("custom".equalsIgnoreCase(schemeType)) {
            base = parseCustomValues(customValues);
        } else {
            base = fromString(schemeType).getValues();
        }
        List<String> result = new ArrayList<>(base);
        if (includeUnsure) result.add("?");
        if (includeCoffee) result.add("\u2615");
        return Collections.unmodifiableList(result);
    }

    private static List<String> parseCustomValues(String csv) {
        if (csv == null || csv.isBlank()) {
            throw new IllegalArgumentException("Custom values are required for custom scheme");
        }
        List<String> values = Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .collect(Collectors.toList());
        if (values.size() < 2) {
            throw new IllegalArgumentException("Custom scheme requires at least 2 values");
        }
        if (values.size() > 20) {
            throw new IllegalArgumentException("Custom scheme allows at most 20 values");
        }
        for (String v : values) {
            if (v.length() > 10) {
                throw new IllegalArgumentException("Custom value '" + v + "' exceeds 10 characters");
            }
        }
        return values;
    }
}
```

- [ ] **Step 4: Implement SchemeConfig**

```java
package com.richashworth.planningpoker.model;

import java.util.List;

public record SchemeConfig(
        String schemeType,
        List<String> customValues,
        boolean includeUnsure,
        boolean includeCoffee
) {}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `./gradlew planningpoker-api:test --tests "com.richashworth.planningpoker.model.SchemeTypeTest"`
Expected: All 13 tests PASS

- [ ] **Step 6: Commit**

```bash
git add planningpoker-api/src/main/java/com/richashworth/planningpoker/model/SchemeType.java \
       planningpoker-api/src/main/java/com/richashworth/planningpoker/model/SchemeConfig.java \
       planningpoker-api/src/test/java/com/richashworth/planningpoker/model/SchemeTypeTest.java
git commit -m "feat: add SchemeType enum and SchemeConfig record for estimation schemes"
```

---

## Task 2: SessionManager — scheme storage

**Files:**
- Modify: `planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java`
- Modify: `planningpoker-api/src/test/java/com/richashworth/planningpoker/service/SessionManagerTest.java`

- [ ] **Step 1: Write tests for scheme storage**

Add these tests to the existing `SessionManagerTest`:

```java
@Test
void testCreateSessionWithScheme() {
    String sessionId = sessionManager.createSession("fibonacci", null, true, true);
    assertTrue(sessionManager.isSessionActive(sessionId));
    List<String> scheme = sessionManager.getSessionScheme(sessionId);
    assertTrue(scheme.contains("5"));
    assertTrue(scheme.contains("?"));
    assertTrue(scheme.contains("\u2615"));
}

@Test
void testCreateSessionWithCustomScheme() {
    String sessionId = sessionManager.createSession("custom", "S,M,L", false, true);
    List<String> scheme = sessionManager.getSessionScheme(sessionId);
    assertEquals(List.of("S", "M", "L", "\u2615"), scheme);
}

@Test
void testGetSchemeConfig() {
    String sessionId = sessionManager.createSession("tshirt", null, true, false);
    SchemeConfig config = sessionManager.getSchemeConfig(sessionId);
    assertEquals("tshirt", config.schemeType());
    assertNull(config.customValues());
    assertTrue(config.includeUnsure());
    assertFalse(config.includeCoffee());
}

@Test
void testClearSessionsClearsSchemes() {
    String sessionId = sessionManager.createSession("simple", null, true, true);
    sessionManager.clearSessions();
    assertFalse(sessionManager.isSessionActive(sessionId));
    assertTrue(sessionManager.getSessionScheme(sessionId).isEmpty());
}
```

Add import: `import com.richashworth.planningpoker.model.SchemeConfig;`

- [ ] **Step 2: Run tests to verify they fail**

Run: `./gradlew planningpoker-api:test --tests "com.richashworth.planningpoker.service.SessionManagerTest"`
Expected: Compilation failure — `createSession` signature doesn't match

- [ ] **Step 3: Update SessionManager**

Add two new fields after the `lastActivity` field:

```java
private final ConcurrentHashMap<String, List<String>> sessionSchemes = new ConcurrentHashMap<>();
private final ConcurrentHashMap<String, SchemeConfig> sessionSchemeConfigs = new ConcurrentHashMap<>();
```

Add import: `import com.richashworth.planningpoker.model.SchemeConfig;`
Add import: `import com.richashworth.planningpoker.model.SchemeType;`

Replace the existing `createSession()` method with an overload that accepts scheme params:

```java
public String createSession() {
    return createSession("fibonacci", null, true, true);
}

public String createSession(String schemeType, String customValues,
                             boolean includeUnsure, boolean includeCoffee) {
    if (activeSessions.size() >= MAX_SESSIONS) {
        throw new IllegalStateException("Too many active sessions");
    }
    List<String> resolvedScheme = SchemeType.resolveValues(schemeType, customValues, includeUnsure, includeCoffee);
    List<String> parsedCustom = "custom".equalsIgnoreCase(schemeType)
            ? resolvedScheme.stream()
                .filter(v -> !v.equals("?") && !v.equals("\u2615"))
                .toList()
            : null;
    String sessionId;
    int attempts = 0;
    do {
        if (attempts >= MAX_ID_ATTEMPTS) {
            throw new IllegalStateException("Failed to generate unique session ID after " + MAX_ID_ATTEMPTS + " attempts");
        }
        sessionId = UUID.randomUUID().toString().substring(0, 8);
        attempts++;
    } while (activeSessions.contains(sessionId));
    activeSessions.add(sessionId);
    sessionSchemes.put(sessionId, resolvedScheme);
    sessionSchemeConfigs.put(sessionId, new SchemeConfig(schemeType.toLowerCase(), parsedCustom, includeUnsure, includeCoffee));
    touchSession(sessionId);
    return sessionId;
}
```

Add getter methods:

```java
public List<String> getSessionScheme(String sessionId) {
    List<String> scheme = sessionSchemes.get(sessionId);
    return scheme != null ? scheme : List.of();
}

public SchemeConfig getSchemeConfig(String sessionId) {
    return sessionSchemeConfigs.get(sessionId);
}
```

Update `clearSessions()` to also clear the new maps:

```java
sessionSchemes.clear();
sessionSchemeConfigs.clear();
```

Update `evictIdleSessions()` — inside the `for` loop, add after `lastActivity.remove(sessionId)`:

```java
sessionSchemes.remove(sessionId);
sessionSchemeConfigs.remove(sessionId);
```

- [ ] **Step 4: Run all SessionManager tests**

Run: `./gradlew planningpoker-api:test --tests "com.richashworth.planningpoker.service.SessionManagerTest"`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java \
       planningpoker-api/src/test/java/com/richashworth/planningpoker/service/SessionManagerTest.java
git commit -m "feat: add per-session scheme storage to SessionManager"
```

---

## Task 3: GameController — createSession returns JSON with scheme

**Files:**
- Modify: `planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java`
- Modify: `planningpoker-api/src/test/java/com/richashworth/planningpoker/controller/GameControllerTest.java`
- Modify: `planningpoker-api/src/test/java/com/richashworth/planningpoker/common/PlanningPokerTestFixture.java`

- [ ] **Step 1: Update test fixture**

Add to `PlanningPokerTestFixture.java`:

```java
public static final String SCHEME_TYPE = "fibonacci";
```

- [ ] **Step 2: Update GameControllerTest.testCreateSession**

Replace the existing `testCreateSession` test:

```java
@Test
void testCreateSession() {
    when(sessionManager.createSession(SCHEME_TYPE, null, true, true)).thenReturn(SESSION_ID);
    when(sessionManager.getSchemeConfig(SESSION_ID)).thenReturn(
            new SchemeConfig(SCHEME_TYPE, null, true, true));
    final Map<String, Object> response = gameController.createSession(USER_NAME, SCHEME_TYPE, null, true, true);
    assertEquals(SESSION_ID, response.get("sessionId"));
    assertEquals(SCHEME_TYPE, response.get("schemeType"));
    inOrder.verify(sessionManager, times(1)).createSession(SCHEME_TYPE, null, true, true);
    inOrder.verify(sessionManager, times(1)).registerUser(USER_NAME, SESSION_ID);
    inOrder.verify(messagingUtils, times(1)).burstUsersMessages(SESSION_ID);
}
```

Add import: `import com.richashworth.planningpoker.model.SchemeConfig;`
Add import: `import java.util.Map;`

- [ ] **Step 3: Run test to verify it fails**

Run: `./gradlew planningpoker-api:test --tests "com.richashworth.planningpoker.controller.GameControllerTest.testCreateSession"`
Expected: Compilation failure — `createSession` signature doesn't match

- [ ] **Step 4: Update GameController.createSession**

Replace the `createSession` method:

```java
@PostMapping("createSession")
public Map<String, Object> createSession(
        @RequestParam(name = "userName") final String userName,
        @RequestParam(name = "schemeType", defaultValue = "fibonacci") final String schemeType,
        @RequestParam(name = "customValues", required = false) final String customValues,
        @RequestParam(name = "includeUnsure", defaultValue = "true") final boolean includeUnsure,
        @RequestParam(name = "includeCoffee", defaultValue = "true") final boolean includeCoffee
) {
    validateUserName(userName);
    final String sessionId;
    synchronized (sessionManager) {
        sessionId = sessionManager.createSession(schemeType, customValues, includeUnsure, includeCoffee);
        sessionManager.registerUser(userName, sessionId);
        logger.info("{} has created session {} with scheme {}", userName, sessionId, schemeType);
    }
    messagingUtils.burstUsersMessages(sessionId);

    SchemeConfig config = sessionManager.getSchemeConfig(sessionId);
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("sessionId", sessionId);
    response.put("schemeType", config.schemeType());
    response.put("includeUnsure", config.includeUnsure());
    response.put("includeCoffee", config.includeCoffee());
    if (config.customValues() != null) {
        response.put("customValues", config.customValues());
    }
    return response;
}
```

Add imports:

```java
import com.richashworth.planningpoker.model.SchemeConfig;
import java.util.LinkedHashMap;
import java.util.Map;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `./gradlew planningpoker-api:test --tests "com.richashworth.planningpoker.controller.GameControllerTest.testCreateSession"`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java \
       planningpoker-api/src/test/java/com/richashworth/planningpoker/controller/GameControllerTest.java \
       planningpoker-api/src/test/java/com/richashworth/planningpoker/common/PlanningPokerTestFixture.java
git commit -m "feat: createSession returns JSON with scheme config"
```

---

## Task 4: GameController — joinSession returns scheme info

**Files:**
- Modify: `planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java`
- Modify: `planningpoker-api/src/test/java/com/richashworth/planningpoker/controller/GameControllerTest.java`

- [ ] **Step 1: Update GameControllerTest.testJoinSession**

Replace the existing `testJoinSession` test:

```java
@Test
void testJoinSession() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSchemeConfig(SESSION_ID)).thenReturn(
            new SchemeConfig(SCHEME_TYPE, null, true, true));
    Map<String, Object> response = gameController.joinSession(SESSION_ID, USER_NAME);
    assertEquals(SCHEME_TYPE, response.get("schemeType"));
    assertEquals(true, response.get("includeUnsure"));
    inOrder.verify(sessionManager, times(1)).registerUser(USER_NAME, SESSION_ID);
    inOrder.verify(messagingUtils, times(1)).burstUsersMessages(SESSION_ID);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./gradlew planningpoker-api:test --tests "com.richashworth.planningpoker.controller.GameControllerTest.testJoinSession"`
Expected: Compilation failure — return type mismatch

- [ ] **Step 3: Update GameController.joinSession**

Change return type from `void` to `Map<String, Object>`:

```java
@PostMapping("joinSession")
public Map<String, Object> joinSession(
        @RequestParam(name = "sessionId") final String sessionId,
        @RequestParam(name = "userName") final String userName
) {
    validateUserName(userName);
    synchronized (sessionManager) {
        if (!sessionManager.isSessionActive(sessionId)) {
            throw new IllegalArgumentException("session not found");
        } else if (containsIgnoreCase(sessionManager.getSessionUsers(sessionId), userName)) {
            throw new IllegalArgumentException("user exists");
        } else {
            sessionManager.registerUser(userName, sessionId);
            logger.info("{} has joined session {}", userName, sessionId);
        }
    }
    messagingUtils.burstUsersMessages(sessionId);

    SchemeConfig config = sessionManager.getSchemeConfig(sessionId);
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("schemeType", config.schemeType());
    response.put("includeUnsure", config.includeUnsure());
    response.put("includeCoffee", config.includeCoffee());
    if (config.customValues() != null) {
        response.put("customValues", config.customValues());
    }
    return response;
}
```

- [ ] **Step 4: Run all GameController tests**

Run: `./gradlew planningpoker-api:test --tests "com.richashworth.planningpoker.controller.GameControllerTest"`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java \
       planningpoker-api/src/test/java/com/richashworth/planningpoker/controller/GameControllerTest.java
git commit -m "feat: joinSession returns scheme config"
```

---

## Task 5: VoteController — per-session validation

**Files:**
- Modify: `planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/VoteController.java`
- Modify: `planningpoker-api/src/test/java/com/richashworth/planningpoker/controller/VoteControllerTest.java`

- [ ] **Step 1: Update VoteControllerTest**

Replace `testVoteInvalidEstimateRejected`:

```java
@Test
void testVoteInvalidEstimateRejected() {
    when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);
    when(sessionManager.getSessionUsers(SESSION_ID)).thenReturn(Lists.newArrayList(USER_NAME));
    when(sessionManager.getSessionScheme(SESSION_ID)).thenReturn(List.of("1", "2", "3"));
    assertThrows(IllegalArgumentException.class, () ->
        voteController.vote(SESSION_ID, USER_NAME, "999"));
}
```

Update `testVote` — add scheme stub before the vote call:

```java
when(sessionManager.getSessionScheme(SESSION_ID)).thenReturn(
        List.of("0", "0.5", "1", "2", "3", "5", "8", "13", "20", "50", "100", "\u221e", "?", "\u2615"));
```

And add verification: `inOrder.verify(sessionManager, times(1)).getSessionScheme(SESSION_ID);` after the `getSessionUsers` verify.

Update `testVoteUserAlreadyVoted` — add the same scheme stub.

Add `import java.util.List;` to the test file.

- [ ] **Step 2: Run tests to verify they fail**

Run: `./gradlew planningpoker-api:test --tests "com.richashworth.planningpoker.controller.VoteControllerTest"`
Expected: Failures — `getSessionScheme` not called

- [ ] **Step 3: Update VoteController**

Remove the `LEGAL_ESTIMATES` static field entirely. Replace the estimate validation inside the `synchronized` block. The new `vote` method:

```java
@PostMapping("vote")
public void vote(
        @RequestParam(name = "sessionId") final String sessionId,
        @RequestParam(name = "userName") final String userName,
        @RequestParam(name = "estimateValue") final String estimateValue
) {
    synchronized (sessionManager) {
        if (!sessionManager.isSessionActive(sessionId)) {
            throw new IllegalArgumentException("Session not active");
        }
        if (!CollectionUtils.containsIgnoreCase(
                sessionManager.getSessionUsers(sessionId), userName)) {
            throw new IllegalArgumentException("User is not a member of this session");
        }
        List<String> legalEstimates = sessionManager.getSessionScheme(sessionId);
        if (!legalEstimates.contains(estimateValue)) {
            throw new IllegalArgumentException("Invalid estimate value");
        }
        logger.info("{} has voted {} in session {}", userName, estimateValue, sessionId);
        if (!CollectionUtils.containsUserEstimate(sessionManager.getResults(sessionId), userName)) {
            final Estimate estimate = new Estimate(userName, estimateValue);
            sessionManager.registerEstimate(sessionId, estimate);
        }
    }
    messagingUtils.burstResultsMessages(sessionId);
}
```

Remove `import java.util.Set;`, add `import java.util.List;`.

- [ ] **Step 4: Run all VoteController tests**

Run: `./gradlew planningpoker-api:test --tests "com.richashworth.planningpoker.controller.VoteControllerTest"`
Expected: All 5 tests PASS

- [ ] **Step 5: Run full backend test suite**

Run: `./gradlew planningpoker-api:test`
Expected: BUILD SUCCESSFUL, all tests pass

- [ ] **Step 6: Commit**

```bash
git add planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/VoteController.java \
       planningpoker-api/src/test/java/com/richashworth/planningpoker/controller/VoteControllerTest.java
git commit -m "feat: vote validation uses per-session scheme instead of hardcoded set"
```

---

## Task 6: Frontend — Schemes.js and Constants.js

**Files:**
- Create: `planningpoker-web/src/config/Schemes.js`
- Modify: `planningpoker-web/src/config/Constants.js`

- [ ] **Step 1: Create Schemes.js**

```js
export const SCHEMES = {
  fibonacci: {
    label: 'Fibonacci',
    values: ['0', '0.5', '1', '2', '3', '5', '8', '13', '20', '50', '100', '\u221e'],
  },
  tshirt: {
    label: 'T-shirt sizes',
    values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  simple: {
    label: 'Simple (1-5)',
    values: ['1', '2', '3', '4', '5'],
  },
};

export function resolveSchemeValues(schemeType, customValues, includeUnsure, includeCoffee) {
  const base = schemeType === 'custom' ? customValues : SCHEMES[schemeType].values;
  return [
    ...base,
    ...(includeUnsure ? ['?'] : []),
    ...(includeCoffee ? ['\u2615'] : []),
  ];
}
```

- [ ] **Step 2: Update Constants.js**

Remove the `LEGAL_ESTIMATES` line and the `INFINITY_SYMBOL` const. Keep `COFFEE_SYMBOL` and `API_ROOT_URL`:

```js
export const API_ROOT_URL = '';
// export const API_ROOT_URL = 'http://localhost:9000';

export const COFFEE_SYMBOL = '\u2615';
```

- [ ] **Step 3: Run frontend tests to check for breakage**

Run: `cd planningpoker-web && npm test`
Expected: Some failures in tests that import `LEGAL_ESTIMATES` — this is expected, we'll fix them in later tasks.

- [ ] **Step 4: Commit**

```bash
git add planningpoker-web/src/config/Schemes.js planningpoker-web/src/config/Constants.js
git commit -m "feat: add Schemes.js with preset definitions, remove LEGAL_ESTIMATES"
```

---

## Task 7: Redux store and actions

**Files:**
- Modify: `planningpoker-web/src/reducers/reducer_game.js`
- Modify: `planningpoker-web/src/reducers/__tests__/reducer_game.test.js`
- Modify: `planningpoker-web/src/actions/index.js`

- [ ] **Step 1: Update reducer_game.test.js**

Replace the full test file:

```js
import { describe, it, expect } from 'vitest';
import reducer from '../reducer_game';
import { CREATE_GAME, GAME_CREATED, JOIN_GAME, LEAVE_GAME, USER_REGISTERED } from '../../actions';

const initialState = {
  playerName: '', sessionId: '', isAdmin: false, isRegistered: false,
  schemeType: 'fibonacci', customValues: null, includeUnsure: true, includeCoffee: true,
};

describe('game reducer', () => {
  it('returns initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('sets session and scheme on CREATE_GAME', () => {
    const action = {
      type: CREATE_GAME,
      payload: { data: { sessionId: 'abc12345', schemeType: 'tshirt', includeUnsure: true, includeCoffee: false } },
      meta: { userName: 'alice' },
    };
    const state = reducer(initialState, action);
    expect(state.playerName).toBe('alice');
    expect(state.sessionId).toBe('abc12345');
    expect(state.schemeType).toBe('tshirt');
    expect(state.includeCoffee).toBe(false);
  });

  it('sets scheme on JOIN_GAME', () => {
    const action = {
      type: JOIN_GAME,
      payload: { data: { schemeType: 'simple', includeUnsure: false, includeCoffee: true } },
      meta: { userName: 'bob', sessionId: 'xyz98765' },
    };
    const state = reducer(initialState, action);
    expect(state.playerName).toBe('bob');
    expect(state.sessionId).toBe('xyz98765');
    expect(state.schemeType).toBe('simple');
    expect(state.includeUnsure).toBe(false);
  });

  it('sets custom values on JOIN_GAME with custom scheme', () => {
    const action = {
      type: JOIN_GAME,
      payload: { data: { schemeType: 'custom', customValues: ['Low', 'Med', 'High'], includeUnsure: true, includeCoffee: true } },
      meta: { userName: 'carol', sessionId: 'cust1234' },
    };
    const state = reducer(initialState, action);
    expect(state.schemeType).toBe('custom');
    expect(state.customValues).toEqual(['Low', 'Med', 'High']);
  });

  it('sets isAdmin and isRegistered on GAME_CREATED', () => {
    const state = reducer(initialState, { type: GAME_CREATED });
    expect(state.isAdmin).toBe(true);
    expect(state.isRegistered).toBe(true);
  });

  it('sets isRegistered on USER_REGISTERED', () => {
    const state = reducer(initialState, { type: USER_REGISTERED });
    expect(state.isRegistered).toBe(true);
  });

  it('resets to initial state on LEAVE_GAME', () => {
    const active = {
      ...initialState,
      playerName: 'alice',
      sessionId: 'abc12345',
      isAdmin: true,
      isRegistered: true,
      schemeType: 'tshirt',
    };
    expect(reducer(active, { type: LEAVE_GAME })).toEqual(initialState);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd planningpoker-web && npm test`
Expected: Failures — reducer doesn't handle scheme fields yet

- [ ] **Step 3: Update reducer_game.js**

```js
import {CREATE_GAME, GAME_CREATED, JOIN_GAME, LEAVE_GAME, USER_REGISTERED} from '../actions'

const initialGameState = {
  playerName: '',
  sessionId: '',
  isAdmin: false,
  isRegistered: false,
  schemeType: 'fibonacci',
  customValues: null,
  includeUnsure: true,
  includeCoffee: true,
};

export default function (state = initialGameState, action) {
  switch (action.type) {
    case CREATE_GAME: {
      const d = action.payload.data;
      return {
        ...state,
        playerName: action.meta.userName,
        sessionId: d.sessionId,
        schemeType: d.schemeType,
        customValues: d.customValues || null,
        includeUnsure: d.includeUnsure,
        includeCoffee: d.includeCoffee,
      };
    }
    case GAME_CREATED:
      return {...state, isAdmin: true, isRegistered: true};
    case USER_REGISTERED:
      return {...state, isRegistered: true};
    case JOIN_GAME: {
      const d = action.payload.data;
      return {
        ...state,
        playerName: action.meta.userName,
        sessionId: action.meta.sessionId,
        schemeType: d.schemeType,
        customValues: d.customValues || null,
        includeUnsure: d.includeUnsure,
        includeCoffee: d.includeCoffee,
      };
    }
    case LEAVE_GAME:
      return initialGameState;
    default:
      return state
  }
}
```

- [ ] **Step 4: Update actions/index.js**

Update `createGame` to send scheme params. Change the function signature and URLSearchParams:

```js
export function createGame(playerName, schemeType, customValues, includeUnsure, includeCoffee, callback) {
  const params = new URLSearchParams({ userName: playerName, schemeType, includeUnsure, includeCoffee });
  if (schemeType === 'custom' && customValues) {
    params.set('customValues', customValues);
  }
  const request = axios.post(`${API_ROOT_URL}/createSession`, params);
  request.then(() => callback()).catch(err => {
    const msg = err.response?.data?.error || 'Failed to create session';
    alert(msg);
  });

  return {
    type: CREATE_GAME,
    payload: request,
    meta: {userName: playerName}
  };
}
```

No changes needed to `joinGame` — it already sends `sessionId` and `userName`. The response is now JSON with scheme data, which axios puts in `response.data` automatically. The reducer reads `action.payload.data` which maps to the response body.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd planningpoker-web && npm test`
Expected: All game reducer tests PASS. Some other tests may fail due to `LEGAL_ESTIMATES` removal — that's fixed in the next tasks.

- [ ] **Step 6: Commit**

```bash
git add planningpoker-web/src/reducers/reducer_game.js \
       planningpoker-web/src/reducers/__tests__/reducer_game.test.js \
       planningpoker-web/src/actions/index.js
git commit -m "feat: Redux store and actions support estimation scheme config"
```

---

## Task 8: CreateGame.jsx — scheme selector UI

**Files:**
- Modify: `planningpoker-web/src/pages/CreateGame.jsx`

- [ ] **Step 1: Update CreateGame.jsx**

```jsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { createGame, gameCreated } from '../actions';
import { SCHEMES } from '../config/Schemes';
import NameInput from '../components/NameInput';

export default function CreateGame() {
  const [playerName, setPlayerName] = useState('');
  const [schemeType, setSchemeType] = useState('fibonacci');
  const [customInput, setCustomInput] = useState('');
  const [includeUnsure, setIncludeUnsure] = useState(true);
  const [includeCoffee, setIncludeCoffee] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const customError = schemeType === 'custom' ? validateCustomInput(customInput) : null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const nameRegex = /^[a-zA-Z0-9 _-]{3,20}$/;
    if (!nameRegex.test(playerName)) return;
    if (schemeType === 'custom' && customError) return;
    const customValues = schemeType === 'custom' ? customInput : null;
    dispatch(createGame(playerName, schemeType, customValues, includeUnsure, includeCoffee, () => {
      dispatch(gameCreated());
      navigate('/game');
    }));
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
      <Card sx={{ maxWidth: 480, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
            Host a Game
          </Typography>
          <form onSubmit={handleSubmit}>
            <NameInput
              playerName={playerName}
              onPlayerNameInputChange={(e) => setPlayerName(e.target.value)}
            />
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Estimation scheme
            </Typography>
            <ToggleButtonGroup
              value={schemeType}
              exclusive
              onChange={(e, val) => val && setSchemeType(val)}
              fullWidth
              size="small"
              sx={{ mb: 2 }}
            >
              {Object.entries(SCHEMES).map(([key, { label }]) => (
                <ToggleButton key={key} value={key}>{label}</ToggleButton>
              ))}
              <ToggleButton value="custom">Custom</ToggleButton>
            </ToggleButtonGroup>
            {schemeType === 'custom' && (
              <TextField
                label="Custom values (comma-separated)"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                error={!!customError}
                helperText={customError || '2-20 values, max 10 chars each'}
                fullWidth
                sx={{ mb: 2 }}
              />
            )}
            <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
              <FormControlLabel
                control={<Switch checked={includeUnsure} onChange={(e) => setIncludeUnsure(e.target.checked)} size="small" />}
                label="? card"
              />
              <FormControlLabel
                control={<Switch checked={includeCoffee} onChange={(e) => setIncludeCoffee(e.target.checked)} size="small" />}
                label="Coffee card"
              />
            </Box>
            <Button type="submit" variant="contained" fullWidth size="large" disableElevation>
              Start Game
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

function validateCustomInput(input) {
  if (!input.trim()) return 'Enter at least 2 values';
  const values = input.split(',').map(s => s.trim()).filter(Boolean);
  const unique = [...new Set(values)];
  if (unique.length < 2) return 'Enter at least 2 values';
  if (unique.length > 20) return 'Maximum 20 values';
  const tooLong = unique.find(v => v.length > 10);
  if (tooLong) return `"${tooLong}" exceeds 10 characters`;
  return null;
}
```

- [ ] **Step 2: Run frontend tests**

Run: `cd planningpoker-web && npm test`
Expected: PASS (CreateGame has no unit tests — its behavior is covered by e2e)

- [ ] **Step 3: Commit**

```bash
git add planningpoker-web/src/pages/CreateGame.jsx
git commit -m "feat: scheme selector UI on Create Game page"
```

---

## Task 9: Vote.jsx and ResultsChart.jsx — dynamic scheme rendering

**Files:**
- Modify: `planningpoker-web/src/containers/Vote.jsx`
- Modify: `planningpoker-web/src/containers/ResultsChart.jsx`

- [ ] **Step 1: Update Vote.jsx**

Replace the `LEGAL_ESTIMATES` and `COFFEE_SYMBOL` imports and the `allValues` computation:

```jsx
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { vote } from '../actions';
import UsersTable from './UsersTable';
import { resolveSchemeValues } from '../config/Schemes';
import { COFFEE_SYMBOL } from '../config/Constants';
```

Replace the `allValues` line inside the component:

```js
const { schemeType, customValues, includeUnsure, includeCoffee } = useSelector(state => state.game);
const allValues = resolveSchemeValues(schemeType, customValues, includeUnsure, includeCoffee);
```

Update the `COFFEE_SYMBOL` check in the JSX — change `val === COFFEE_SYMBOL` to keep the larger font for the coffee emoji:

```jsx
...(val === COFFEE_SYMBOL && { fontSize: '1.5rem' }),
```

This line remains unchanged since `COFFEE_SYMBOL` is still imported from Constants.

- [ ] **Step 2: Update ResultsChart.jsx**

Replace the import and chart data computation:

```jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { resolveSchemeValues } from '../config/Schemes';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function ResultsChart() {
  const results = useSelector(state => state.results);
  const { schemeType, customValues, includeUnsure, includeCoffee } = useSelector(state => state.game);
  const theme = useTheme();

  const schemeValues = resolveSchemeValues(schemeType, customValues, includeUnsure, includeCoffee);
  const estimates = results.map(x => x.estimateValue);
  const aggregateData = schemeValues.map(x => estimates.filter(y => y === x).length);
```

Replace the `labels` and `data` references later in the file:

```js
  const data = {
    labels: schemeValues,
    datasets: [{
```

Everything else in ResultsChart stays the same.

- [ ] **Step 3: Run frontend tests**

Run: `cd planningpoker-web && npm test`
Expected: All 25 tests PASS

- [ ] **Step 4: Commit**

```bash
git add planningpoker-web/src/containers/Vote.jsx \
       planningpoker-web/src/containers/ResultsChart.jsx
git commit -m "feat: Vote and ResultsChart use per-session scheme values"
```

---

## Task 10: E2e tests

**Files:**
- Modify: `planningpoker-web/tests/planning-poker.spec.js`

- [ ] **Step 1: Add e2e tests for scheme selection**

Add a new `test.describe` block after the existing tests:

```js
test.describe('Estimation Schemes', () => {
  test('host creates game with T-shirt scheme', async ({ page }) => {
    await page.goto('/host');
    await page.getByLabel('Name').fill('Alice');
    await page.getByRole('button', { name: 'T-shirt sizes' }).click();
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page).toHaveURL('/game');
    await expect(page.getByRole('button', { name: 'Vote XS' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Vote XL' })).toBeVisible();
    // Fibonacci values should not appear
    await expect(page.getByRole('button', { name: 'Vote 13' })).not.toBeVisible();
  });

  test('host creates game with custom values', async ({ page }) => {
    await page.goto('/host');
    await page.getByLabel('Name').fill('Alice');
    await page.getByRole('button', { name: 'Custom' }).click();
    await page.getByLabel('Custom values (comma-separated)').fill('Low,Med,High');
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page).toHaveURL('/game');
    await expect(page.getByRole('button', { name: 'Vote Low' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Vote High' })).toBeVisible();
  });

  test('host toggles off unsure card', async ({ page }) => {
    await page.goto('/host');
    await page.getByLabel('Name').fill('Alice');
    await page.getByText('? card').click();
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page).toHaveURL('/game');
    await expect(page.getByRole('button', { name: 'Vote ?' })).not.toBeVisible();
  });

  test('joiner sees host scheme', async ({ page, context }) => {
    // Host creates a T-shirt game
    await page.goto('/host');
    await page.getByLabel('Name').fill('Host');
    await page.getByRole('button', { name: 'T-shirt sizes' }).click();
    await page.getByRole('button', { name: 'Start Game' }).click();
    await expect(page).toHaveURL('/game');

    // Get session ID from the chip in the header
    const sessionChip = page.locator('.MuiChip-label');
    const sessionId = await sessionChip.textContent();

    // Joiner opens a new page and joins
    const joiner = await context.newPage();
    await joiner.goto('/join');
    await joiner.getByLabel('Name').fill('Joiner');
    await joiner.getByLabel('Session ID').fill(sessionId);
    await joiner.getByRole('button', { name: 'Join Game' }).click();
    await expect(joiner).toHaveURL('/game');
    await expect(joiner.getByRole('button', { name: 'Vote XS' })).toBeVisible();
    await expect(joiner.getByRole('button', { name: 'Vote 13' })).not.toBeVisible();
  });
});
```

- [ ] **Step 2: Run e2e tests**

Run: `cd planningpoker-web && npx playwright test`
(Requires backend running on port 9000)
Expected: All tests PASS including the 4 new scheme tests

- [ ] **Step 3: Commit**

```bash
git add planningpoker-web/tests/planning-poker.spec.js
git commit -m "test: add e2e tests for estimation scheme selection"
```

---

## Task 11: Final verification

- [ ] **Step 1: Run full backend test suite**

Run: `./gradlew planningpoker-api:test`
Expected: BUILD SUCCESSFUL, all tests pass

- [ ] **Step 2: Run full frontend unit tests**

Run: `cd planningpoker-web && npm test`
Expected: All tests pass

- [ ] **Step 3: Run full e2e test suite**

Run: `cd planningpoker-web && npx playwright test`
Expected: All tests pass

- [ ] **Step 4: Manual smoke test**

1. Start backend: `./gradlew planningpoker-api:bootRun`
2. Start frontend: `cd planningpoker-web && npm run dev`
3. Open http://localhost:3000
4. Create a game with T-shirt scheme — verify XS/S/M/L/XL/XXL cards appear
5. Create a game with Custom values "Low,Med,High" — verify those cards appear
6. Toggle off ? card — verify it disappears
7. Have a second browser tab join the session — verify same cards appear
8. Vote and verify results display correctly
