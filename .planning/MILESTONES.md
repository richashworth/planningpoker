# Milestones

## v1.5 UX & Polish (Shipped: 2026-04-10)

**Phases completed:** 2 phases, 4 plans
**Stats:** 25 files changed, +2,193 / -217 lines | Git range: `774c090..323eda5`

**Key accomplishments:**

- Explicit label submit (UX-01): `Vote.jsx` Set button + Enter handler replaces 300ms debounced live-broadcast; empty submissions clear the label, Set disabled when input matches last broadcast
- Screen-reader announcements (A11Y-01, A11Y-02): visually-hidden `LiveAnnouncer.jsx` aria-live region announces vote reveal ("Votes revealed: N of M") and consensus, deduped via `useRef` latches
- PII scrubbing (LOG-01, LOG-02): `LogSafeIds` helper with unit tests; `GameController`, `VoteController`, `SessionManager` log statements scrubbed — no raw session IDs, usernames, or vote values at any level
- Hot-path log downgrade: `MessagingUtils` burst messaging, `VoteController` dispatch, and per-message WebSocket activity moved from INFO to DEBUG; only lifecycle events remain at INFO
- Production log config (LOG-03): deliberate default levels in `application.properties` with env-var overrides (`LOG_LEVEL_ROOT`, `LOG_LEVEL_SPRING`, `LOG_LEVEL_APP`, `LOG_LEVEL_HOTPATH`), honored by fat JAR
- `LoggingHygieneTest` regression guard: AST-aware scanner prevents raw PII from re-entering logger calls

---

## v1.4 Code Quality & Tech Debt (Shipped: 2026-04-10)

**Phases completed:** 3 phases, 4 plans

**Key accomplishments:**

- SessionManager thread-safety: `createSession` and `removeUser` made synchronized, closing TOCTOU races and ensuring atomic eviction; dead `getSessions()` removed
- Burst messaging snapshot consistency: `burstResultsMessages` captures a single `Message` before the async loop so all 6 bursts send an immutable payload
- Redux Toolkit migration: replaced `createStore` + `redux-promise` with `configureStore` from `@reduxjs/toolkit`; removed dead `/topic/items/` subscription; added Suspense fallback
- `useStomp` hook test coverage extended from 7 to 14 tests — covers reconnect lifecycle, `onConnect`/`onDisconnect`/`onStompError`/`onWebSocketClose` state transitions, and pre-connect guards
- UI hardening verified already-met: JoinGame/CreateGame loading states, Snackbar-based error notifications, and full vote revert (flag + optimistic result) all confirmed in codebase

---

## v1.3 Session Labels & CSV Export (Shipped: 2026-04-08)

**Phases completed:** 1 phase, 2 plans
**Stats:** 27 files changed, +1,507 / -31 lines

**Key accomplishments:**

- Round labelling: host sets label via debounced TextField, broadcast to all via enriched WebSocket payload
- Auto-majority consensus with host override dropdown on Results screen
- Round history accumulates across resets in Redux (reducer_rounds.js)
- Client-side CSV export with per-player votes, stats, timestamps, and formula injection protection
- Tech debt cleanup: Vote.jsx stale state sync, burstResultsMessages moved outside synchronized block

---

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
