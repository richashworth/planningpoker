# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Estimation Schemes

**Shipped:** 2026-04-04
**Phases:** 3 | **Plans:** 5

### What Was Built
- SchemeType enum + SchemeConfig record with per-session scheme storage in SessionManager
- JSON API contract: createSession/joinSession return scheme metadata; per-session vote validation
- Redux wiring for scheme state (legalEstimates, schemeType, meta-card flags)
- Scheme selector UI: preset picker, custom values input, meta-card toggles on CreateGame
- Dynamic vote cards and scheme-aware results chart (no hardcoded card lists)

### What Worked
- 3-phase layered approach (backend model → API contract → frontend UI) isolated risk well
- Coordinating the string→JSON API change in a single phase (Phase 2) prevented integration issues
- TDD approach in Phase 1 caught edge cases early (defensive copies, null-safety for unknown sessions)
- All 5 plans executed with zero deviations from plan

### What Was Inefficient
- REQUIREMENTS.md traceability table fell out of sync (5 items still marked Pending despite being complete) — checkbox discipline needed
- ROADMAP.md progress table similarly stale (Phase 2 & 3 marked 0/2 plans despite both complete)
- No e2e test coverage for the new feature — manual verification only

### Patterns Established
- Java records for immutable DTOs (SchemeConfig, CreateSessionRequest, SessionResponse)
- `resolveValues()` as canonical entry point for scheme → value list resolution
- `getSessionLegalValues()` returns empty list (not null) for unknown sessions
- Redux `legalEstimates` as single source for vote card rendering

### Key Lessons
1. Traceability tables need updating at plan completion, not just phase completion — stale checkboxes erode trust in the tracking system
2. Backend→frontend coordination for breaking API changes (string→JSON) is best done in a single phase with both sides committed together
3. Dead exports (LEGAL_ESTIMATES, COFFEE_SYMBOL) should be cleaned up in the same phase that supersedes them

## Milestone: v1.1 — CreateGame Redesign

**Shipped:** 2026-04-05
**Phases:** 1 | **Plans:** 2

### What Was Built
- SchemeTile component: Box-based tile grid replacing ToggleButtonGroup
- 2-column desktop / 3-column icon-only mobile responsive layout
- Inline Custom scheme input within tile, Card Preview section removed
- Playwright e2e selector updates from role queries to data-testid

### What Worked
- Single-phase frontend-only redesign kept scope tight — no backend changes needed
- data-testid approach for tile selectors made e2e updates straightforward
- UAT-driven iteration (4 fix commits) refined design quality significantly: Stripe-style shadows, Linear icons, coffee toggle removal, toggle defaults OFF
- Milestone audit (13/13 requirements satisfied) confirmed completeness before archival

### What Was Inefficient
- VERIFICATION.md became stale after UAT-driven changes — verification should run after UAT, not before
- Multiple UAT fix rounds (4 commits) suggest the initial design spec could have been tighter on visual details
- ROADMAP.md progress table and REQUIREMENTS.md checkboxes again fell out of sync (all still marked Pending/0 plans despite completion)

### Patterns Established
- SchemeTile as presentational component with customInput prop for extensibility
- `SCHEME_METADATA` + `SCHEME_ORDER` constants for scheme display data
- Stripe-style shadow depth as design language for tile components
- UAT → fix → re-verify as standard quality loop for UI phases

### Key Lessons
1. Run verification *after* UAT, not before — UAT always drives changes that invalidate earlier verification
2. Traceability sync issue persists from v1.0 — need automated or discipline-enforced checkbox updates at plan completion
3. For UI redesigns, investing more in visual spec upfront (specific shadow values, icon choices) reduces UAT fix rounds

## Milestone: v1.2 — Host Management

**Shipped:** 2026-04-06
**Phases:** 3 | **Plans:** 7 (incl. 1 gap-closure plan)

### What Was Built
- `SessionManager` host tracking: creator = host, auto-promotes on departure, `ConcurrentHashMap` with `putIfAbsent`
- `/kick` and `/promote` endpoints with 403 enforcement (`HostActionException`), TOCTOU-safe `synchronized` block
- WebSocket users payload enriched to `{users, host}` map — all participants see host identity in real-time
- Redux host state wired from both REST (`createGame`/`joinGame`) and WebSocket (`USERS_UPDATED`)
- `StarRounded` host indicator in participants list; `PersonRemoveRounded`/`SwapHorizRounded` host controls
- Kick confirmation dialog, `sessionStorage`-bridge toast redirect for kicked users
- Gap closure (07-03): isolated `startCase` to display-only, `equalsIgnoreCase` for `removeUser`

### What Worked
- 3-phase layered approach (backend model → API + actions → UI) again mirrored v1.0's successful pattern
- TDD throughout: RED→GREEN→REFACTOR strictly followed in all backend plans
- Playwright automation for UAT — ran all 5 UAT checks programmatically across two browser tabs, no manual testing needed
- `sessionStorage`-bridge pattern for cross-page state (kicked toast) is clean and well-tested
- Gap closure plan (07-03) created and executed cleanly — the UAT-to-gap-closure loop worked as designed

### What Was Inefficient
- UAT uncovered 3 bugs (startCase transform, case-sensitive removeUser, self-kick display) that could have been caught by unit tests during plan execution — pre-flight test coverage for username edge cases was missing
- Original Phase 7 plan only had 2 plans; 07-03 was added post-UAT. The startCase bug was foreseeable given the display→API coupling in UsersTable
- Toast timing made it tricky to screenshot in Playwright — used sessionStorage key consumption as proxy for verification

### Patterns Established
- `HostActionException` as typed 403 signal, caught by `@ControllerAdvice` — reusable pattern for future authorization gates
- `sessionStorage` bridge for cross-page one-shot notifications (set→read on mount→clear)
- Playwright UAT as a first-class verification step replacing manual browser testing
- Separate `originalName` vs display name pattern for any component using `startCase` or other transforms

### Key Lessons
1. Username transform bugs are a class of error worth a specific checklist item: "Any display transform applied to a username must be isolated from API calls and comparisons"
2. Playwright automation makes UAT fast and reproducible — worth setting up from Phase 1 for UI milestones
3. Gap closure plans work well when the UAT items are specific and actionable; vague UAT items lead to unclear gap plans

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 3 | 5 | First milestone; established 3-phase layered delivery pattern |
| v1.1 | 1 | 2 | UAT-driven iteration loop; milestone audit before archival |
| v1.2 | 3 | 7 | Playwright UAT automation; gap-closure plan cycle; cross-browser real-time verification |

### Top Lessons (Verified Across Milestones)

1. Traceability tables (ROADMAP progress + REQUIREMENTS checkboxes) consistently fall out of sync — confirmed in v1.0, v1.1, and v1.2. Need enforcement at plan completion.
2. Zero-deviation plan execution is achievable when scope is well-defined — all 14 plans across 3 milestones executed as written (UAT refinements are post-plan).
3. Display transform bugs (startCase, etc.) that touch API call paths are a recurring risk class — worth a standing checklist item in UI phase plans.
