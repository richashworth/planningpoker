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
- **CI:** GitHub Actions runs both backend tests and e2e tests on every push to master and every PR

## Deployment

Deployed to Railway via multi-stage Dockerfile (`node:22-alpine` for frontend build, `eclipse-temurin:21-jdk` for backend build, `eclipse-temurin:21-jre` for runtime). Railway config in `railway.toml`. The app reads `$PORT` env var (defaults to 9000). Health check at `/actuator/health`.

Live at: https://planning-poker.up.railway.app
