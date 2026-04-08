# Planning Poker — Roadmap

## Milestones

- ✅ **v1.0 Estimation Schemes** — Phases 1-3 (shipped 2026-04-04) — [archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 CreateGame Redesign** — Phase 4 (shipped 2026-04-05) — [archive](milestones/v1.1-ROADMAP.md)
- ✅ **v1.2 Host Management** — Phases 5-7 (shipped 2026-04-06) — [archive](milestones/v1.2-ROADMAP.md)
- 📋 **v1.3 TBD** — (planned)

## Phases

<details>
<summary>✅ v1.0 Estimation Schemes (Phases 1-3) — SHIPPED 2026-04-04</summary>

- [x] Phase 1: Backend Foundation (1/1 plans) — completed 2026-04-04
- [x] Phase 2: API Contract (2/2 plans) — completed 2026-04-04
- [x] Phase 3: Frontend UI (2/2 plans) — completed 2026-04-04

</details>

<details>
<summary>✅ v1.1 CreateGame Redesign (Phase 4) — SHIPPED 2026-04-05</summary>

- [x] Phase 4: CreateGame Tile Grid Redesign (2/2 plans) — completed 2026-04-05

</details>

<details>
<summary>✅ v1.2 Host Management (Phases 5-7) — SHIPPED 2026-04-06</summary>

- [x] Phase 5: Backend Host Model (2/2 plans) — completed 2026-04-06
- [x] Phase 6: Host Actions & WebSocket Events (2/2 plans) — completed 2026-04-06
- [x] Phase 7: Host UI & Notifications (3/3 plans) — completed 2026-04-06

</details>

## Backlog

### Phase 999.1: Chat drawer with host moderation (BACKLOG)

**Goal:** Add a chat panel (left drawer) to planning poker sessions. Host can moderate (block/disable/enable chat). Users can send messages to each other in real-time. New joiners receive session message history.

**Requirements:** TBD

**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd:review-backlog when ready)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Backend Foundation | v1.0 | 1/1 | Complete | 2026-04-04 |
| 2. API Contract | v1.0 | 2/2 | Complete | 2026-04-04 |
| 3. Frontend UI | v1.0 | 2/2 | Complete | 2026-04-04 |
| 4. CreateGame Tile Grid Redesign | v1.1 | 2/2 | Complete | 2026-04-05 |
| 5. Backend Host Model | v1.2 | 2/2 | Complete | 2026-04-06 |
| 6. Host Actions & WebSocket Events | v1.2 | 2/2 | Complete | 2026-04-06 |
| 7. Host UI & Notifications | v1.2 | 3/3 | Complete | 2026-04-06 |

### Phase 8: Session Labels & CSV Export

**Goal:** Host can optionally label each voting round (before or after voting, visible to all players). Auto-majority consensus is inferred and can be overridden by the host. Round history accumulates in Redux. Host can download a CSV including label, consensus estimate, per-player votes, timestamp, mode, min, max, and variance.
**Requirements**: [LABEL-01, LABEL-02, LABEL-03, CONS-01, CONS-02, HIST-01, CSV-01]
**Depends on:** Phase 7
**Plans:** 2 plans

Plans:
- [ ] 08-01-PLAN.md — Round labelling: backend endpoint, WebSocket broadcast, frontend label UI
- [ ] 08-02-PLAN.md — Consensus inference, round history, host override, CSV export
