# Planning Poker

[![CI](https://github.com/richashworth/planningpoker/actions/workflows/ci.yml/badge.svg)](https://github.com/richashworth/planningpoker/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/richashworth/planningpoker)](https://github.com/richashworth/planningpoker/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)

A web-based planning poker tool for agile estimation. See [this blog post](https://richashworth.com/blog/agile-estimation-for-distributed-teams/) for more information.

**Live:** https://planning-poker.up.railway.app

![Planning Poker demo — host creating a session, 10 users voting over two rounds](docs/demo.gif)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, MUI v9, Redux 5 + Redux Toolkit, react-router v6, chart.js 4 |
| Backend | Spring Boot 4.0, Java 25 |
| Real-time | STOMP over SockJS (WebSocket) |
| Build | Gradle 8.14, Vite 8 |
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
# Backend unit tests (JUnit 5 + Mockito)
./gradlew planningpoker-api:test

# Frontend unit tests (Vitest + @testing-library/react)
cd planningpoker-web && npx vitest run

# E2E tests (Playwright; spins up backend + dev server automatically)
cd planningpoker-web && npx playwright test
```
