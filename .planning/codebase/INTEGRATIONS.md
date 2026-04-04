# External Integrations

**Analysis Date:** 2026-04-04

## APIs & External Services

**None.** The application has no third-party API integrations. All functionality is self-contained.

## Data Storage

**Databases:**
- None. All session state is stored in-memory within the JVM process using synchronized Guava `ListMultimap` and `ConcurrentHashMap` structures in `planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java`.
- State is non-persistent: sessions are cleared on restart and by a scheduled eviction task (`planningpoker-api/src/main/java/com/richashworth/planningpoker/tasks/ClearSessionsTask.java`) that evicts sessions idle for more than 24 hours.
- Maximum 100,000 concurrent sessions enforced in `SessionManager`.

**File Storage:**
- Local filesystem only (no cloud object storage).

**Caching:**
- None (no Redis, Memcached, or similar).

## Authentication & Identity

**Auth Provider:**
- None. No authentication system.
- Users are identified by self-declared username within a session. No passwords, tokens, or external identity providers.
- Session membership is tracked in-memory; session IDs are random 8-character UUID prefixes generated in `SessionManager.createSession()`.

## Real-Time Communication

**WebSocket:**
- Spring's built-in STOMP message broker (in-process, no external broker such as RabbitMQ or Redis).
- Endpoint: `/stomp` (SockJS fallback enabled).
- Topics: `/topic/results/{sessionId}`, `/topic/users/{sessionId}`.
- Configured in `planningpoker-api/src/main/java/com/richashworth/planningpoker/config/WebSocketConfig.java`.
- Client: `@stomp/stompjs` + `sockjs-client` via `planningpoker-web/src/hooks/useStomp.js`.

## Monitoring & Observability

**Health Check:**
- Spring Boot Actuator exposes `GET /actuator/health` (details hidden).
- Used by Railway for deployment health checks (configured in `railway.toml`).

**Error Tracking:**
- None (no Sentry, Datadog, or similar).

**Logs:**
- Standard stdout/stderr via SLF4J + Spring Boot default logging.
- Log levels: `org.springframework` at INFO, `com.richashworth.planningpoker` at DEBUG (set in `planningpoker-api/src/main/resources/application.properties`).

## CI/CD & Deployment

**Hosting:**
- Railway (PaaS). Config at `railway.toml`. Live at `https://planning-poker.up.railway.app`.
- Deployment uses the `Dockerfile` at the project root (multi-stage Docker build).
- Start command: `java -Djava.security.egd=file:/dev/./urandom -Dserver.port=${PORT:-9000} -jar app.jar`
- Restart policy: on failure, max 3 retries.

**CI Pipeline:**
- GitHub Actions. Workflow at `.github/workflows/ci.yml`.
- Triggers: push and pull requests to `master`.
- Two parallel jobs:
  - `unit-tests`: frontend Vitest + backend JUnit 5 via Gradle
  - `e2e-tests`: Playwright (Chromium only) against a running backend
- Gradle and npm caches enabled in CI.
- Failed Playwright runs upload test artifacts to `planningpoker-web/test-results/` (7-day retention).

## Environment Configuration

**Required env vars:**
- `PORT` - HTTP listen port (defaults to 9000 if absent)

**Optional env vars:**
- `app.cors.allowed-origins` - Comma-separated CORS origins (defaults to `*`)

**Secrets location:**
- No secrets required. No API keys, database credentials, or third-party service tokens.

## Webhooks & Callbacks

**Incoming:**
- None.

**Outgoing:**
- None.

---

*Integration audit: 2026-04-04*
