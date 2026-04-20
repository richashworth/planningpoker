# Contributing

Thanks for wanting to help. This project is a small two-module app (React frontend + Spring Boot backend) deployed to Railway; changes land on `master` via PR and are auto-released by semantic-release.

## Prerequisites

- **Node.js 22+**
- **JDK 21** (Eclipse Temurin recommended)
- **Gradle** — use the wrapper (`./gradlew`), don't install Gradle globally.

## Getting started

```bash
# Install frontend deps
cd planningpoker-web && npm install && cd ..

# Start backend (port 9000)
./gradlew planningpoker-api:bootRun

# In another terminal, start frontend dev server (port 3000, proxies API to 9000)
cd planningpoker-web && npm run dev
```

Open http://localhost:3000.

## Running tests

```bash
# Frontend unit tests (Vitest)
cd planningpoker-web && npm test

# Backend unit tests (JUnit 5)
./gradlew planningpoker-api:test

# E2E tests (Playwright — requires backend running on port 9000)
cd planningpoker-web && npx playwright test
```

## Linting and formatting

CI enforces both; please run locally before pushing.

```bash
# Frontend
cd planningpoker-web && npm run lint && npm run format:check

# Backend
./gradlew spotlessCheck
# Auto-fix:
./gradlew planningpoker-api:spotlessApply
```

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/) drive the release cadence:

- `fix:` → patch release
- `feat:` → minor release
- `feat!:` or `BREAKING CHANGE:` footer → major release
- `chore:` / `docs:` / `test:` / `refactor:` → no release

Example:

```
feat(ui): add copy-session-id button to the host header

Closes #123
```

## Pull requests

1. Branch off `master`.
2. Keep PRs focused — one logical change per PR.
3. Update `CLAUDE.md` if the change affects architecture or conventions.
4. Fill in the PR template checklist (tests, lint, e2e for UI/behaviour changes).
5. Green CI is required to merge. Admins don't bypass failing checks.

## Architecture at a glance

See [CLAUDE.md](./CLAUDE.md) for the full tour. In short:

- `planningpoker-web/` — React 18 + MUI v5 + Redux Toolkit; builds to a JAR that the backend embeds.
- `planningpoker-api/` — Spring Boot 3.4 on Java 21; in-memory session state (no database), STOMP/WebSocket for live updates.

## Reporting bugs

Open an issue with steps to reproduce and the browser/OS combination. Since sessions are ephemeral and no data is persisted, a session id is rarely useful by the time we look at it.
