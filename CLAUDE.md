# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Test Commands

```bash
# Full build (frontend + backend + tests)
cd planningpoker-web && npm ci && npm run build && cd ..
./gradlew planningpoker-web:jar planningpoker-api:build

# Backend only (build + tests) — requires frontend JAR
./gradlew planningpoker-api:build

# Run backend tests only
./gradlew planningpoker-api:test

# Run a single test class
./gradlew planningpoker-api:test --tests "com.richashworth.planningpoker.controller.GameControllerTest"

# Run Playwright e2e tests (requires backend running on port 9000)
cd planningpoker-web && npx playwright test

# Build the deployable boot jar
cd planningpoker-web && npm run build && cd ..
./gradlew planningpoker-web:jar
./gradlew planningpoker-api:bootJar
```

**Important:** The `planningpoker-web:jar` and `planningpoker-api:bootJar` must run as separate Gradle invocations (not combined in one command). The API depends on the web JAR via `flatDir`, and combining them in a single invocation causes a dependency resolution race.

## Running Locally

**Backend** (port 9000): `./gradlew planningpoker-api:bootRun`

**Frontend dev server** (port 3000, proxies API to 9000):
```bash
cd planningpoker-web && npm install && npm run dev
```

**Single-service mode** (boot jar serves both frontend and API):
```bash
cd planningpoker-web && npm run build && cd ..
./gradlew planningpoker-web:jar
./gradlew planningpoker-api:bootJar
java -jar planningpoker-api/build/libs/planningpoker-api-*.jar
```

## Architecture

Two-module Gradle project: `planningpoker-web` (React 18 frontend) and `planningpoker-api` (Spring Boot 3.4 backend). In production, the frontend is packaged as a JAR containing static files under `META-INF/resources/`, which the API includes as a dependency so Spring Boot serves everything from a single fat JAR.

### Frontend Stack

- **React 18** with functional components and hooks
- **MUI v5** with custom dark/light theme (toggle in header)
- **Redux 4** + react-redux 8 (`useSelector`/`useDispatch`)
- **react-router-dom v6** (`Routes`, `useNavigate`)
- **chart.js 4** + react-chartjs-2 v5 for results bar chart
- **@stomp/stompjs** via custom `useStomp` hook for WebSocket
- **Vite 5** for build/dev server
- Code-split: vendor chunks (react, mui, charts, redux) + lazy-loaded route pages

### Frontend -> Backend Communication

- **REST** (via axios): `POST /createSession`, `/joinSession`, `/vote`, `/reset`, `/logout`; `GET /sessionUsers`, `/refresh`, `/version`
- **WebSocket** (STOMP over SockJS at `/stomp`): real-time updates pushed to `/topic/results/{sessionId}` and `/topic/users/{sessionId}`

### Backend

- **Spring Boot 3.4** with Java 21
- **State management:** All session state is in-memory (synchronized Guava `ListMultimap`). Session IDs are random 8-char UUID prefixes. A scheduled task (`ClearSessionsTask`) periodically clears all sessions.
- **SPA routing:** `SpaWebConfig` forwards unknown routes to `index.html` so client-side routing works on page refresh.
- **Burst messaging:** When a vote is cast, `MessagingUtils.burstResultsMessages()` sends updated results to all WebSocket subscribers multiple times with increasing delays (10ms, 50ms, 150ms, 500ms, 2s, 5s) via `@Async`.

## Web JAR Packaging Chain

1. `npm run build` outputs to `planningpoker-web/build/`
2. `planningpoker-web:jar` packages `build/` into JAR under `META-INF/resources/`
3. `planningpoker-api` depends on `planningpoker-web:jar` via `flatDir` repo at `../planningpoker-web/dist/libs`
4. `planningpoker-api:compileJava` has explicit `dependsOn ':planningpoker-web:jar'`

**Note:** The web module's `buildDir` is set to `dist` (not `build`), so the JAR output goes to `planningpoker-web/dist/libs/planningpoker-web.jar`. The `build/` directory is the Vite output, not Gradle's build directory.

## Validation Rules

- Usernames: 3-20 chars, alphanumeric + spaces/hyphens/underscores only
- Vote values: server-side whitelist matching `LEGAL_ESTIMATES` in `Constants.js`
- Session membership required for voting, resetting, and logging out
- No authentication — users are identified by name within a session

## Testing

- **Backend unit tests:** JUnit 5 + Mockito, run with `./gradlew planningpoker-api:test`
- **E2E tests:** Playwright (chromium), 15 tests covering welcome, host/join, voting, multi-user flows, dark/light toggle, copy session ID. Run with `cd planningpoker-web && npx playwright test` (requires backend on port 9000)
- **CI:** GitHub Actions runs three jobs on every push to master and every PR: `lint` (ESLint + Prettier check + `spotlessCheck`) → `unit-tests` → `e2e-tests`. Both test jobs require lint to pass.

## Deployment

Deployed to Railway via multi-stage Dockerfile (`node:22-alpine` for frontend build, `eclipse-temurin:21-jdk` for backend build, `eclipse-temurin:21-jre` for runtime). Railway config in `railway.toml`. The app reads `$PORT` env var (defaults to 9000). Health check at `/actuator/health`.

**Automated releases:** semantic-release runs after every green master push. Conventional commit prefixes drive version bumps: `fix:` → patch, `feat:` → minor, `BREAKING CHANGE` footer → major. `chore:`/`docs:`/`test:` commits produce no release. On release, the fat JAR is attached as an asset to the GitHub release and a `v{version}` tag is pushed. Config in `.releaserc.json`.

Live at: https://planning-poker.up.railway.app

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Planning Poker — Estimation Schemes**

A real-time planning poker web app where distributed teams estimate work collaboratively. Currently supports only Fibonacci-style estimates. This milestone adds customizable estimation schemes so hosts can choose the scale that fits their team.

**Core Value:** Hosts can pick an estimation scheme (Fibonacci, T-shirt, Simple, or Custom) when creating a game, and all participants see the correct cards for that session.

### Constraints

- **Tech stack**: Spring Boot 3.4 + Java 21 backend, React 18 + MUI v5 frontend — no new frameworks
- **Backwards compatibility**: Default to Fibonacci so existing flows work unchanged
- **In-memory state**: No database — scheme config stored in SessionManager maps like existing state
- **API evolution**: createSession response changes from string to JSON — frontend must handle both during development
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- JavaScript (ES modules) - Frontend source (`planningpoker-web/src/**/*.js`, `*.jsx`)
- Java 21 - Backend source (`planningpoker-api/src/main/java/**/*.java`)
- HTML - SPA entry point (`planningpoker-web/index.html`)
## Runtime
- Node.js 22 (frontend build, dev server, CI)
- JVM 21 via Eclipse Temurin (backend runtime)
- npm (frontend) - `planningpoker-web/package-lock.json` present (lockfile committed)
- Gradle 8.14 (backend/build orchestration) - wrapper at `gradlew`
## Frameworks
- React 18.2 - Frontend UI framework (`planningpoker-web/src/`)
- Spring Boot 3.4.4 - Backend application framework (`planningpoker-api/`)
- MUI v5 (`@mui/material` ^5.15.0) - Component library with custom theme
- `@emotion/react` ^11.11.0 and `@emotion/styled` ^11.11.0 - CSS-in-JS (required by MUI)
- Redux 4.2.1 - Global state store (`planningpoker-web/src/reducers/`)
- react-redux 8.1.0 - React bindings (`useSelector`/`useDispatch`)
- redux-promise 0.6.0 - Middleware for async action payloads
- react-router-dom 6.20 - Client-side routing (`planningpoker-web/src/App.jsx`)
- chart.js 4.4 + react-chartjs-2 5.2 - Results bar chart (`planningpoker-web/src/containers/ResultsChart.jsx`)
- `@stomp/stompjs` 7.0 - STOMP over WebSocket client
- sockjs-client 1.6.1 - SockJS transport fallback
- Both consumed via custom `useStomp` hook at `planningpoker-web/src/hooks/useStomp.js`
- axios 1.7 - REST API calls (`planningpoker-web/src/actions/index.js`)
- Vitest 4.1 - Frontend unit test runner (config in `planningpoker-web/vite.config.js`)
- `@playwright/test` 1.59 - E2E tests (config at `planningpoker-web/playwright.config.js`)
- JUnit 5.11 - Backend unit tests
- Mockito 5.15 - Backend mocking
- Vite 6.4 + `@vitejs/plugin-react` 4.5 - Frontend build and dev server (`planningpoker-web/vite.config.js`)
- Gradle 8.14 - Backend build and packaging (`build.gradle`, `planningpoker-api/build.gradle`)
- JaCoCo - Backend code coverage reporting (configured in `planningpoker-api/build.gradle`)
- Lombok 1.18.36 - Java boilerplate reduction (annotation processor)
- Spring Boot DevTools - Live reload in development
## Key Dependencies
- `com.google.guava:guava:33.4.0-jre` - Synchronized `ListMultimap` used for all session/user/estimate storage in `planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java`
- `org.apache.commons:commons-lang3:3.17.0` - Utility methods (backend)
- `org.springframework.boot:spring-boot-starter-websocket` - STOMP WebSocket broker
- `org.springframework.boot:spring-boot-starter-actuator` - Health check endpoint at `/actuator/health`
- `lodash` 4.17.21 - Frontend utility functions
- `spring-boot-starter-web` - Spring MVC REST controllers
- `spring-messaging` - STOMP message broker integration
## Configuration
- Backend port configured via `$PORT` env var (defaults to 9000); set in `planningpoker-api/src/main/resources/application.properties`
- CORS allowed origins configurable via `app.cors.allowed-origins` property (defaults to `*`)
- No `.env` files present; Railway injects `$PORT` at runtime
- `planningpoker-web/vite.config.js` - Vite build config: outDir `build/`, manual chunk splitting (vendor/mui/redux/charts), dev proxy rules to backend port 9000
- `planningpoker-web/build.gradle` - Packages `build/` into JAR under `META-INF/resources/`
- `planningpoker-api/build.gradle` - Spring Boot fat JAR; depends on web JAR via `flatDir` at `../planningpoker-web/dist/libs`
- `build.gradle` (root) - Sets Gradle 8.14 wrapper, Java 21 release target for all projects
- `planningpoker-api/src/main/resources/application.properties` - WebSocket message size limits, actuator exposure, logging levels
## Platform Requirements
- Node.js 22+
- JDK 21 (Eclipse Temurin recommended)
- Backend on port 9000; frontend dev server on port 3000 (proxies API calls to 9000)
- Deployed as single fat JAR: `planningpoker-api/build/libs/planningpoker-*.jar`
- Docker: multi-stage build (`node:22-alpine` for frontend, `eclipse-temurin:21-jdk` for backend build, `eclipse-temurin:21-jre` for runtime)
- Health check: `GET /actuator/health`
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- React components: PascalCase `.jsx` (e.g., `PlayGame.jsx`, `GamePane.jsx`, `NameInput.jsx`)
- Hooks: camelCase prefixed with `use`, `.js` extension (e.g., `useStomp.js`)
- Redux reducers: `reducer_<domain>.js` snake_case (e.g., `reducer_game.js`, `reducer_results.js`)
- Redux action index: `actions/index.js` (single barrel file)
- Config: `Constants.js` PascalCase
- Theme: `theme.js` lowercase
- Java classes: PascalCase matching Spring conventions (e.g., `GameController`, `SessionManager`, `MessagingUtils`)
- Java test classes: `<ClassName>Test` suffix (e.g., `GameControllerTest`)
- Java packages: lowercase, domain-structured (`com.richashworth.planningpoker.controller`)
- Frontend: camelCase for handlers prefixed by verb (e.g., `handleSubmit`, `handleLogout`, `handleCopy`, `handleThemeToggle`)
- Action creators: camelCase verbs (e.g., `createGame`, `joinGame`, `leaveGame`, `resultsUpdated`)
- Java methods: camelCase verbs (e.g., `createSession`, `registerUser`, `isSessionActive`, `validateUserName`)
- Java test methods: `test<MethodName>` prefix (e.g., `testJoinSession`, `testCreateSession`)
- Frontend: camelCase throughout
- Redux action type constants: `UPPER_SNAKE_CASE` strings (e.g., `'create-game'`, but constant names are `CREATE_GAME`)
- Java: camelCase for locals/fields; `UPPER_SNAKE_CASE` for static constants (e.g., `MAX_USERNAME_LENGTH`, `USERNAME_PATTERN`)
- No TypeScript — project is plain JavaScript (.jsx/.js) for frontend
- Java uses standard class/interface naming
## Code Style
- ESLint 8 configured in `planningpoker-web/.eslintrc.cjs` (react, react-hooks, prettier extends)
- Prettier configured in `planningpoker-web/.prettierrc`
- `eslint-disable-next-line` comments used inline where needed (e.g., `// eslint-disable-next-line no-underscore-dangle` in `src/App.jsx`)
- Java style follows standard IntelliJ/Google conventions; `.idea/codeStyles` directory present
- Frontend: 2 spaces (observed throughout all .jsx/.js files)
- Java: 4 spaces
- Frontend: single quotes for imports and strings; template literals for interpolation
- JSX attributes use double quotes
- Frontend: omitted (no semicolons at end of statements in .jsx files)
## Import Organization
- None — all imports use relative paths (`../`, `./`)
- Project classes first, then third-party (Guava, SLF4J), then JDK classes
## React Component Patterns
- Global state: Redux (`useSelector`/`useDispatch`) for session, game state, results, users, voted flag
- Local state: `useState` for UI-only state (form inputs, menu anchor, copied flag, selected card)
- Layout via `Box` with `sx` prop — inline style system, not CSS files or `makeStyles`
- No separate style files; all styles in `sx` prop or `theme.js`
- Component variants: `variant="contained"` for primary, `variant="outlined"` for secondary buttons
- Theme customization centralized in `src/theme.js` — shared config object spread into dark/light variants
## Redux Patterns
- All actions: `{ type, payload, meta }` — redux-promise middleware resolves promise payloads
- Event actions (no async): `{ type }` only (e.g., `gameCreated()`, `userRegistered()`)
- Async actions: payload is an axios Promise; `meta` carries local data not in the response
## Error Handling
- HTTP errors in action creators: `err.response?.data?.error || 'Fallback message'` then `alert(msg)` for user-facing errors
- Non-critical errors logged with `console.error` (e.g., leave session failure)
- No global error boundary
- Domain validation throws `IllegalArgumentException` with descriptive messages
- `ErrorHandler.java` (`@ControllerAdvice`) catches:
- Controllers do not catch exceptions — they propagate to `ErrorHandler`
- SLF4J + Logback used for all server-side logging; `logger.info(...)` for business events, `logger.error(...)` for unexpected errors
## Logging
## Comments
- Inline explanatory comments for non-obvious logic (e.g., `// Fallback: if we voted but no WS results arrive within 8s...`)
- `eslint-disable` inline comments when rule suppression is required
- Commented-out code left in place for configuration alternatives (e.g., `// export const API_ROOT_URL = 'http://localhost:9000'`)
## Function Design
## Module Design
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- React SPA communicates with Spring Boot API via REST (mutations) and STOMP/WebSocket (real-time state updates)
- All backend state is held in-memory (no database); sessions are ephemeral
- In production, the frontend is embedded inside the Spring Boot fat JAR and served as static files
## Layers
- Purpose: Top-level page components, one per route
- Location: `planningpoker-web/src/pages/`
- Contains: `Welcome.jsx`, `CreateGame.jsx`, `JoinGame.jsx`, `PlayGame.jsx`
- Depends on: containers, Redux store, actions, `useStomp` hook
- Used by: React Router in `planningpoker-web/src/App.jsx`
- Purpose: Redux-connected components that read state and dispatch actions
- Location: `planningpoker-web/src/containers/`
- Contains: `Header.jsx`, `GamePane.jsx`, `Vote.jsx`, `Results.jsx`, `UsersTable.jsx`
- Depends on: Redux store (`useSelector`, `useDispatch`), actions
- Used by: Pages
- Purpose: Presentational components with no Redux coupling
- Location: `planningpoker-web/src/components/`
- Contains: `Footer.jsx`, `NameInput.jsx`, `ResultsChart.jsx`, `ResultsTable.jsx`
- Depends on: Props only
- Used by: Containers
- Purpose: Client-side application state
- Location: `planningpoker-web/src/reducers/`
- Contains: `reducer_game.js` (session/player identity), `reducer_results.js` (vote results), `reducer_users.js` (session participant list), `reducer_vote.js` (voted flag)
- Depends on: action constants from `planningpoker-web/src/actions/index.js`
- Used by: All containers via `useSelector`
- Purpose: Redux action creators; REST calls are initiated here using axios
- Location: `planningpoker-web/src/actions/index.js`
- Contains: `createGame`, `joinGame`, `leaveGame`, `vote`, `resetSession`, plus event creators `resultsUpdated`, `usersUpdated`
- Depends on: axios, `API_ROOT_URL` from `planningpoker-web/src/config/Constants.js`
- Used by: Containers and pages that dispatch actions
- Purpose: REST endpoint handlers; validate input, delegate to service, trigger WebSocket push
- Location: `planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/`
- Contains: `GameController.java` (session lifecycle + user management), `VoteController.java` (vote submission), `AppController.java` (version endpoint), `ErrorHandler.java` (global exception handling)
- Depends on: `SessionManager`, `MessagingUtils`
- Used by: Spring MVC dispatcher
- Purpose: Single stateful service holding all in-memory session data
- Location: `planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java`
- Contains: Thread-safe maps for active sessions, session-to-users, session-to-estimates, last-activity timestamps
- Depends on: Guava `ListMultimap`, Java `ConcurrentHashMap`
- Used by: All controllers, `MessagingUtils`, `ClearSessionsTask`
- Purpose: Push updated state to all subscribers after mutations
- Location: `planningpoker-api/src/main/java/com/richashworth/planningpoker/util/MessagingUtils.java`
- Contains: `burstResultsMessages()`, `burstUsersMessages()` — each sends the same message at increasing delays (10ms, 50ms, 150ms, 500ms, 2s, 5s) to compensate for eventual-consistency lag
- Depends on: `SimpMessagingTemplate`, `SessionManager`, `Clock`
- Used by: All controllers after state mutations
- Purpose: Spring configuration classes
- Location: `planningpoker-api/src/main/java/com/richashworth/planningpoker/config/`
- Contains: `WebSocketConfig.java` (STOMP endpoint at `/stomp`, topic prefix `/topic`), `SpaWebConfig.java` (SPA fallback to `index.html`), `AsyncConfig.java` (thread pool for `@Async` burst messaging), `CorsConfig.java`
- Purpose: Background maintenance of session state
- Location: `planningpoker-api/src/main/java/com/richashworth/planningpoker/tasks/ClearSessionsTask.java`
- Contains: Weekly full clear (`0 0 0 * * Sun`), 5-minute idle eviction (sessions inactive > 24h)
- Depends on: `SessionManager`
## Data Flow
## Key Abstractions
- Purpose: Single source of truth for all server-side session state
- Location: `planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java`
- Pattern: Singleton Spring component with synchronized data structures; no persistence layer
- Purpose: Reliable delivery of state updates over WebSocket despite network variability
- Location: `planningpoker-api/src/main/java/com/richashworth/planningpoker/util/MessagingUtils.java`
- Pattern: `@Async` method sends the same payload 6 times with increasing delays via `Clock.LATENCIES`
- Purpose: Manages STOMP/SockJS lifecycle (connect, subscribe, reconnect, disconnect)
- Location: `planningpoker-web/src/hooks/useStomp.js`
- Pattern: Custom React hook; returns `{ connected }` boolean for UI feedback; auto-reconnects every 3s
```js
```
- Purpose: Theme toggle shared between `App.jsx` and `Header.jsx`
- Location: `planningpoker-web/src/App.jsx` (exported as `useColorMode()`)
- Pattern: React Context with localStorage persistence under key `pp-theme`
## Entry Points
- Location: `planningpoker-web/src/index.jsx`
- Triggers: Browser loads `index.html`; Vite injects `index.jsx` as module entry
- Responsibilities: Mounts `<App />` into `#root` DOM element
- Location: `planningpoker-api/src/main/java/com/richashworth/planningpoker/PlanningPokerApplication.java` (Spring Boot main)
- Triggers: JVM startup
- Responsibilities: Bootstraps Spring context, starts embedded Tomcat on `$PORT` (default 9000)
- `/` → `Welcome.jsx` (landing page with host/join CTAs)
- `/host` → `CreateGame.jsx` (username input, creates session)
- `/join` → `JoinGame.jsx` (username + session ID input, joins session)
- `/game` → `PlayGame.jsx` (voting and results view; redirects to `/` if not registered)
## Error Handling
- Backend: `@ControllerAdvice` in `planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/ErrorHandler.java` handles `IllegalArgumentException` → 400, all others → 500
- Frontend: axios `.catch()` in action creators; optimistic updates in `reducer_results.js` guard against `action.error`
- WebSocket: `useStomp` sets `connected: false` on disconnect, triggering a "Reconnecting..." banner in `GamePane.jsx`
- Fallback: If WebSocket results don't arrive within 8s after a vote, `PlayGame.jsx` calls `GET /refresh` to trigger a re-broadcast
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
