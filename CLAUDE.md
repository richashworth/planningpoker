# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Test Commands

```bash
# Full build (frontend + backend + tests)
./gradlew

# Backend only (build + tests)
./gradlew planningpoker-api:build

# Run tests
./gradlew planningpoker-api:test

# Run a single test class
./gradlew planningpoker-api:test --tests "com.richashworth.planningpoker.controller.GameControllerTest"

# Build the deployable boot jar (requires frontend build first)
cd planningpoker-web && npm run build && cd ..
./gradlew planningpoker-web:jar planningpoker-api:bootJar
```

## Running Locally

**Backend** (port 9000): `./gradlew planningpoker-api:bootRun`

**Frontend dev server** (port 3000, proxies API to 9000):
```bash
cd planningpoker-web && npm install && npm run dev
```

**Single-service mode** (boot jar serves both frontend and API):
```bash
cd planningpoker-web && npm run build && cd ..
./gradlew planningpoker-web:jar planningpoker-api:bootJar
java -jar planningpoker-api/build/libs/planningpoker-api-*.jar
```

## Architecture

This is a two-module Gradle project: `planningpoker-web` (React frontend) and `planningpoker-api` (Spring Boot backend). In production, the frontend is packaged as a JAR containing static files under `META-INF/resources/`, which the API includes as a dependency so Spring Boot serves everything from a single fat JAR.

**Frontend -> Backend communication:**
- **REST** (via axios): `POST /createSession`, `/joinSession`, `/vote`, `/reset`, `/logout`; `GET /sessionUsers`, `/refresh`
- **WebSocket** (STOMP over SockJS at `/stomp`): real-time updates pushed to `/topic/results/{sessionId}` and `/topic/users/{sessionId}`

**State management:** All session state is in-memory (synchronized Guava `ListMultimap`). Session IDs are random 8-char UUID prefixes. A scheduled task (`ClearSessionsTask`) periodically clears all sessions.

**Key backend flow:** When a vote is cast, `MessagingUtils.burstResultsMessages()` sends the updated results to all WebSocket subscribers multiple times with increasing delays (10ms, 50ms, 150ms, 500ms, 2s, 5s) via `@Async` to ensure delivery.

## Web JAR Packaging Chain

1. `npm run build` outputs to `planningpoker-web/build/`
2. `planningpoker-web:jar` packages `build/` into JAR under `META-INF/resources/`
3. `planningpoker-api` depends on `planningpoker-web:jar` via `flatDir` repo at `../planningpoker-web/dist/libs`
4. `planningpoker-api:compileJava` has explicit `dependsOn ':planningpoker-web:jar'`

## Validation Rules

- Usernames: 3-20 chars, alphanumeric + spaces/hyphens/underscores only
- Vote values: server-side whitelist matching `LEGAL_ESTIMATES` in `Constants.js`
- Session membership required for voting, resetting, and logging out
- No authentication — users are identified by name within a session

## Deployment

Deployed to Railway via multi-stage Dockerfile. The app reads `$PORT` env var (defaults to 9000). Health check at `/actuator/health`.
