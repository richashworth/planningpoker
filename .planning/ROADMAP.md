# Planning Poker — Roadmap

## Overview

Three phases deliver customisable estimation schemes onto an existing in-memory real-time planning poker app. The backend is built first (model, service, API), then the frontend is wired to the new contract (Redux + UI). The highest-risk moment — createSession returning JSON instead of a plain string — is isolated in Phase 2 so the backend and frontend changes ship as a coordinated unit.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Backend Foundation** - SchemeType enum, SchemeConfig record, and SessionManager scheme storage (completed 2026-04-04)
- [ ] **Phase 2: API Contract** - Upgraded create/join endpoints returning JSON, per-session vote validation, Redux wiring
- [ ] **Phase 3: Frontend UI** - Scheme selector on CreateGame, dynamic vote cards, scheme-aware results chart

## Phase Details

### Phase 1: Backend Foundation
**Goal**: The server has a canonical scheme model and per-session scheme storage that the API layer can depend on
**Depends on**: Nothing (first phase)
**Requirements**: API-04, API-05
**Success Criteria** (what must be TRUE):
  1. A `SchemeType` enum exists with Fibonacci, T-shirt, Simple, and Custom variants, each resolving to a concrete value list including the correct ? and Coffee symbols
  2. A `SchemeConfig` record exists that can be serialised to JSON by Jackson without configuration
  3. `SessionManager` stores and retrieves scheme config per session ID
  4. Creating or evicting a session also creates or removes its scheme entry — no orphaned map entries
**Plans:** 1/1 plans complete

Plans:
- [x] 01-01-PLAN.md — SchemeType enum, SchemeConfig record, SessionManager scheme storage and cleanup

### Phase 2: API Contract
**Goal**: The create and join endpoints return scheme metadata as JSON, and the server validates votes against the session's actual scheme; the Redux layer consumes both responses correctly
**Depends on**: Phase 1
**Requirements**: API-01, API-02, API-03, SCHM-05, UI-06
**Success Criteria** (what must be TRUE):
  1. `POST /createSession` returns a JSON body containing session ID and scheme metadata (not a plain string)
  2. `POST /joinSession` returns a JSON body containing scheme metadata so joiners see the same card set as the host
  3. A vote cast with a value outside the session's scheme is rejected (HTTP 400); a vote matching the scheme is accepted
  4. The scheme is locked at session creation — no endpoint exists to change it mid-session
  5. Redux `sessionId` is correctly populated from the JSON create response; downstream vote and reset requests use the correct session ID
**Plans:** 2/2 plans complete

Plans:
- [ ] 02-01-PLAN.md — Backend API: DTOs, GameController JSON endpoints, VoteController per-session validation, tests
- [ ] 02-02-PLAN.md — Frontend Redux: action creators JSON body/response, reducer scheme state, Constants.js
**UI hint**: yes

### Phase 3: Frontend UI
**Goal**: Hosts can choose a scheme when creating a game, all participants see the correct dynamic card set, and results labels match the session scheme
**Depends on**: Phase 2
**Requirements**: SCHM-01, SCHM-02, SCHM-03, SCHM-04, UI-01, UI-02, UI-03, UI-04, UI-05
**Success Criteria** (what must be TRUE):
  1. Host sees a scheme selector (Fibonacci / T-shirt / Simple / Custom) on the Create Game page, with Fibonacci selected by default
  2. Selecting Custom reveals a text input where the host can enter 2-20 values; values with duplicates or entries over 10 characters are flagged inline
  3. Host can toggle the ? (unsure) and Coffee (break) meta-cards on or off before creating the session
  4. Vote cards on the Vote page render dynamically from the session's scheme — no hardcoded card list
  5. Results chart labels match the scheme values cast in that session
**Plans**: TBD

Plans:
- [ ] TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Backend Foundation | 1/1 | Complete   | 2026-04-04 |
| 2. API Contract | 0/2 | Planned | - |
| 3. Frontend UI | 0/? | Not started | - |

## Backlog

### Phase 999.1: Chat drawer with host moderation (BACKLOG)

**Goal:** Add a chat panel (left drawer) to planning poker sessions. Host can moderate (block/disable/enable chat). Users can send messages to each other in real-time. New joiners receive session message history.

**Requirements:** TBD

**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd:review-backlog when ready)
