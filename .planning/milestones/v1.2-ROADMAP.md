# Planning Poker — Roadmap

## Milestones

- ✅ **v1.0 Estimation Schemes** — Phases 1-3 (shipped 2026-04-04) — [archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 CreateGame Redesign** — Phase 4 (shipped 2026-04-05) — [archive](milestones/v1.1-ROADMAP.md)
- 🚧 **v1.2 Host Management** — Phases 5-7 (in progress)

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

### v1.2 Host Management

- [ ] **Phase 5: Backend Host Model** — Track host identity server-side and auto-promote on departure
- [ ] **Phase 6: Host Actions & WebSocket Events** — Kick and promote endpoints with real-time push to all participants
- [ ] **Phase 7: Host UI & Notifications** — Inline host controls, visual host indicator, and kicked-user toast

## Phase Details

### Phase 5: Backend Host Model
**Goal**: The server tracks which participant is the host for each session, and automatically reassigns host to the next participant by join order when the host leaves
**Depends on**: Nothing (first v1.2 phase; builds on existing SessionManager)
**Requirements**: HOST-01, HOST-02
**Success Criteria** (what must be TRUE):
  1. When a session is created, the creator's username is stored as the host in SessionManager
  2. The current host identity is returned in joinSession and refresh API responses so clients know who is host
  3. When the host calls logout/leave, the next participant in join order is automatically promoted to host before the response is sent
  4. If the last participant leaves, no host error occurs and the session remains valid (or clears normally)
**Plans**: 2 plans

Plans:
- [x] 05-01-PLAN.md — SessionManager host tracking with TDD (service layer + tests)
- [x] 05-02-PLAN.md — Expose host in API responses (SessionResponse + controller + tests)

### Phase 6: Host Actions & WebSocket Events
**Goal**: The host can kick a participant or promote another participant to host, and all participants receive real-time WebSocket push notifications when either event occurs
**Depends on**: Phase 5
**Requirements**: ACT-01, ACT-02, NOTIF-02
**Success Criteria** (what must be TRUE):
  1. A POST to the kick endpoint by the session host removes the target user from the session
  2. A POST to the promote endpoint by the session host transfers host status to the target user
  3. A non-host participant calling kick or promote receives a 403 error
  4. After a kick or promote action, all WebSocket subscribers on `/topic/users/{sessionId}` receive an updated users payload that reflects the change
  5. The kicked user's session membership is revoked server-side so subsequent API calls from that user are rejected (400 — invalid membership, consistent with existing validation pattern)
**Plans**: 2 plans

Plans:
- [x] 06-01-PLAN.md — HostActionException + 403 handler + SessionManager.promoteHost()
- [x] 06-02-PLAN.md — Kick and promote controller endpoints with WebSocket broadcast

### Phase 7: Host UI & Notifications
**Goal**: Participants can see who the current host is, the host sees inline kick and promote controls next to each participant, and a kicked user lands on the welcome page with a clear explanation
**Depends on**: Phase 6
**Requirements**: HOST-03, ACT-03, NOTIF-01, UI-01, UI-02
**Success Criteria** (what must be TRUE):
  1. Every participant in the users list sees a visual host indicator (icon or badge) next to the current host's name
  2. When viewing the participants list as host, kick and promote icons appear next to every non-host participant
  3. When viewing the participants list as a non-host, no kick or promote icons are visible
  4. Clicking the kick icon shows a confirmation dialog; the kick only executes after the host confirms
  5. A participant who has been kicked is redirected to the welcome page and sees a toast message explaining they were removed from the session
**Plans**: 2 plans
**UI hint**: yes

Plans:
- [x] 07-01-PLAN.md — Redux host state wiring + visual host indicator in UsersTable
- [x] 07-02-PLAN.md — Host action controls (kick/promote icons, confirmation dialog, kick detection + toast)

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
| 5. Backend Host Model | v1.2 | 0/2 | Not started | - |
| 6. Host Actions & WebSocket Events | v1.2 | 0/2 | Not started | - |
| 7. Host UI & Notifications | v1.2 | 0/2 | Not started | - |
