# Planning Poker — Estimation Schemes

## What This Is

A real-time planning poker web app where distributed teams estimate work collaboratively. Currently supports only Fibonacci-style estimates. This milestone adds customizable estimation schemes so hosts can choose the scale that fits their team.

## Core Value

Hosts can pick an estimation scheme (Fibonacci, T-shirt, Simple, or Custom) when creating a game, and all participants see the correct cards for that session.

## Requirements

### Validated

- Session creation with host naming — existing
- Join session by ID — existing
- Real-time vote/reveal via WebSocket — existing
- Results chart and table display — existing
- Reset rounds — existing
- Dark/light theme toggle — existing
- Copy session ID — existing

### Active

(All v1 requirements validated -- see below)

### Validated in Phase 3 (Frontend UI)

- [x] Host selects estimation scheme when creating a game
- [x] Preset schemes: Fibonacci (default), T-shirt sizes, Simple (1-5)
- [x] Custom scheme: host defines 2-20 values (max 10 chars each, no duplicates)
- [x] Meta-card toggles: ? (unsure) and Coffee (break), default on
- [x] Vote cards render dynamically from session scheme
- [x] Results chart labels reflect session scheme

### Validated in Phase 2 (API Contract)

- [x] Scheme locked for session duration — no mutation endpoint exists
- [x] Joiners receive scheme info on join — joinSession returns SessionResponse with scheme metadata
- [x] Server validates votes against session scheme (not hardcoded set) — VoteController uses per-session getSessionLegalValues

### Out of Scope

- Changing scheme mid-session — complexity not justified, scheme is per-game
- Saving custom schemes for reuse — defer to future milestone
- Chat/messaging — separate milestone (backlog 999.1)
- User authentication — not needed, name-based identity is sufficient

## Context

- Full design spec exists: `docs/superpowers/specs/2026-04-04-estimation-schemes-design.md`
- Detailed implementation plan exists: `docs/superpowers/plans/2026-04-04-estimation-schemes.md`
- Backend is Spring Boot 3.4 (Java 21), all state in-memory via synchronized Guava maps
- Frontend is React 18 + MUI v5 + Redux 4, communicates via REST (axios) + WebSocket (STOMP)
- Vote validation uses per-session scheme values in VoteController.java (Phase 2)
- Vote.jsx and ResultsChart.jsx read legalEstimates from Redux state (Phase 3)
- API responses for createSession/joinSession return JSON with scheme metadata (Phase 2)

## Constraints

- **Tech stack**: Spring Boot 3.4 + Java 21 backend, React 18 + MUI v5 frontend — no new frameworks
- **Backwards compatibility**: Default to Fibonacci so existing flows work unchanged
- **In-memory state**: No database — scheme config stored in SessionManager maps like existing state
- **API evolution**: createSession response changes from string to JSON — frontend must handle both during development

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Scheme resolved to values on server, stored per session | Single source of truth for vote validation | -- Pending |
| Frontend resolves preset names locally, only custom values transmitted | Reduces payload size, presets are static | -- Pending |
| Meta-cards (?, Coffee) are toggles, not part of scheme definition | Orthogonal concern, cleaner API | -- Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-04 after Phase 3 completion*
