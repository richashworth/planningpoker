# Planning Poker

## What This Is

A real-time planning poker web app where distributed teams estimate work collaboratively. Hosts choose an estimation scheme (Fibonacci, T-shirt sizes, Simple 1-5, or Custom) when creating a game, and all participants see the correct cards for that session.

## Core Value

Hosts can pick an estimation scheme when creating a game, and all participants see the correct cards for that session.

## Current Milestone: v1.1 CreateGame Redesign

**Goal:** Replace the ToggleButtonGroup scheme selector with a self-documenting tile grid — emoji icons, descriptions, and value chips per scheme.

**Target features:**
- Tile grid scheme selector with emoji icons and value previews baked into each tile
- One-line description per scheme for context
- No separate Card Preview section (tiles already show values)
- Pill-style toggles for extra cards (? Unsure, ☕ Break)
- Responsive: 2-col on desktop with full detail, 3-col icon-only on mobile
- Custom scheme tile spans full width with inline input

## Current State

Shipped v1.0 (Estimation Schemes) on 2026-04-04.

- **Backend:** Spring Boot 3.4 / Java 21, all state in-memory (Guava maps). SchemeType enum resolves presets to value lists; SchemeConfig record carries scheme metadata per session.
- **Frontend:** React 18 + MUI v5 + Redux 4. Scheme selector on CreateGame, dynamic vote cards from Redux state, scheme-aware results chart.
- **API:** createSession/joinSession return JSON with scheme metadata. VoteController validates votes per-session (not hardcoded).
- **Stats:** ~2,875 lines added across 36 files in 3 phases / 5 plans.

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

### Active

- [ ] Tile grid scheme selector with emoji icons and value chips
- [ ] One-line description per scheme
- [ ] Remove separate Card Preview section
- [ ] Pill-style toggles for extra cards (? and ☕)
- [ ] Responsive layout: 2-col desktop, 3-col icon-only mobile
- [ ] Custom scheme tile full-width with inline input

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

## Context

- Full design spec: `docs/superpowers/specs/2026-04-04-estimation-schemes-design.md`
- Implementation plan: `docs/superpowers/plans/2026-04-04-estimation-schemes.md`
- Deployed at: https://planning-poker.up.railway.app

## Tech Debt (from v1.0 audit)

- LEGAL_ESTIMATES and COFFEE_SYMBOL in Constants.js are dead exports (superseded by Redux state)
- No Playwright e2e coverage for non-Fibonacci schemes, custom values, or meta-card toggles
- reducer_game.js CREATE_GAME/JOIN_GAME cases lack action.error guard (pre-existing)

---
*Last updated: 2026-04-04 after v1.0 milestone*
