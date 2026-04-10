# Planning Poker — Roadmap

## Milestones

- ✅ **v1.0 Estimation Schemes** — Phases 1-3 (shipped 2026-04-04) — [archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1 CreateGame Redesign** — Phase 4 (shipped 2026-04-05) — [archive](milestones/v1.1-ROADMAP.md)
- ✅ **v1.2 Host Management** — Phases 5-7 (shipped 2026-04-06) — [archive](milestones/v1.2-ROADMAP.md)
- ✅ **v1.3 Session Labels & CSV Export** — Phase 8 (shipped 2026-04-08) — [archive](milestones/v1.3-ROADMAP.md)
- ✅ **v1.4 Code Quality & Tech Debt** — Phases 9-11 (shipped 2026-04-10) — [archive](milestones/v1.4-ROADMAP.md)
- 🚧 **v1.5 UX & Polish** — Phases 12-13 (in progress)

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

<details>
<summary>✅ v1.3 Session Labels & CSV Export (Phase 8) — SHIPPED 2026-04-08</summary>

- [x] Phase 8: Session Labels & CSV Export (2/2 plans) — completed 2026-04-08

</details>

<details>
<summary>✅ v1.4 Code Quality & Tech Debt (Phases 9-11) — SHIPPED 2026-04-10</summary>

- [x] Phase 9: Backend Concurrency & Cleanup (2/2 plans) — completed 2026-04-09
- [x] Phase 10: Frontend Modernization (1/1 plans) — completed 2026-04-09
- [x] Phase 11: UI Hardening & Test Coverage (1/1 plans) — completed 2026-04-09

</details>

<details open>
<summary>🚧 v1.5 UX & Polish (Phases 12-13) — IN PROGRESS</summary>

- [ ] **Phase 12: Frontend UX & Accessibility** — Explicit label submit + aria-live announcements for reveal and consensus
- [ ] **Phase 13: Backend Logging Hygiene** — Audit, downgrade, PII-scrub, and configure production log level

</details>

## Phase Details

### Phase 12: Frontend UX & Accessibility
**Goal**: Session interactions feel deliberate and are perceivable by assistive tech — label broadcasts happen on explicit submit, and state transitions are announced to screen readers.
**Depends on**: Phase 11 (v1.4 shipped)
**Requirements**: UX-01, A11Y-01, A11Y-02
**Success Criteria** (what must be TRUE):
  1. Host can type freely in the round label TextField without any WebSocket broadcast; the label only propagates to participants when the host clicks the Set button or presses Enter (empty submissions clear the label; Set is disabled when input matches the last broadcast value).
  2. Non-host participants continue to see the read-only label exactly as before, with no behavioural regression.
  3. A screen reader user hears a single announcement when votes are revealed (e.g., "Votes revealed: 5 of 5 players voted"), delivered via a visually-hidden `aria-live="polite"` region — not repeated per WebSocket burst.
  4. A screen reader user hears the consensus value announced (e.g., "Consensus: 5") on auto-majority detection and again on host override, debounced against rapid changes.
  5. All existing Playwright e2e tests still pass, plus new coverage for Set-button and Enter-key label submission.
**Plans**: 2 plans
- [x] 12-01-PLAN.md — Explicit label submit (UX-01): Set button InputAdornment + Enter key, remove 300ms debounce
- [x] 12-02-PLAN.md — Screen reader announcements (A11Y-01, A11Y-02): LiveAnnouncer + reveal/consensus effects
**UI hint**: yes

### Phase 13: Backend Logging Hygiene
**Goal**: Production logs are quiet, privacy-preserving, and operator-friendly — lifecycle events at INFO, per-interaction noise at DEBUG, and no PII at any level.
**Depends on**: None (independent of Phase 12)
**Requirements**: LOG-01, LOG-02, LOG-03
**Success Criteria** (what must be TRUE):
  1. Every `logger.info()` / `logger.debug()` call under `planningpoker-api/src/main/java` has been audited; hot-path logs (`MessagingUtils` burst messaging, `VoteController` vote dispatch, per-message WebSocket activity) are emitted at DEBUG, and only lifecycle events (session create/destroy, host transfer, scheduled cleanup) remain at INFO.
  2. No log statement at any level emits a raw session ID, username, or vote value — diagnostics that need correlation use log-safe identifiers (e.g., session hash prefix, user count).
  3. `application.properties` sets a deliberate production log level (root INFO, application package INFO, hot-path classes WARN or env-configurable) and the setting is honored when running the packaged fat JAR.
  4. Running a full session end-to-end against the fat JAR produces INFO-level output that contains zero session IDs, usernames, or vote values.
  5. All backend unit tests continue to pass; no test relies on scrubbed log content.
**Plans**: 2 plans
- [x] 13-01-PLAN.md — LogSafeIds helper + scrub all logger calls + downgrade hot-path logs (LOG-01, LOG-02)
- [x] 13-02-PLAN.md — application.properties log level defaults with env overrides + regression guard test (LOG-03)

## Backlog

### Phase 999.1: Chat drawer with host moderation (BACKLOG)

**Goal:** Add a chat panel (left drawer) to planning poker sessions. Host can moderate (block/disable/enable chat). Users can send messages to each other in real-time. New joiners receive session message history.

**Requirements:** TBD

**Plans:** 2/2 plans complete

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
| 8. Session Labels & CSV Export | v1.3 | 2/2 | Complete | 2026-04-08 |
| 9. Backend Concurrency & Cleanup | v1.4 | 2/2 | Complete | 2026-04-09 |
| 10. Frontend Modernization | v1.4 | 1/1 | Complete    | 2026-04-09 |
| 11. UI Hardening & Test Coverage | v1.4 | 1/1 | Complete    | 2026-04-09 |
| 12. Frontend UX & Accessibility | v1.5 | 2/2 | Complete    | 2026-04-10 |
| 13. Backend Logging Hygiene | v1.5 | 2/2 | Complete    | 2026-04-10 |
