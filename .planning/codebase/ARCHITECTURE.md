# Architecture

**Analysis Date:** 2026-04-04

## Pattern Overview

**Overall:** Two-tier client-server SPA with real-time WebSocket push

**Key Characteristics:**
- React SPA communicates with Spring Boot API via REST (mutations) and STOMP/WebSocket (real-time state updates)
- All backend state is held in-memory (no database); sessions are ephemeral
- In production, the frontend is embedded inside the Spring Boot fat JAR and served as static files

## Layers

**Frontend Pages (Route Level):**
- Purpose: Top-level page components, one per route
- Location: `planningpoker-web/src/pages/`
- Contains: `Welcome.jsx`, `CreateGame.jsx`, `JoinGame.jsx`, `PlayGame.jsx`
- Depends on: containers, Redux store, actions, `useStomp` hook
- Used by: React Router in `planningpoker-web/src/App.jsx`

**Frontend Containers (Smart Components):**
- Purpose: Redux-connected components that read state and dispatch actions
- Location: `planningpoker-web/src/containers/`
- Contains: `Header.jsx`, `GamePane.jsx`, `Vote.jsx`, `Results.jsx`, `UsersTable.jsx`
- Depends on: Redux store (`useSelector`, `useDispatch`), actions
- Used by: Pages

**Frontend Components (Dumb Components):**
- Purpose: Presentational components with no Redux coupling
- Location: `planningpoker-web/src/components/`
- Contains: `Footer.jsx`, `NameInput.jsx`, `ResultsChart.jsx`, `ResultsTable.jsx`
- Depends on: Props only
- Used by: Containers

**Frontend State (Redux):**
- Purpose: Client-side application state
- Location: `planningpoker-web/src/reducers/`
- Contains: `reducer_game.js` (session/player identity), `reducer_results.js` (vote results), `reducer_users.js` (session participant list), `reducer_vote.js` (voted flag)
- Depends on: action constants from `planningpoker-web/src/actions/index.js`
- Used by: All containers via `useSelector`

**Frontend Actions:**
- Purpose: Redux action creators; REST calls are initiated here using axios
- Location: `planningpoker-web/src/actions/index.js`
- Contains: `createGame`, `joinGame`, `leaveGame`, `vote`, `resetSession`, plus event creators `resultsUpdated`, `usersUpdated`
- Depends on: axios, `API_ROOT_URL` from `planningpoker-web/src/config/Constants.js`
- Used by: Containers and pages that dispatch actions

**Backend Controllers:**
- Purpose: REST endpoint handlers; validate input, delegate to service, trigger WebSocket push
- Location: `planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/`
- Contains: `GameController.java` (session lifecycle + user management), `VoteController.java` (vote submission), `AppController.java` (version endpoint), `ErrorHandler.java` (global exception handling)
- Depends on: `SessionManager`, `MessagingUtils`
- Used by: Spring MVC dispatcher

**Backend Service:**
- Purpose: Single stateful service holding all in-memory session data
- Location: `planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java`
- Contains: Thread-safe maps for active sessions, session-to-users, session-to-estimates, last-activity timestamps
- Depends on: Guava `ListMultimap`, Java `ConcurrentHashMap`
- Used by: All controllers, `MessagingUtils`, `ClearSessionsTask`

**Backend WebSocket Messaging:**
- Purpose: Push updated state to all subscribers after mutations
- Location: `planningpoker-api/src/main/java/com/richashworth/planningpoker/util/MessagingUtils.java`
- Contains: `burstResultsMessages()`, `burstUsersMessages()` — each sends the same message at increasing delays (10ms, 50ms, 150ms, 500ms, 2s, 5s) to compensate for eventual-consistency lag
- Depends on: `SimpMessagingTemplate`, `SessionManager`, `Clock`
- Used by: All controllers after state mutations

**Backend Config:**
- Purpose: Spring configuration classes
- Location: `planningpoker-api/src/main/java/com/richashworth/planningpoker/config/`
- Contains: `WebSocketConfig.java` (STOMP endpoint at `/stomp`, topic prefix `/topic`), `SpaWebConfig.java` (SPA fallback to `index.html`), `AsyncConfig.java` (thread pool for `@Async` burst messaging), `CorsConfig.java`

**Backend Scheduled Tasks:**
- Purpose: Background maintenance of session state
- Location: `planningpoker-api/src/main/java/com/richashworth/planningpoker/tasks/ClearSessionsTask.java`
- Contains: Weekly full clear (`0 0 0 * * Sun`), 5-minute idle eviction (sessions inactive > 24h)
- Depends on: `SessionManager`

## Data Flow

**Vote Flow:**

1. User clicks a card in `planningpoker-web/src/containers/Vote.jsx`
2. `vote()` action creator in `planningpoker-web/src/actions/index.js` is dispatched; axios POSTs to `POST /vote`
3. `reducer_results.js` optimistically appends the vote to local state immediately
4. `VoteController.java` validates membership and estimate value, then calls `sessionManager.registerEstimate()`
5. `MessagingUtils.burstResultsMessages()` fires asynchronously, pushing 6 successive STOMP messages to `/topic/results/{sessionId}`
6. All connected clients' `useStomp` hook in `planningpoker-web/src/hooks/useStomp.js` receives messages; `PlayGame.jsx` dispatches `resultsUpdated()` which updates Redux state via `reducer_results.js`

**Session Create Flow:**

1. `CreateGame.jsx` dispatches `createGame(playerName, callback)`
2. axios POSTs to `POST /createSession`; `redux-promise` middleware resolves the promise and updates the store
3. `GameController.createSession()` generates an 8-char UUID prefix, registers user, returns session ID
4. `reducer_game.js` stores `playerName` and `sessionId` in state; `GAME_CREATED` action marks `isAdmin: true, isRegistered: true`
5. Callback navigates to `/game`

**WebSocket Real-Time State:**

1. `PlayGame.jsx` connects `useStomp` to `/topic/results/{sessionId}` and `/topic/users/{sessionId}` on mount
2. Any state change on backend triggers `burstResultsMessages()` or `burstUsersMessages()` via `@Async` thread pool
3. Inbound messages are dispatched as `RESULTS_UPDATED` or `USERS_UPDATED` actions

## Key Abstractions

**SessionManager:**
- Purpose: Single source of truth for all server-side session state
- Location: `planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java`
- Pattern: Singleton Spring component with synchronized data structures; no persistence layer

**MessagingUtils (Burst Messaging):**
- Purpose: Reliable delivery of state updates over WebSocket despite network variability
- Location: `planningpoker-api/src/main/java/com/richashworth/planningpoker/util/MessagingUtils.java`
- Pattern: `@Async` method sends the same payload 6 times with increasing delays via `Clock.LATENCIES`

**useStomp Hook:**
- Purpose: Manages STOMP/SockJS lifecycle (connect, subscribe, reconnect, disconnect)
- Location: `planningpoker-web/src/hooks/useStomp.js`
- Pattern: Custom React hook; returns `{ connected }` boolean for UI feedback; auto-reconnects every 3s

**Redux Store Shape:**
```js
{
  game:    { playerName, sessionId, isAdmin, isRegistered },
  results: [ { userName, estimateValue }, ... ],
  users:   [ "Alice", "Bob", ... ],
  voted:   boolean
}
```

**ColorModeContext:**
- Purpose: Theme toggle shared between `App.jsx` and `Header.jsx`
- Location: `planningpoker-web/src/App.jsx` (exported as `useColorMode()`)
- Pattern: React Context with localStorage persistence under key `pp-theme`

## Entry Points

**Frontend:**
- Location: `planningpoker-web/src/index.jsx`
- Triggers: Browser loads `index.html`; Vite injects `index.jsx` as module entry
- Responsibilities: Mounts `<App />` into `#root` DOM element

**Backend:**
- Location: `planningpoker-api/src/main/java/com/richashworth/planningpoker/PlanningPokerApplication.java` (Spring Boot main)
- Triggers: JVM startup
- Responsibilities: Bootstraps Spring context, starts embedded Tomcat on `$PORT` (default 9000)

**Routes (Frontend):**
- `/` → `Welcome.jsx` (landing page with host/join CTAs)
- `/host` → `CreateGame.jsx` (username input, creates session)
- `/join` → `JoinGame.jsx` (username + session ID input, joins session)
- `/game` → `PlayGame.jsx` (voting and results view; redirects to `/` if not registered)

## Error Handling

**Strategy:** Backend throws `IllegalArgumentException` for validation failures; `ErrorHandler.java` maps these to HTTP 400 with JSON body `{ "error": "..." }`. Frontend action creators read `err.response?.data?.error` and call `alert()`.

**Patterns:**
- Backend: `@ControllerAdvice` in `planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/ErrorHandler.java` handles `IllegalArgumentException` → 400, all others → 500
- Frontend: axios `.catch()` in action creators; optimistic updates in `reducer_results.js` guard against `action.error`
- WebSocket: `useStomp` sets `connected: false` on disconnect, triggering a "Reconnecting..." banner in `GamePane.jsx`
- Fallback: If WebSocket results don't arrive within 8s after a vote, `PlayGame.jsx` calls `GET /refresh` to trigger a re-broadcast

## Cross-Cutting Concerns

**Logging:** SLF4J/Logback; controllers log each user action at INFO, Spring framework at INFO, package `com.richashworth.planningpoker` at DEBUG (configured in `application.properties`)

**Validation:** Username length and pattern enforced in `GameController.java` (3-20 chars, `^[a-zA-Z0-9 _-]+$`); vote values validated against `LEGAL_ESTIMATES` set in `VoteController.java`; matching constant list in frontend at `planningpoker-web/src/config/Constants.js`

**Authentication:** None. Users are identified by name string within a session. Session membership is checked before votes, resets, and logouts but there is no token or cookie.

**Concurrency:** State mutations in controllers are wrapped in `synchronized (sessionManager)` blocks. `SessionManager` uses `Collections.synchronizedSet` and `Multimaps.synchronizedListMultimap`.

---

*Architecture analysis: 2026-04-04*
