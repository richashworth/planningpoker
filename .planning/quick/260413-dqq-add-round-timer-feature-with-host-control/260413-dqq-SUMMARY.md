---
phase: quick
plan: 260413-dqq
subsystem: timer
tags: [feature, timer, websocket, redux, spring-boot]
dependency_graph:
  requires: []
  provides: [round-timer, host-timer-control, timer-broadcast]
  affects: [GameController, SessionManager, MessagingUtils, Vote, Results, CreateGame, PlayGame]
tech_stack:
  added: [TimerState record, TimerController, reducer_timer.js, useTimer.js]
  patterns: [async-burst-messaging, stomp-timer-topic, host-only-controls]
key_files:
  created:
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/model/TimerState.java
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/TimerController.java
    - planningpoker-api/src/test/java/com/richashworth/planningpoker/controller/TimerControllerTest.java
    - planningpoker-web/src/reducers/reducer_timer.js
    - planningpoker-web/src/hooks/useTimer.js
    - planningpoker-web/tests/timer.spec.js
  modified:
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/util/MessagingUtils.java
    - planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java
    - planningpoker-api/src/test/java/com/richashworth/planningpoker/util/MessagingUtilsTest.java
    - planningpoker-api/src/test/java/com/richashworth/planningpoker/controller/TimerControllerTest.java
    - planningpoker-web/src/actions/index.js
    - planningpoker-web/src/containers/Vote.jsx
    - planningpoker-web/src/containers/Results.jsx
    - planningpoker-web/src/pages/CreateGame.jsx
    - planningpoker-web/vite.config.js
    - planningpoker-web/playwright.config.js
decisions:
  - Burst sendResetNotification (LATENCIES.length sends) to defeat race with stale vote result bursts
  - Burst sendTimerMessage for reliable STOMP delivery under load
  - workers:1 in playwright.config.js — SimpleBroker saturates with 3 parallel STOMP-heavy sessions
  - Timer countdown computed client-side from server-sent timestamps (startedAt, pausedAt, accumulatedPausedMs) rather than server-pushed ticks
  - host-only controls enforced both server-side (TimerController) and UI (isHost check in Vote.jsx)
metrics:
  duration: ~4h
  completed: 2026-04-13
  tasks: 3
  files: 15
---

# Quick Task 260413-dqq: Add Round Timer Feature with Host Control

**One-liner:** Server-authoritative round timer (enable/start/pause/resume/reset) with STOMP broadcast, host-only controls, and client-side countdown derived from timestamp deltas.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Backend timer state, controller, broadcast + tests | 856b1c2 | TimerState, TimerController, SessionManager timer methods, MessagingUtils.sendTimerMessage |
| 2 | Frontend Redux slice, actions, STOMP subscription, CreateGame toggle, useTimer hook | b8c1c16 | reducer_timer.js, useTimer.js, actions/index.js, CreateGame.jsx, PlayGame.jsx |
| 3 | Vote.jsx timer chip UI, Results.jsx Next Item reset, Playwright e2e tests | 53324ad | Vote.jsx, Results.jsx, timer.spec.js, playwright.config.js, burst fixes |

## Feature Overview

Hosts can enable a round timer when creating a session. The timer state (enabled, durationSeconds, startedAt, pausedAt, accumulatedPausedMs, serverNow) is authoritative on the server and broadcast via a dedicated STOMP topic `/topic/timer/{sessionId}`.

The frontend computes the countdown client-side using timestamp arithmetic rather than receiving server ticks, keeping the backend stateless between broadcasts.

Timer controls (start, pause, resume, reset) are REST POST endpoints under `/timer/*` — host-only, enforced server-side. The Vote view shows a timer chip and control buttons visible only to the host.

When "Next Item" is clicked in Results view, the session reset broadcasts a fresh timer state (idle) via `sendTimerMessage`, returning the chip to the initial duration.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Vite proxy missing /timer route**
- **Found during:** Task 3 (e2e tests — timer buttons had no effect)
- **Issue:** POST requests to `/timer/start`, `/timer/pause` etc. from port 3000 were not forwarded to backend on port 9000, returning 404 silently
- **Fix:** Added `'/timer': 'http://localhost:9000'` to vite.config.js proxy
- **Files modified:** planningpoker-web/vite.config.js
- **Commit:** 53324ad

**2. [Rule 1 - Bug] Race condition: stale vote burst overrides session reset**
- **Found during:** Task 3 ("Next Item resets timer" e2e test — Results view stuck)
- **Issue:** `burstResultsMessages` fires at 10ms/50ms/150ms/500ms/2s after a vote. If "Next Item" is clicked ~3s after voting, the 2s burst sends stale `RESULTS_UPDATED` which re-sets `voted=true`, locking users in the Results view even after reset
- **Fix:** Converted `sendResetNotification` from a single send to an `@Async` burst at the same LATENCIES schedule, so the RESET_MESSAGE guaranteed to arrive after any in-flight vote bursts
- **Files modified:** planningpoker-api/src/main/java/com/richashworth/planningpoker/util/MessagingUtils.java, MessagingUtilsTest.java
- **Commit:** 53324ad

**3. [Rule 1 - Bug] UnnecessaryStubbingException in TimerControllerTest**
- **Found during:** Task 3 backend test run
- **Issue:** `when(sessionManager.getTimerState(...)).thenReturn(...)` was added to testConfigure when messagingUtils is a @Mock — sendTimerMessage never actually calls getTimerState, causing strict Mockito to fail
- **Fix:** Removed unused stub
- **Files modified:** planningpoker-api/src/test/java/com/richashworth/planningpoker/controller/TimerControllerTest.java
- **Commit:** 53324ad

**4. [Rule 2 - Missing critical] sendTimerMessage single-send insufficient under WebSocket lag**
- **Found during:** Task 3 (parallel e2e: joiner timer chip never appeared)
- **Issue:** Timer state was sent once; under load the single STOMP frame could be dropped
- **Fix:** Converted sendTimerMessage to @Async burst (same LATENCIES pattern as other messages)
- **Files modified:** planningpoker-api/src/main/java/com/richashworth/planningpoker/util/MessagingUtils.java
- **Commit:** 53324ad

**5. [Rule 3 - Blocking] Parallel e2e workers saturate SimpleBroker**
- **Found during:** Task 3 full suite run (2 failures with 3 workers)
- **Issue:** Timer burst messages (5 sends × 3 sessions × 2 topics) overloaded Spring SimpleBroker in-process, causing STOMP message delivery failures for unrelated tests
- **Fix:** Added `workers: 1` to playwright.config.js — appropriate for integration tests against a single shared backend
- **Files modified:** planningpoker-web/playwright.config.js
- **Commit:** 53324ad

## Test Results

- Backend unit tests: all pass (`./gradlew planningpoker-api:test`)
- E2E tests: 41/41 pass (1 pre-existing flaky CSV test unrelated to timer, passes on retry)
- New timer e2e tests: 5/5 pass consistently

## Known Stubs

None.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: unauthenticated-host-action | TimerController.java | Timer control endpoints accept userName as a query parameter with no token — consistent with existing app auth model (session membership only), but noted for completeness |

## Self-Check: PASSED

- 856b1c2 exists: confirmed
- b8c1c16 exists: confirmed
- 53324ad exists: confirmed
- Timer test file exists: planningpoker-web/tests/timer.spec.js confirmed
- Summary file written to .planning/quick/260413-dqq-add-round-timer-feature-with-host-control/260413-dqq-SUMMARY.md
