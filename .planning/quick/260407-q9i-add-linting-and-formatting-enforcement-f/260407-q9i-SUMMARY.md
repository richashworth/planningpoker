---
quick_task: 260407-q9i
description: Add linting and formatting enforcement for frontend (ESLint + Prettier) and backend (Spotless)
completed: "2026-04-07"
duration_minutes: 15
tasks_completed: 4
files_created:
  - planningpoker-web/.eslintrc.cjs
  - planningpoker-web/.prettierrc
  - planningpoker-web/.prettierignore
  - .husky/pre-commit
files_modified:
  - planningpoker-web/package.json
  - planningpoker-web/package-lock.json
  - planningpoker-api/build.gradle
  - .github/workflows/ci.yml
  - planningpoker-web/src/ (all 34 JS/JSX files reformatted by Prettier)
  - planningpoker-api/src/ (all Java files reformatted by Google Java Format)
commits:
  - 096f4ae: chore(260407-q9i): configure ESLint + Prettier for frontend
  - a32ae40: chore(260407-q9i): configure Spotless with Google Java Format for backend
  - 92a6379: chore(260407-q9i): add CI lint job gating unit-tests and e2e-tests
  - 03dd69f: chore(260407-q9i): set up husky + lint-staged pre-commit hooks
---

# Quick Task 260407-q9i: Add Linting and Formatting Enforcement

ESLint 8 + Prettier for React frontend and Spotless + Google Java Format for Spring Boot backend, with CI gates and husky pre-commit hooks — zero errors on the existing codebase.

## What Was Done

### Task 1: ESLint + Prettier for frontend (commit 096f4ae)

- Installed `eslint@^8`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `prettier`, `eslint-config-prettier` as devDependencies
- Created `.eslintrc.cjs` with `eslint:recommended` + react + react-hooks + prettier extends; `react/prop-types` off, `no-unused-vars` as warn, `no-console` off
- Created `.prettierrc` matching observed code style: no semicolons, single quotes, JSX double quotes, 2-space indent, 100 char print width, trailing commas
- Created `.prettierignore` excluding build/, dist/, node_modules/, *.html
- Added `lint`, `lint:fix`, `format`, `format:check` npm scripts
- Auto-formatted all 34 src/ JS/JSX files with Prettier; result: 0 lint errors, 0 format diffs

### Task 2: Spotless for backend (commit a32ae40)

- Added `com.diffplug.spotless` plugin v7.0.2 to `planningpoker-api/build.gradle`
- Configured `googleJavaFormat('1.22.0')` with `removeUnusedImports`, `trimTrailingWhitespace`, `endWithNewline`
- Ran `spotlessApply` to reformat all main and test Java sources
- Wired `spotlessCheck` into the `check` lifecycle task
- Result: `spotlessCheck` passes with zero violations

### Task 3: CI lint job (commit 92a6379)

- Added `lint` job to `.github/workflows/ci.yml` running: `npm run lint`, `npm run format:check`, `./gradlew spotlessCheck`
- Added `needs: lint` to both `unit-tests` and `e2e-tests` jobs so they only run after lint passes

### Task 4: husky + lint-staged pre-commit hooks (commit 03dd69f)

- Installed `husky@^9` and `lint-staged@^16` in `planningpoker-web/`
- Configured git `core.hooksPath` to `.husky/` at repo root
- Created `.husky/pre-commit` hook: runs `lint-staged` for staged JS/JSX (eslint --fix + prettier --write), and `spotlessApply` for staged Java files
- Added `lint-staged` config to `planningpoker-web/package.json`
- `prepare` script set to `husky` (auto-added by npm install)

## Verification Results

| Check | Result |
|-------|--------|
| `npm run lint` | 0 errors, 18 warnings (unused React imports — expected with new JSX transform) |
| `npm run format:check` | All matched files use Prettier code style |
| `./gradlew spotlessCheck` | BUILD SUCCESSFUL |
| `npm test` (frontend) | 7 test files, 46 tests — all passed |
| `./gradlew planningpoker-api:test` | BUILD SUCCESSFUL |
| `.husky/pre-commit` exists | Yes, executable |

## Deviations from Plan

### Auto-fixed: husky init approach

- **Found during:** Task 4
- **Issue:** `npx husky init` from repo root failed (no `package.json` at root); running from `planningpoker-web/` also failed (`.git` not in that directory)
- **Fix:** Created `.husky/` directory manually at repo root, set `git config core.hooksPath .husky`, wrote `pre-commit` hook directly — same outcome as `husky init` but without the CLI requirement
- **Files modified:** `.husky/pre-commit` (created manually)

## Known Stubs

None.

## Threat Flags

None — this task adds only developer tooling (linters, formatters, git hooks). No new network endpoints, auth paths, or schema changes introduced.

## Self-Check: PASSED

- `.husky/pre-commit`: FOUND
- `planningpoker-web/.eslintrc.cjs`: FOUND
- `planningpoker-web/.prettierrc`: FOUND
- `planningpoker-web/.prettierignore`: FOUND
- Commits 096f4ae, a32ae40, 92a6379, 03dd69f: all present in git log
