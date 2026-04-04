---
phase: quick
plan: 260404-rsd
subsystem: frontend
tags: [cleanup, testing, e2e, reducer, constants]
dependency_graph:
  requires: []
  provides: [clean-constants, hardened-reducer, scheme-e2e-tests]
  affects: [planningpoker-web/src/config/Constants.js, planningpoker-web/src/reducers/reducer_game.js, planningpoker-web/tests/planning-poker.spec.js]
tech_stack:
  added: []
  patterns: [error-guard-pattern, playwright-describe-block]
key_files:
  modified:
    - planningpoker-web/src/config/Constants.js
    - planningpoker-web/src/reducers/reducer_game.js
    - planningpoker-web/tests/planning-poker.spec.js
decisions:
  - "Used regex locator for coffee symbol label to avoid unicode escaping issues in selector"
  - "Scoped MuiSwitch-input selectors to FormControlLabel parent to avoid dark-mode toggle collision"
metrics:
  duration: ~10 minutes
  completed: 2026-04-04
  tasks_completed: 2
  files_modified: 3
---

# Quick Task 260404-rsd: v1.0 Cleanup — Remove Dead Exports, Add Error Guards, Scheme E2E Tests

**One-liner:** Removed LEGAL_ESTIMATES/COFFEE_SYMBOL dead exports from Constants.js, added `action.error` guards to CREATE_GAME/JOIN_GAME reducer cases, and added 4 Playwright e2e tests covering T-shirt, Simple, Custom schemes and meta-card toggle behaviour.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Remove dead exports from Constants.js; add error guards to reducer_game.js | f363e41 |
| 2 | Add Estimation Schemes e2e test describe block (4 tests) | 6e83736 |

## Changes Made

### Task 1: Dead exports removal + error guards

**`planningpoker-web/src/config/Constants.js`**
- Removed `COFFEE_SYMBOL` export (unicode ☕ constant)
- Removed `INFINITY_SYMBOL` const (only used by LEGAL_ESTIMATES)
- Removed `LEGAL_ESTIMATES` export (Fibonacci value array)
- Only `API_ROOT_URL` export remains, as intended

**`planningpoker-web/src/reducers/reducer_game.js`**
- Added `if (action.error) return state;` as first line of `CREATE_GAME` case
- Added `if (action.error) return state;` as first line of `JOIN_GAME` case
- Matches existing pattern in `reducer_results.js` (VOTE and RESET_SESSION cases)

### Task 2: E2E test coverage

**`planningpoker-web/tests/planning-poker.spec.js`**
- Added `test.describe('Estimation Schemes')` block with 4 tests:
  1. T-shirt scheme: XS/S/M/L/XL/XXL visible; "13" absent; ? and ☕ present (meta-cards default on)
  2. Simple scheme: 1/2/3/4/5 visible; "13" absent; ? present
  3. Custom scheme: Easy/Medium/Hard cards visible; ? present
  4. Meta-card toggles off: ? and ☕ not visible; standard Fibonacci cards still present

## Verification

- `grep -r 'LEGAL_ESTIMATES|COFFEE_SYMBOL' src/` returns 0 matches — dead exports confirmed removed
- `grep -c 'action.error' src/reducers/reducer_game.js` returns 2 — both guards in place
- All 19 Playwright e2e tests pass (15 existing + 4 new)
- `npm run build` completes without errors

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- `f363e41` exists in git log
- `6e83736` exists in git log
- `planningpoker-web/src/config/Constants.js` contains only API_ROOT_URL
- `planningpoker-web/src/reducers/reducer_game.js` has 2 `action.error` guards
- `planningpoker-web/tests/planning-poker.spec.js` contains `Estimation Schemes` describe block
