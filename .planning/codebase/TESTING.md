# Testing Patterns

**Analysis Date:** 2026-04-04

## Test Frameworks

### Frontend Unit Tests

**Runner:** Vitest (configured in `planningpoker-web/vite.config.js` under `test` key)
- Version: ^4.1.2 (devDependency in `planningpoker-web/package.json`)
- Config: `planningpoker-web/vite.config.js` — excludes `tests/` dir (Playwright) and `node_modules/`

**Assertion Library:** Vitest built-in `expect` (Jest-compatible)

**Run Commands:**
```bash
cd planningpoker-web && npm test          # Run all unit tests (vitest run)
cd planningpoker-web && npm run test:watch  # Watch mode (vitest)
```

### Frontend E2E Tests

**Runner:** Playwright (Chromium only)
- Version: ^1.59.1
- Config: `planningpoker-web/playwright.config.js`
- Retries: 1; Timeout: 30s per test
- Base URL: `http://localhost:3000`
- Requires backend running on port 9000

**Run Commands:**
```bash
cd planningpoker-web && npx playwright test          # Run all e2e tests
cd planningpoker-web && npx playwright test --ui     # Interactive UI mode
```

### Backend Unit Tests

**Runner:** JUnit 5 (JUnit Jupiter) via Gradle
- JUnit API: `org.junit.jupiter:junit-jupiter-api:5.11.4`
- Mocking: Mockito 5.15.2 with `mockito-junit-jupiter` extension
- Coverage: JaCoCo (configured in `planningpoker-api/build.gradle`)

**Run Commands:**
```bash
./gradlew planningpoker-api:test                                          # Run all backend tests
./gradlew planningpoker-api:test --tests "com.richashworth.planningpoker.controller.GameControllerTest"  # Single class
./gradlew planningpoker-api:jacocoTestReport                             # Generate coverage report
```

## Test File Organization

### Frontend Unit Tests

**Location:** Co-located with source in `__tests__` subdirectory
```
planningpoker-web/src/reducers/__tests__/
├── reducer_game.test.js
├── reducer_results.test.js
├── reducer_users.test.js
└── reducer_vote.test.js
```

**Naming:** `<module-name>.test.js`

**Coverage:** Only Redux reducers have unit tests. Components, hooks, actions, and containers have no unit tests — covered only by Playwright e2e tests.

### Frontend E2E Tests

**Location:** `planningpoker-web/tests/planning-poker.spec.js` (single file)

**Naming:** `<feature>.spec.js`

### Backend Unit Tests

**Location:** Mirror of main source under `planningpoker-api/src/test/java/`
```
planningpoker-api/src/test/java/com/richashworth/planningpoker/
├── common/
│   └── PlanningPokerTestFixture.java      # Shared test data constants
├── controller/
│   ├── AbstractControllerTest.java        # Shared mock setup base class
│   ├── GameControllerTest.java
│   └── VoteControllerTest.java
├── service/
│   └── SessionManagerTest.java
├── tasks/
│   └── ClearSessionsTaskTest.java
├── util/
│   ├── ClockTest.java
│   ├── CollectionUtilsTest.java
│   └── MessagingUtilsTest.java
└── PlanningPokerApplicationTests.java     # Context load smoke test
```

**Naming:** `<ClassName>Test.java` — matches production class name exactly

## Test Structure

### Frontend Reducer Tests

```javascript
import { describe, it, expect } from 'vitest';
import reducer from '../reducer_game';
import { CREATE_GAME, GAME_CREATED, JOIN_GAME, LEAVE_GAME, USER_REGISTERED } from '../../actions';

const initialState = {
  playerName: '', sessionId: '', isAdmin: false, isRegistered: false,
};

describe('game reducer', () => {
  it('returns initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState);
  });

  it('sets playerName and sessionId on CREATE_GAME', () => {
    const action = {
      type: CREATE_GAME,
      payload: { data: 'abc12345' },
      meta: { userName: 'alice' },
    };
    const state = reducer(initialState, action);
    expect(state.playerName).toBe('alice');
    expect(state.sessionId).toBe('abc12345');
  });
});
```

**Patterns:**
- One `describe` block per reducer file
- Each `it` tests a single action type or edge case
- No `beforeEach`/`afterEach` — pure function tests, initial state defined as module-level const
- Test action objects constructed inline with required shape (`type`, `payload`, `meta`)

### Backend Controller Tests

```java
// AbstractControllerTest.java — shared base class
@MockitoSettings(strictness = Strictness.STRICT_STUBS)
public abstract class AbstractControllerTest {
    @Mock
    protected MessagingUtils messagingUtils;
    @Mock
    protected SessionManager sessionManager;
    protected InOrder inOrder;

    @BeforeEach
    void setUp() {
        inOrder = inOrder(sessionManager, messagingUtils);
    }
}

// Concrete test class
class GameControllerTest extends AbstractControllerTest {
    @InjectMocks
    private GameController gameController;

    @Test
    void testCreateSession() {
        when(sessionManager.createSession()).thenReturn(SESSION_ID);
        final String newSessionId = gameController.createSession(USER_NAME);
        assertEquals(SESSION_ID, newSessionId);
        inOrder.verify(sessionManager, times(1)).createSession();
        inOrder.verify(sessionManager, times(1)).registerUser(USER_NAME, SESSION_ID);
        inOrder.verify(messagingUtils, times(1)).burstUsersMessages(SESSION_ID);
        inOrder.verifyNoMoreInteractions();
    }
}
```

**Patterns:**
- Abstract base class for shared mocks; concrete tests extend it
- `@MockitoSettings(strictness = Strictness.STRICT_STUBS)` enforces no unnecessary stubbing
- `InOrder` used to verify call sequence on session/messaging collaborators
- `inOrder.verifyNoMoreInteractions()` used to assert no unexpected calls
- Happy path tests use `inOrder`; error/exception tests use `assertThrows`

### Backend Service Tests (no mocks)

```java
class SessionManagerTest {
    private SessionManager sessionManager;

    @BeforeEach
    void setUp() {
        sessionManager = new SessionManager();
    }

    @Test
    void testGetResultsReturnsDefensiveCopy() {
        final String sessionId = sessionManager.createSession();
        sessionManager.registerEstimate(sessionId, new Estimate("Alice", "5"));
        List<Estimate> results = sessionManager.getResults(sessionId);
        assertThrows(UnsupportedOperationException.class, () -> results.clear());
    }
}
```

**Patterns:**
- `SessionManagerTest` uses no mocks — creates real `SessionManager` in `@BeforeEach`
- Integration-style: tests exercise real state transitions (create → register → query)
- Reflection used where necessary to manipulate private state for time-sensitive tests (e.g., backdating `lastActivity` in `testEvictIdleSessions`)

## Mocking

### Frontend Mocking

No mock library used in frontend unit tests — reducer tests are pure function tests requiring no mocks.

### Backend Mocking

**Framework:** Mockito 5 with JUnit Jupiter extension

**Two activation styles used:**
1. `@MockitoSettings` on abstract base class (controller tests) — annotations only, no `@ExtendWith` required
2. `@ExtendWith(MockitoExtension.class)` on concrete class (util tests like `MessagingUtilsTest`, `ClearSessionsTaskTest`)

**Patterns:**
```java
// Standard mock injection
@Mock
private SessionManager sessionManager;
@InjectMocks
private GameController gameController;

// Spy on real object (ClearSessionsTaskTest)
@Spy
private SessionManager sessionManager;

// Stubbing
when(sessionManager.isSessionActive(SESSION_ID)).thenReturn(true);

// Verification
verify(sessionManager, times(1)).registerUser(USER_NAME, SESSION_ID);
verifyNoMoreInteractions(sessionManager);

// Exception testing
assertThrows(IllegalArgumentException.class, () ->
    gameController.joinSession(SESSION_ID, USER_NAME));
```

**What to mock:** Collaborator services (`SessionManager`, `MessagingUtils`, `SimpMessagingTemplate`, `Clock`) — any dependency injected via constructor

**What NOT to mock:** The class under test; value objects (`Estimate`); collections

**Field injection of non-Spring beans:** `ReflectionTestUtils.setField(obj, "fieldName", mockValue)` used in `MessagingUtilsTest` where `@Autowired` fields need mocks injected manually

## Fixtures and Factories

### Backend Test Fixture

Centralized constants in `planningpoker-api/src/test/java/com/richashworth/planningpoker/common/PlanningPokerTestFixture.java`:

```java
public class PlanningPokerTestFixture {
    public static final String SESSION_ID = "abc12345";
    public static final String ITEM = "A User Story";
    public static final String USER_NAME = "Rich";
    public static final String ESTIMATE_VALUE = "2";
    public static final Estimate ESTIMATE = new Estimate(USER_NAME, ESTIMATE_VALUE);
    public static final List<Estimate> RESULTS = Lists.newArrayList(ESTIMATE);
    public static final List<String> USERS = Lists.newArrayList(USER_NAME);
}
```

Imported as static: `import static com.richashworth.planningpoker.common.PlanningPokerTestFixture.*;`

### E2E Test Helpers

Shared helper functions at the bottom of `planningpoker-web/tests/planning-poker.spec.js`:

```javascript
// Helper to create a session and return the session ID
async function hostGame(page, name) {
  await page.goto('/host');
  await page.getByLabel('Name').fill(name);
  await page.getByRole('button', { name: 'Start Game' }).click();
  await expect(page).toHaveURL('/game');
  return await page.locator('.MuiChip-label').textContent();
}

// Helper to join a session
async function joinGame(page, name, sessionId) {
  await page.goto('/join');
  await page.getByLabel('Name').fill(name);
  await page.getByLabel('Session ID').fill(sessionId);
  await page.getByRole('button', { name: 'Join Game' }).click();
  await expect(page).toHaveURL('/game');
}
```

These helpers are used in multi-user tests that require two browser contexts.

## Coverage

**Frontend:** No coverage requirement enforced; JaCoCo not configured for frontend.

**Backend:** JaCoCo configured in `planningpoker-api/build.gradle`:
```groovy
tasks.named('jacocoTestReport') {
    reports {
        xml.required = true
        html.required = true
    }
}
tasks.named('check') {
    dependsOn tasks.named('jacocoTestReport')
}
```
Coverage report generated automatically on every `./gradlew check`. No minimum threshold enforced.

**View Coverage:**
```bash
./gradlew planningpoker-api:jacocoTestReport
open planningpoker-api/build/reports/jacoco/test/html/index.html
```

## Test Types

**Frontend Unit Tests (Vitest):**
- Scope: Redux reducers only (`planningpoker-web/src/reducers/__tests__/`)
- Pure function tests — no DOM, no rendering
- 4 test files, ~30 tests total

**Backend Unit Tests (JUnit 5 + Mockito):**
- Scope: All layers — controllers, service, tasks, utils
- Controller tests mock all collaborators; service tests use real instances
- 7 test classes; ~40 tests total

**E2E Tests (Playwright):**
- Scope: Full user journeys — welcome, host, join, vote, logout, theme toggle, multi-user flows, copy session ID
- 15 tests in `planningpoker-web/tests/planning-poker.spec.js`
- Single spec file organized with `test.describe` blocks
- Multi-user tests use `browser.newContext()` to simulate independent browser sessions
- Relies on real backend (`http://localhost:9000`) — not mocked

**Load/Performance Tests:**
- Gatling simulations exist at `planningpoker-api/src/gatling/` but are not wired into CI

## Common Patterns

**Async Testing (Playwright):**
```javascript
// Wait for navigation
await expect(page).toHaveURL('/game');

// Wait for element with custom timeout for WebSocket-dependent content
await expect(hostPage.getByText('Results')).toBeVisible({ timeout: 15000 });

// Wait for computed style (theme change)
await page.waitForFunction(
  (expected) => getComputedStyle(document.body).backgroundColor === expected,
  'rgb(18, 18, 18)',
);
```

**Multi-Context Testing (Playwright):**
```javascript
test('two users can join the same session and both vote', async ({ browser }) => {
  const hostCtx = await browser.newContext();
  const hostPage = await hostCtx.newPage();
  // ...
  const playerCtx = await browser.newContext();
  const playerPage = await playerCtx.newPage();
  // ... test cross-user behavior ...
  await hostCtx.close();
  await playerCtx.close();
});
```

**Exception Testing (JUnit 5):**
```java
assertThrows(IllegalArgumentException.class, () ->
    gameController.joinSession(SESSION_ID, USER_NAME));
```

**Defensive Copy Testing (JUnit 5):**
```java
List<Estimate> results = sessionManager.getResults(sessionId);
assertThrows(UnsupportedOperationException.class, () -> results.clear());
```

**Optimistic Update Testing (Vitest):**
```javascript
it('does not add optimistic vote on VOTE error', () => {
  const action = {
    type: VOTE,
    error: true,           // redux-promise sets this on rejection
    payload: new Error('fail'),
    meta: { userName: 'alice', estimateValue: '5' },
  };
  expect(reducer([], action)).toEqual([]);
});
```

## CI Integration

Tests run via GitHub Actions (`.github/workflows/`) on every push to master and every PR:
- Backend tests: `./gradlew planningpoker-api:build` (includes test + JaCoCo)
- E2E tests: Playwright with backend started via `webServer` config in `playwright.config.js`

---

*Testing analysis: 2026-04-04*
