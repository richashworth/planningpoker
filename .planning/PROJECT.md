# Planning Poker

## What This Is

A real-time planning poker web app where distributed teams estimate work collaboratively. Hosts choose an estimation scheme (Fibonacci, T-shirt sizes, Simple 1-5, or Custom) when creating a game, and all participants see the correct cards for that session.

## Core Value

Hosts can pick an estimation scheme when creating a game, and all participants see the correct cards for that session.

## Current State

Shipped v1.0 (Estimation Schemes) on 2026-04-04, v1.1 (CreateGame Redesign) on 2026-04-05.

- **Backend:** Spring Boot 3.4 / Java 21, all state in-memory (Guava maps). SchemeType enum resolves presets to value lists; SchemeConfig record carries scheme metadata per session.
- **Frontend:** React 18 + MUI v5 + Redux 4. CreateGame uses tile grid (SchemeTile component) with MUI rounded icons, names, and value chips. 2-column desktop / 3-column icon-only mobile responsive layout. Stripe-style shadow design. Card Preview section removed.
- **API:** createSession/joinSession return JSON with scheme metadata. VoteController validates votes per-session (not hardcoded).
- **Stats:** ~4,355 lines added across 2 milestones (v1.0: 3 phases/5 plans, v1.1: 1 phase/2 plans).

## Requirements

### Validated

- ✓ Preset scheme selection (Fibonacci, T-shirt, Simple) — v1.0
- ✓ Custom scheme with 2-20 values, validation — v1.0
- ✓ Meta-card toggles (? unsure, Coffee break) — v1.0
- ✓ Scheme locked for session duration — v1.0
- ✓ JSON API contract for create/join with scheme metadata — v1.0
- ✓ Per-session vote validation against scheme — v1.0
- ✓ Redux stores scheme info from API responses — v1.0
- ✓ Dynamic vote cards and scheme-aware results chart — v1.0
- ✓ Tile grid scheme selector with icons, names, value chips — v1.1
- ✓ Tile click selection with visual feedback (border, checkmark) — v1.1
- ✓ Inline Custom input within tile — v1.1
- ✓ 2-column desktop / 3-column icon-only mobile responsive layout — v1.1
- ✓ Unsure toggle switch (Coffee toggle removed by design) — v1.1
- ✓ Card Preview section removed — v1.1
- ✓ Backwards compatibility: default Fibonacci, all e2e tests pass, API unchanged — v1.1

### Active

(None — next milestone not yet defined)

### Out of Scope

- Mid-session scheme change — no ecosystem precedent; scheme is per-game
- Saved custom schemes for reuse — requires persistence; defer to future milestone
- Chat/messaging — separate milestone (backlog 999.1)
- User authentication — not needed, name-based identity is sufficient
- Label/value separation for averaging — app is qualitative, not quantitative

## Constraints

- **Tech stack**: Spring Boot 3.4 + Java 21 backend, React 18 + MUI v5 frontend — no new frameworks
- **Backwards compatibility**: Default to Fibonacci so existing flows work unchanged
- **In-memory state**: No database — scheme config stored in SessionManager maps like existing state

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Scheme resolved to values on server, stored per session | Single source of truth for vote validation | ✓ Good |
| Frontend resolves preset names locally, only custom values transmitted | Reduces payload size, presets are static | ✓ Good |
| Meta-cards (?, Coffee) are toggles, not part of scheme definition | Orthogonal concern, cleaner API | ✓ Good |
| No-arg createSession() delegates to overload with Fibonacci defaults | Backward compatibility for existing tests/flows | ✓ Good |
| createSession response changed from string to JSON | Required for scheme metadata; coordinated backend+frontend in Phase 2 | ✓ Good |
| Box with sx grid instead of Card for SchemeTile | Avoid nested Card MUI issues | ✓ Good |
| data-testid selectors for scheme tiles in e2e tests | More stable than text-based or role selectors | ✓ Good |
| Removed Coffee break toggle, kept Unsure only | UAT feedback — Coffee toggle not useful | ✓ Good |
| Stripe-style shadow depth with Linear icons | UAT refinement — cleaner professional design | ✓ Good |

## Context

- Full design spec: `docs/superpowers/specs/2026-04-04-estimation-schemes-design.md`
- Implementation plan: `docs/superpowers/plans/2026-04-04-estimation-schemes.md`
- Deployed at: https://planning-poker.up.railway.app

## Tech Debt

- LEGAL_ESTIMATES in Constants.js is a dead export (superseded by Redux state)
- reducer_game.js CREATE_GAME/JOIN_GAME cases lack action.error guard (pre-existing)
- VERIFICATION.md for Phase 4 is stale after UAT-driven changes (doc accuracy only)

---
*Last updated: 2026-04-05 after v1.1 milestone*
