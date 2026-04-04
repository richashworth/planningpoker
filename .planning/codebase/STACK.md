# Technology Stack

**Analysis Date:** 2026-04-04

## Languages

**Primary:**
- JavaScript (ES modules) - Frontend source (`planningpoker-web/src/**/*.js`, `*.jsx`)
- Java 21 - Backend source (`planningpoker-api/src/main/java/**/*.java`)

**Secondary:**
- HTML - SPA entry point (`planningpoker-web/index.html`)

## Runtime

**Environment:**
- Node.js 22 (frontend build, dev server, CI)
- JVM 21 via Eclipse Temurin (backend runtime)

**Package Manager:**
- npm (frontend) - `planningpoker-web/package-lock.json` present (lockfile committed)
- Gradle 8.14 (backend/build orchestration) - wrapper at `gradlew`

## Frameworks

**Core:**
- React 18.2 - Frontend UI framework (`planningpoker-web/src/`)
- Spring Boot 3.4.4 - Backend application framework (`planningpoker-api/`)

**UI Component Library:**
- MUI v5 (`@mui/material` ^5.15.0) - Component library with custom theme
- `@emotion/react` ^11.11.0 and `@emotion/styled` ^11.11.0 - CSS-in-JS (required by MUI)

**State Management:**
- Redux 4.2.1 - Global state store (`planningpoker-web/src/reducers/`)
- react-redux 8.1.0 - React bindings (`useSelector`/`useDispatch`)
- redux-promise 0.6.0 - Middleware for async action payloads

**Routing:**
- react-router-dom 6.20 - Client-side routing (`planningpoker-web/src/App.jsx`)

**Charts:**
- chart.js 4.4 + react-chartjs-2 5.2 - Results bar chart (`planningpoker-web/src/containers/ResultsChart.jsx`)

**WebSocket:**
- `@stomp/stompjs` 7.0 - STOMP over WebSocket client
- sockjs-client 1.6.1 - SockJS transport fallback
- Both consumed via custom `useStomp` hook at `planningpoker-web/src/hooks/useStomp.js`

**HTTP Client:**
- axios 1.7 - REST API calls (`planningpoker-web/src/actions/index.js`)

**Testing:**
- Vitest 4.1 - Frontend unit test runner (config in `planningpoker-web/vite.config.js`)
- `@playwright/test` 1.59 - E2E tests (config at `planningpoker-web/playwright.config.js`)
- JUnit 5.11 - Backend unit tests
- Mockito 5.15 - Backend mocking

**Build/Dev:**
- Vite 6.4 + `@vitejs/plugin-react` 4.5 - Frontend build and dev server (`planningpoker-web/vite.config.js`)
- Gradle 8.14 - Backend build and packaging (`build.gradle`, `planningpoker-api/build.gradle`)
- JaCoCo - Backend code coverage reporting (configured in `planningpoker-api/build.gradle`)
- Lombok 1.18.36 - Java boilerplate reduction (annotation processor)
- Spring Boot DevTools - Live reload in development

## Key Dependencies

**Critical:**
- `com.google.guava:guava:33.4.0-jre` - Synchronized `ListMultimap` used for all session/user/estimate storage in `planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java`
- `org.apache.commons:commons-lang3:3.17.0` - Utility methods (backend)
- `org.springframework.boot:spring-boot-starter-websocket` - STOMP WebSocket broker
- `org.springframework.boot:spring-boot-starter-actuator` - Health check endpoint at `/actuator/health`
- `lodash` 4.17.21 - Frontend utility functions

**Infrastructure:**
- `spring-boot-starter-web` - Spring MVC REST controllers
- `spring-messaging` - STOMP message broker integration

## Configuration

**Environment:**
- Backend port configured via `$PORT` env var (defaults to 9000); set in `planningpoker-api/src/main/resources/application.properties`
- CORS allowed origins configurable via `app.cors.allowed-origins` property (defaults to `*`)
- No `.env` files present; Railway injects `$PORT` at runtime

**Build:**
- `planningpoker-web/vite.config.js` - Vite build config: outDir `build/`, manual chunk splitting (vendor/mui/redux/charts), dev proxy rules to backend port 9000
- `planningpoker-web/build.gradle` - Packages `build/` into JAR under `META-INF/resources/`
- `planningpoker-api/build.gradle` - Spring Boot fat JAR; depends on web JAR via `flatDir` at `../planningpoker-web/dist/libs`
- `build.gradle` (root) - Sets Gradle 8.14 wrapper, Java 21 release target for all projects
- `planningpoker-api/src/main/resources/application.properties` - WebSocket message size limits, actuator exposure, logging levels

## Platform Requirements

**Development:**
- Node.js 22+
- JDK 21 (Eclipse Temurin recommended)
- Backend on port 9000; frontend dev server on port 3000 (proxies API calls to 9000)

**Production:**
- Deployed as single fat JAR: `planningpoker-api/build/libs/planningpoker-*.jar`
- Docker: multi-stage build (`node:22-alpine` for frontend, `eclipse-temurin:21-jdk` for backend build, `eclipse-temurin:21-jre` for runtime)
- Health check: `GET /actuator/health`

---

*Stack analysis: 2026-04-04*
