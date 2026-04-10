# Planning Poker

## What This Is

A real-time planning poker web app where distributed teams estimate work collaboratively. Hosts choose an estimation scheme, label voting rounds, see auto-consensus with override, and export session results as CSV.

## Core Value

Teams can run a complete estimation session — pick a scheme, vote on multiple items with labels, review consensus, and export results — all in real time with no signup.

## Current State

Shipped v1.0 (Estimation Schemes) 2026-04-04, v1.1 (CreateGame Redesign) 2026-04-05, v1.2 (Host Management) 2026-04-06, v1.3 (Session Labels & CSV Export) 2026-04-08, v1.4 (Code Quality & Tech Debt) 2026-04-10. Between milestones — planning next.

- **Backend:** Spring Boot 3.4 / Java 21, all state in-memory (Guava maps). SchemeType enum resolves presets; SchemeConfig record per session. Host identity in SessionManager via `sessionHosts` ConcurrentHashMap. POST /kick, /promote, /setLabel endpoints with HostActionException 403 enforcement. Session labels in `sessionLabels` ConcurrentHashMap, broadcast via enriched `{results, label}` WebSocket payload.
- **Frontend:** React 18 + MUI v5 + Redux 4. Tile grid scheme selector. Host controls (kick/promote/label). Round labelling with debounced TextField. Auto-consensus Chip with host override. Round history in reducer_rounds.js. Client-side CSV export with formula injection protection.
- **API:** createSession/joinSession return JSON with scheme metadata and `host` field. Results WebSocket payload: `{results, label}` map (backwards-compat guard for bare arrays). POST /setLabel for host round labelling.
- **Stats:** ~5,800 lines added across 4 milestones (8 phases, 16 plans).

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
- ✓ Host star indicator visible to all participants — v1.2 Phase 7
- ✓ Host kick/promote controls on non-host rows only — v1.2 Phase 7
- ✓ Kicked user redirected to Welcome with toast notification — v1.2 Phase 7
- ✓ Promote transfers host in real-time across all participant views — v1.2 Phase 7
- ✓ Host can label each voting round with real-time broadcast — v1.3 Phase 8
- ✓ Auto-majority consensus with host override — v1.3 Phase 8
- ✓ Round history accumulates across resets — v1.3 Phase 8
- ✓ Client-side CSV export with per-player votes and stats — v1.3 Phase 8

- ✓ `createSession` + `removeUser` atomic via synchronized methods (TOCTOU closed) — v1.4 Phase 9
- ✓ Burst messaging reads single consistent snapshot before async loop — v1.4 Phase 9
- ✓ Dead `getSessions()` removed from SessionManager — v1.4 Phase 9
- ✓ JoinGame/CreateGame forms show loading state + disable on submit — v1.4 Phase 11 (already met)
- ✓ HTTP errors display as MUI Snackbar (no `alert()`) — v1.4 Phase 11 (already met)
- ✓ Vote revert clears both `voted` flag and optimistic result entry — v1.4 Phase 11 (already met)
- ✓ Lazy routes have visible `<Suspense>` fallback — v1.4 Phase 10
- ✓ Dead `/topic/items/` WebSocket subscription removed — v1.4 Phase 10
- ✓ Redux migrated to `configureStore` (Redux Toolkit); `redux-promise`/`createStore` removed — v1.4 Phase 10
- ✓ `useStomp` hook unit tests cover connect, subscribe, reconnect, disconnect — v1.4 Phase 11

### Active

#### v1.5 UX & Polish
- [ ] Label broadcast via Set button + Enter key (replaces 300ms-debounced live typing)
- [ ] `aria-live` announcements for vote reveal and consensus result
- [ ] Production logging audit — downgrade chatty hot-path logs, scrub session IDs/usernames/vote values, set appropriate prod log level

## Current Milestone: v1.5 UX & Polish

**Goal:** Improve session UX with deliberate label broadcast, accessible state transitions, and production-grade logging hygiene.

**Target features:**
- Label broadcast on submit (button + Enter) instead of live keystroke broadcast
- `aria-live="polite"` regions for vote reveal and consensus announcements
- Production logging hygiene: audit, downgrade chatty logs, scrub PII

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
| Label piggybacked on results WebSocket payload | Avoids separate topic; backwards-compat guard for bare arrays | ✓ Good |
| Debounced label dispatch (300ms) via useRef | Avoids lodash dependency for single use case | ✓ Good |
| Consensus tie-breaking via alphabetical sort | Deterministic across sessions | ✓ Good |
| CSV injection protection (prefix formula chars with ') | OWASP recommendation for user-generated CSV content | ✓ Good |
| Synchronized methods (not block-level) for SessionManager.createSession/removeUser | Matches existing `synchronized(sessionManager)` controller pattern; reentrant, no deadlock | ✓ Good |
| Burst messaging snapshots into a pre-built Message once before async loop | Immune to post-read mutations; all 6 bursts send identical payload | ✓ Good |
| Redux Toolkit `configureStore` (not full slice/RTK Query migration) | Scoped cleanup — kills `redux-promise` + `createStore` without destabilizing reducers | ✓ Good |
| `useStomp` tests extend existing `simulateMount` helper (no jsdom) | Tests exercise hook logic directly via callback invocation; faster, simpler | ✓ Good |

## Context

- Full design spec: `docs/superpowers/specs/2026-04-04-estimation-schemes-design.md`
- Implementation plan: `docs/superpowers/plans/2026-04-04-estimation-schemes.md`
- Deployed at: https://planning-poker.up.railway.app

## Tech Debt

- LEGAL_ESTIMATES in Constants.js is a dead export (superseded by Redux state)
- reducer_game.js CREATE_GAME/JOIN_GAME cases lack action.error guard (pre-existing)
- VERIFICATION.md for Phase 4 is stale after UAT-driven changes (doc accuracy only)
- REQUIREMENTS.md was stale from v1.2 — Phase 8 requirements tracked in ROADMAP.md only (archived with v1.3)

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-10 after starting v1.5 milestone (UX & Polish)*
