# Milestones

## v1.2 Host Management (Shipped: 2026-04-06)

**Phases completed:** 3 phases, 7 plans, 10 tasks

**Key accomplishments:**

- One-liner:
- One-liner:
- One-liner:
- One-liner:
- Redux host state from enriched WS payload with gold star indicator in participants list
- Inline kick/promote controls for host with confirmation dialog and kicked-user toast redirect
- Fixed startCase display-transform corruption in UsersTable and case-sensitive user removal in SessionManager, ensuring host indicators, kick, and promote work for all username formats

---

## v1.1 CreateGame Redesign (Shipped: 2026-04-05)

**Phases completed:** 1 phase, 2 plans, 4 tasks

**Key accomplishments:**

- Replaced ToggleButtonGroup scheme selector with self-documenting 2-column tile grid (SchemeTile component) with responsive icon-only mobile layout
- Updated Playwright e2e selectors from ToggleButton role queries to data-testid queries for tile grid
- UAT-driven refinements: Stripe-style shadow design, Linear icons, coffee toggle removal, toggle defaults OFF
- Inline Custom scheme input within tile, Card Preview section removed

**Stats:** 30 files changed, +1,480 / -221 lines | Git range: `54e8e29..7c321f3`

---

## v1.0 Estimation Schemes (Shipped: 2026-04-04)

**Phases completed:** 4 phases, 5 plans, 7 tasks

**Key accomplishments:**

- SchemeType enum, SchemeConfig record, and per-session scheme storage in SessionManager with full lifecycle cleanup
- JSON API contract: createSession/joinSession return scheme metadata; VoteController validates votes per-session
- Redux layer wired to consume JSON responses and populate scheme state (legalEstimates, schemeType, meta-card flags)
- Scheme selector UI on CreateGame: preset picker, custom values input with validation, meta-card toggles
- Dynamic vote cards and scheme-aware results chart — no more hardcoded card lists

**Stats:** 36 files changed, +2,875 / -67 lines | Git range: `6632c18..1e6a76c`

---
