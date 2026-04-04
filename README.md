# Planning Poker

[![CI](https://github.com/richashworth/planningpoker/actions/workflows/ci.yml/badge.svg)](https://github.com/richashworth/planningpoker/actions/workflows/ci.yml)

A web-based planning poker tool for agile estimation. See [this blog post](https://richashworth.com/blog/agile-estimation-for-distributed-teams/) for more information.

**Live:** https://planning-poker.up.railway.app

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, MUI v5, Redux, react-router v6, chart.js 4 |
| Backend | Spring Boot 3.4, Java 21 |
| Real-time | STOMP over SockJS (WebSocket) |
| Build | Gradle 8.14, Vite 5 |
| CI | GitHub Actions |
| Hosting | Railway |

## Running Locally

Start the backend (port 9000):

```bash
./gradlew planningpoker-api:bootRun
```

Start the frontend dev server (port 3000, proxies API to 9000):

```bash
cd planningpoker-web && npm install && npm run dev
```

## Building

Build the deployable fat JAR (serves both frontend and API):

```bash
cd planningpoker-web && npm install && npm run build && cd ..
./gradlew planningpoker-web:jar
./gradlew planningpoker-api:bootJar
java -jar planningpoker-api/build/libs/planningpoker-api-*.jar
```

## Testing

```bash
# Backend unit tests
./gradlew planningpoker-api:test

# E2E tests (requires backend running on port 9000)
cd planningpoker-web && npx playwright test
```
