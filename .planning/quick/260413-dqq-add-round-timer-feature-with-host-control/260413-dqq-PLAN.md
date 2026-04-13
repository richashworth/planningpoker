---
phase: quick
plan: 260413-dqq
type: execute
wave: 1
depends_on: []
files_modified:
  - planningpoker-api/src/main/java/com/richashworth/planningpoker/model/TimerState.java
  - planningpoker-api/src/main/java/com/richashworth/planningpoker/model/CreateSessionRequest.java
  - planningpoker-api/src/main/java/com/richashworth/planningpoker/model/SessionResponse.java
  - planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java
  - planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java
  - planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/TimerController.java
  - planningpoker-api/src/main/java/com/richashworth/planningpoker/util/MessagingUtils.java
  - planningpoker-api/src/test/java/com/richashworth/planningpoker/service/SessionManagerTest.java
  - planningpoker-api/src/test/java/com/richashworth/planningpoker/controller/TimerControllerTest.java
  - planningpoker-web/src/actions/index.js
  - planningpoker-web/src/reducers/reducer_timer.js
  - planningpoker-web/src/reducers/index.js
  - planningpoker-web/src/hooks/useStomp.js
  - planningpoker-web/src/hooks/useTimer.js
  - planningpoker-web/src/hooks/useTimer.test.js
  - planningpoker-web/src/pages/CreateGame.jsx
  - planningpoker-web/src/containers/Vote.jsx
  - planningpoker-web/src/containers/Results.jsx
  - planningpoker-web/tests/e2e/timer.spec.js
autonomous: true
requirements:
  - TIMER-01
must_haves:
  truths:
    - "Host creating a game can toggle 'Enable round timer' and pick a preset duration (30s/1m/2m/5m/custom)"
    - "When timer is enabled, all participants see a timer chip on the round label row in Vote view"
    - "Host can start, pause, resume, and reset the timer via chip controls"
    - "Non-host users see a read-only countdown that stays in sync with host actions"
    - "Timer reaches 00:00 and shows 'Time's up' without auto-revealing votes"
    - "Advancing to Next Item resets the timer to its configured duration"
    - "Sessions created without the timer toggle behave exactly as before (backwards compatible)"
  artifacts:
    - path: "planningpoker-api/src/main/java/com/richashworth/planningpoker/model/TimerState.java"
      provides: "TimerState record DTO broadcast over /topic/timer/{sessionId}"
    - path: "planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/TimerController.java"
      provides: "POST /timer/configure|start|pause|resume|reset host-only endpoints"
    - path: "planningpoker-web/src/reducers/reducer_timer.js"
      provides: "Redux timer state slice"
    - path: "planningpoker-web/src/hooks/useTimer.js"
      provides: "Pure remainingSeconds calculator + STOMP dispatch helper"
    - path: "planningpoker-web/src/containers/Vote.jsx"
      provides: "Inline timer chip (Option B) on round label row with host controls"
    - path: "planningpoker-web/tests/e2e/timer.spec.js"
      provides: "Playwright e2e covering enable, start, pause, reset, next-item, backwards compat"
  key_links:
    - from: "TimerController"
      to: "MessagingUtils.sendTimerMessage"
      via: "broadcast after every mutation"
      pattern: "/topic/timer/"
    - from: "useStomp"
      to: "timerUpdated action"
      via: "STOMP subscription on /topic/timer/{sessionId}"
      pattern: "timerUpdated"
    - from: "Vote.jsx timer chip"
      to: "startTimer/pauseTimer/resumeTimer/resetTimer action creators"
      via: "host-only IconButton handlers"
      pattern: "dispatch\\((start|pause|resume|reset)Timer"
    - from: "Results.jsx handleNextItem"
      to: "resetTimer"
      via: "dispatched alongside existing reset flow"
      pattern: "resetTimer"
---

<objective>
Add a round timer to Planning Poker implementing Option B from docs/timer-mockups.html: an inline chip on the round-label row of Vote.jsx. Host toggles the feature during game setup, picks a default duration, and controls start/pause/resume/reset at runtime. All participants see a live, synchronized countdown.

Purpose: Give teams a lightweight time-box for estimation rounds without disrupting existing flows.
Output: Backend timer state + REST + WebSocket broadcast; frontend setup toggle, Redux slice, STOMP subscription, useTimer hook, Vote.jsx chip UI; backend + frontend + e2e tests; fully backwards compatible.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@CLAUDE.md
@docs/timer-mockups.html
@planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java
@planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java
@planningpoker-api/src/main/java/com/richashworth/planningpoker/util/MessagingUtils.java
@planningpoker-api/src/main/java/com/richashworth/planningpoker/config/WebSocketConfig.java
@planningpoker-web/src/containers/Vote.jsx
@planningpoker-web/src/pages/CreateGame.jsx
@planningpoker-web/src/actions/index.js
@planningpoker-web/src/hooks/useStomp.js
@planningpoker-web/src/reducers/reducer_game.js

<interfaces>
<!-- Key contracts the executor will extend. -->

Existing CreateSessionRequest (extend with two optional fields):
```java
// Current body params used: userName, schemeType, customValues, includeUnsure
// Add: Boolean timerEnabled, Integer timerDefaultSeconds  (both nullable for BC)
```

Existing SessionResponse (extend with optional timer config):
```java
// Current: host, sessionId, schemeType, values, includeUnsure
// Add: TimerState timer  (nullable when timer feature not enabled)
```

New TimerState DTO:
```java
public record TimerState(
    boolean enabled,
    int durationSeconds,
    Long startedAt,           // epoch ms, null when idle
    Long pausedAt,            // epoch ms, null when not paused
    long accumulatedPausedMs, // total paused ms across pause/resume cycles
    long serverNow            // System.currentTimeMillis() at send time
) {}
```

Existing SessionManager admin lookup: `sessionManager.getHost(sessionId)` returns the host username (first registered user, transferred on leave). Host-only enforcement pattern already in `GameController.kickUser`:
```java
if (!userName.equalsIgnoreCase(sessionManager.getHost(sessionId))) {
  throw new HostActionException("only the host can perform this action");
}
```

Existing MessagingUtils topic pattern:
```java
public static final String TOPIC_RESULTS = "/topic/results/";
public static final String TOPIC_USERS = "/topic/users/";
// Add: TOPIC_TIMER = "/topic/timer/";
// Add: sendTimerMessage(String sessionId)
```

Existing useStomp subscription pattern: caller passes `topics: [...]` and single `onMessage(body)` callback. Extend caller in PlayGame/GamePane to also subscribe `/topic/timer/{sessionId}` and dispatch `timerUpdated(body.payload)` when `body.type === 'TIMER_MESSAGE'`.

Existing Redux action creator pattern (see `vote`, `setLabel`): thunk → axios.post → dispatch typed action with payload/meta.

Remaining seconds calculation (pure function exported from useTimer.js):
```js
export function computeRemainingSeconds(timer, nowMs) {
  if (!timer.enabled || !timer.startedAt) return timer.durationSeconds
  const reference = timer.pausedAt ?? nowMs
  const elapsedMs = reference - timer.startedAt - timer.accumulatedPausedMs
  return Math.max(0, timer.durationSeconds - Math.floor(elapsedMs / 1000))
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Backend timer state, controller, broadcast + tests</name>
  <files>
    planningpoker-api/src/main/java/com/richashworth/planningpoker/model/TimerState.java,
    planningpoker-api/src/main/java/com/richashworth/planningpoker/model/CreateSessionRequest.java,
    planningpoker-api/src/main/java/com/richashworth/planningpoker/model/SessionResponse.java,
    planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java,
    planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java,
    planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/TimerController.java,
    planningpoker-api/src/main/java/com/richashworth/planningpoker/util/MessagingUtils.java,
    planningpoker-api/src/test/java/com/richashworth/planningpoker/service/SessionManagerTest.java,
    planningpoker-api/src/test/java/com/richashworth/planningpoker/controller/TimerControllerTest.java
  </files>
  <action>
1. Create `TimerState` record with fields `enabled`, `durationSeconds`, `startedAt` (Long nullable), `pausedAt` (Long nullable), `accumulatedPausedMs` (long), `serverNow` (long). Provide a static `idle(boolean enabled, int durationSeconds)` factory returning `new TimerState(enabled, durationSeconds, null, null, 0L, System.currentTimeMillis())`.

2. Extend `CreateSessionRequest` record with `Boolean timerEnabled` and `Integer timerDefaultSeconds` (nullable for backwards compatibility). Ensure Jackson deserializes missing fields to null.

3. Extend `SessionResponse` record with `TimerState timer` field (nullable). Update all existing constructors/callers in `GameController.joinSession` and `createSession` to pass `sessionManager.getTimerState(sessionId)` (null if timer feature not configured — use record with enabled=false default so frontend always gets a concrete shape; prefer: always return a TimerState, defaulting to `TimerState.idle(false, 60)`).

4. In `SessionManager`:
   - Add `private final ConcurrentHashMap<String, TimerState> sessionTimers = new ConcurrentHashMap<>();`
   - Add `getTimerState(String sessionId)` returning map value or `TimerState.idle(false, 60)`.
   - Add `configureTimer(sessionId, enabled, durationSeconds)` validating `durationSeconds` in [5, 3600]; stores fresh idle TimerState preserving config.
   - Add `startTimer(sessionId)` — sets `startedAt = now`, `pausedAt = null`, `accumulatedPausedMs = 0`.
   - Add `pauseTimer(sessionId)` — no-op if already paused or not started; sets `pausedAt = now`.
   - Add `resumeTimer(sessionId)` — if `pausedAt != null`, add `(now - pausedAt)` to `accumulatedPausedMs`, clear `pausedAt`.
   - Add `resetTimerRuntime(sessionId)` — clears `startedAt`, `pausedAt`, zeroes `accumulatedPausedMs`, preserves `enabled` + `durationSeconds`.
   - In `createSession(SchemeConfig, ...)` overload OR a new overload `createSession(SchemeConfig, boolean timerEnabled, int timerDefaultSeconds)` — initialize timer. Keep old overload as default (timer disabled, 60s).
   - In `resetSession(sessionId)` — also call `resetTimerRuntime` (keeps config, resets runtime).
   - In `clearSessions()` — `sessionTimers.clear()`.
   - In `evictIdleSessions()` and `removeUser` cleanup — `sessionTimers.remove(sessionId)` alongside existing cleanup.
   All mutations must `touchSession(sessionId)` and update `serverNow` in the stored TimerState to `System.currentTimeMillis()`.

5. Extend `GameController.createSession` to pass `request.timerEnabled() != null && request.timerEnabled()` and `request.timerDefaultSeconds() != null ? request.timerDefaultSeconds() : 60` into `SessionManager.createSession`. Include `sessionManager.getTimerState(sessionId)` in the returned `SessionResponse`. Do the same in `joinSession` response.

6. Create `TimerController` with endpoints (all `@PostMapping`, body `@RequestParam` using form-encoded params to match existing conventions):
   - `/timer/configure` params: sessionId, userName, enabled (boolean), durationSeconds (int)
   - `/timer/start`, `/timer/pause`, `/timer/resume`, `/timer/reset` params: sessionId, userName
   Each endpoint: synchronized on sessionManager → `validateSessionMembership` → host check (throw `HostActionException("only the host can perform this action")`) → call corresponding SessionManager method → `messagingUtils.sendTimerMessage(sessionId)`. Log host action with hashed ids. Copy the validation patterns from `GameController.kickUser`.

7. Extend `MessagingUtils`:
   - Add `public static final String TOPIC_TIMER = "/topic/timer/";`
   - Add `public void sendTimerMessage(String sessionId)` — builds `TimerState` with fresh `serverNow`, wraps in `new Message(MessageType.TIMER_MESSAGE, timerState)`, sends via `template.convertAndSend`. NO burst — timer state is authoritative and idempotent; single send suffices (document this in a code comment).
   - Add `TIMER_MESSAGE` to `MessageType` enum.

8. Tests:
   - `SessionManagerTest`: add tests for configureTimer validation, start/pause/resume/reset transitions, `resetSession` preserves config but clears runtime, `clearSessions` wipes timers, default `getTimerState` returns idle disabled with 60s.
   - Create `TimerControllerTest` mirroring `GameControllerTest` structure: mock SessionManager + MessagingUtils; cover happy path for each endpoint, non-host rejection (HostActionException), unknown session (IllegalArgumentException), non-member rejection.

All existing backend tests must still pass — run them. Run `./gradlew planningpoker-api:spotlessApply` before verifying.
  </action>
  <verify>
    <automated>cd /Users/richard/Projects/planningpoker && ./gradlew planningpoker-api:spotlessCheck planningpoker-api:test</automated>
  </verify>
  <done>
    Backend compiles, spotlessCheck passes, all existing tests pass, new SessionManager timer tests pass, new TimerControllerTest passes. `GET /refresh` / `POST /createSession` still serve existing clients unchanged (SessionResponse.timer default is idle/disabled).
  </done>
</task>

<task type="auto">
  <name>Task 2: Frontend timer Redux slice, actions, STOMP subscription, CreateGame toggle, useTimer hook + unit test</name>
  <files>
    planningpoker-web/src/actions/index.js,
    planningpoker-web/src/reducers/reducer_timer.js,
    planningpoker-web/src/reducers/index.js,
    planningpoker-web/src/hooks/useStomp.js,
    planningpoker-web/src/hooks/useTimer.js,
    planningpoker-web/src/hooks/useTimer.test.js,
    planningpoker-web/src/pages/CreateGame.jsx
  </files>
  <action>
1. `actions/index.js`:
   - Add action type constants: `TIMER_UPDATED = 'timer-updated'`, `CONFIGURE_TIMER = 'configure-timer'`, `START_TIMER = 'start-timer'`, `PAUSE_TIMER = 'pause-timer'`, `RESUME_TIMER = 'resume-timer'`, `RESET_TIMER = 'reset-timer'`.
   - Add event creator `timerUpdated = (timer) => ({ type: TIMER_UPDATED, payload: timer })`.
   - Add five thunks (`configureTimer`, `startTimer`, `pauseTimer`, `resumeTimer`, `resetTimer`) following the `vote`/`resetSession` pattern: POST `URLSearchParams` to `${API_ROOT_URL}/timer/{action}`; dispatch typed action on success; dispatch `showError` on failure.
     - `configureTimer(userName, sessionId, enabled, durationSeconds)` includes `enabled`, `durationSeconds` in params.
     - Start/pause/resume/reset take `(userName, sessionId)`.
   - Extend `createGame` thunk: accept `timerOptions = { timerEnabled, timerDefaultSeconds }` (optional 3rd arg; shift existing `onSuccess` to 4th arg OR, to preserve call sites, accept it as part of schemeOptions). **Preferred:** extend `schemeOptions` to also carry `timerEnabled` and `timerDefaultSeconds`; include them in the POST body as `timerEnabled` and `timerDefaultSeconds`. This preserves the existing `createGame(playerName, schemeOptions, onSuccess)` signature. Only send when defined.

2. Create `reducers/reducer_timer.js`:
   ```js
   import { TIMER_UPDATED, RESET_SESSION, LEAVE_GAME, KICKED, CREATE_GAME, JOIN_GAME } from '../actions'
   const initial = { enabled: false, durationSeconds: 60, startedAt: null, pausedAt: null, accumulatedPausedMs: 0, serverNow: 0, lastReceivedAt: 0 }
   export default function (state = initial, action) {
     switch (action.type) {
       case CREATE_GAME:
       case JOIN_GAME:
         if (action.error || !action.payload?.timer) return state
         return { ...state, ...action.payload.timer, lastReceivedAt: Date.now() }
       case TIMER_UPDATED:
         if (!action.payload) return state
         return { ...state, ...action.payload, lastReceivedAt: Date.now() }
       case LEAVE_GAME:
       case KICKED:
         return initial
       default:
         return state
     }
   }
   ```
   Register it in `reducers/index.js` under key `timer`.

3. `hooks/useStomp.js`: no structural change needed — callers already pass the topic list. But caller (PlayGame / GamePane — locate the one that already subscribes to results+users) must be extended to also include `/topic/timer/{sessionId}` and in its `onMessage` dispatch `timerUpdated(body.payload)` when `body.type === 'TIMER_MESSAGE'`. Make that edit here (grep for existing `topic/results/` usage to find the caller — in this step, update whichever file already constructs the topics array: most likely `PlayGame.jsx` or `GamePane.jsx`). Keep this surgical: only add the timer topic and one additional case in the onMessage switch.

4. Create `hooks/useTimer.js`:
   ```js
   import { useSelector } from 'react-redux'
   import { useEffect, useState } from 'react'

   export function computeRemainingSeconds(timer, nowMs) {
     if (!timer.enabled) return timer.durationSeconds
     if (!timer.startedAt) return timer.durationSeconds
     const reference = timer.pausedAt ?? nowMs
     const elapsedMs = reference - timer.startedAt - timer.accumulatedPausedMs
     return Math.max(0, timer.durationSeconds - Math.floor(elapsedMs / 1000))
   }

   export function useTimer() {
     const timer = useSelector((s) => s.timer)
     const [now, setNow] = useState(() => Date.now())
     useEffect(() => {
       if (!timer.enabled || !timer.startedAt || timer.pausedAt) return
       const id = setInterval(() => setNow(Date.now()), 500)
       return () => clearInterval(id)
     }, [timer.enabled, timer.startedAt, timer.pausedAt])
     const remainingSeconds = computeRemainingSeconds(timer, now)
     const running = Boolean(timer.enabled && timer.startedAt && !timer.pausedAt && remainingSeconds > 0)
     const paused = Boolean(timer.enabled && timer.startedAt && timer.pausedAt)
     const expired = Boolean(timer.enabled && timer.startedAt && remainingSeconds === 0)
     return { timer, remainingSeconds, running, paused, expired }
   }
   ```

5. Create `hooks/useTimer.test.js` (Vitest): test `computeRemainingSeconds` for idle, running mid-flight, paused (frozen), expired (clamped to 0), disabled (returns durationSeconds). Use fixed `startedAt` and `nowMs` values — no timers, no React.

6. `pages/CreateGame.jsx`: add local state `timerEnabled` (default false) and `timerDefaultSeconds` (default 60). Add a new section above the Start Game button:
   - `FormControlLabel` + `Switch` "Enable round timer" controlling `timerEnabled`.
   - When enabled, render an MUI `Select` with options 30/60/120/300 labeled "30 seconds / 1 minute / 2 minutes / 5 minutes" plus "Custom…"; when Custom selected, show a number `TextField` (min 5, max 3600).
   - Match existing `sx={{ mb: 2.5 }}` spacing style.
   - Pass `{ ...schemeOptions, timerEnabled, timerDefaultSeconds }` into the existing `createGame` dispatch.

Run `npm run lint` and `npm run format:check` (or Prettier check — match existing npm scripts) and Vitest.
  </action>
  <verify>
    <automated>cd /Users/richard/Projects/planningpoker/planningpoker-web && npm run lint && npx prettier --check . && npx vitest run src/hooks/useTimer.test.js</automated>
  </verify>
  <done>
    Lint + Prettier clean; `useTimer.test.js` passes all cases (idle/running/paused/expired/disabled); CreateGame renders timer toggle + duration selector; Redux `timer` slice registered and updated by CREATE_GAME/JOIN_GAME/TIMER_UPDATED; STOMP subscription includes `/topic/timer/{sessionId}`; no regressions in existing Vitest suite.
  </done>
</task>

<task type="auto">
  <name>Task 3: Vote.jsx timer chip UI, Results Next-Item reset wiring, Playwright e2e</name>
  <files>
    planningpoker-web/src/containers/Vote.jsx,
    planningpoker-web/src/containers/Results.jsx,
    planningpoker-web/tests/e2e/timer.spec.js
  </files>
  <action>
1. `containers/Vote.jsx`:
   - Import `useTimer` from `../hooks/useTimer` and `startTimer`, `pauseTimer`, `resumeTimer`, `resetTimer`, `configureTimer` from `../actions`.
   - Import MUI `Chip`, `IconButton`, `Menu`, `MenuItem`, `Tooltip`, plus icons `PlayArrow`, `Pause`, `Replay`, `Timer`, `MoreVert` from `@mui/icons-material`.
   - Inside component, call `const { timer, remainingSeconds, running, paused, expired } = useTimer()`.
   - Add helper `formatMMSS(seconds)` → `` `${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}` ``.
   - Determine visual state: `idle` (not started), `running`, `paused`, `warn` (running && remainingSeconds <= 10), `danger` (running && remainingSeconds <= 3), `expired`. Map to chip `color` + `sx` styles per `docs/timer-mockups.html` Option B. Danger state uses a pulse keyframe: `@keyframes pp-timer-pulse { 0%,100% { opacity:1 } 50% { opacity:0.55 } }` applied via `sx={{ animation: 'pp-timer-pulse 1s ease-in-out infinite' }}`.
   - Render the timer chip only when `timer.enabled`. Place it on the round-label row to the RIGHT of the label TextField. Wrap the existing label `Box` and the chip in a flex container: `sx={{ display:'flex', alignItems:'center', gap:1, mb:2, minHeight:40 }}`. The label TextField/Typography stays on the left with `flex:1`, chip on the right.
   - Chip label content:
     - idle: "Timer NN:NN" (shows configured duration, no countdown)
     - running / warn / danger: the countdown "NN:NN"
     - paused: countdown + "paused" caption
     - expired: "Time's up"
   - Host-only affordances (right side of chip): small `IconButton`s.
     - idle → PlayArrow (dispatch `startTimer`)
     - running → Pause (dispatch `pauseTimer`) + Replay (dispatch `resetTimer`)
     - paused → PlayArrow (dispatch `resumeTimer`) + Replay (dispatch `resetTimer`)
     - expired → Replay only
     - Plus a `MoreVert` IconButton opening a `Menu` with duration presets (30s, 1m, 2m, 5m) — selecting dispatches `configureTimer(playerName, sessionId, true, chosenSeconds)` then `resetTimer` to clear runtime.
   - Non-hosts: render the chip label only (no IconButtons, no menu).
   - All buttons get `aria-label`s: "Start timer", "Pause timer", "Resume timer", "Reset timer", "Timer options".

2. `containers/Results.jsx`:
   - Find existing `handleNextItem` (or equivalent "Next Item" handler that dispatches `resetSession`) and ALSO dispatch `resetTimer(playerName, sessionId)` immediately after (or before — order doesn't matter, both are idempotent). Only dispatch if `timer.enabled` — read via `useSelector((s) => s.timer.enabled)`.
   - If Results.jsx doesn't actually host Next Item (it may be in GamePane.jsx), grep for `resetSession(` usage and colocate the `resetTimer` dispatch there instead. Match whichever component owns the handler.

3. Playwright e2e `tests/e2e/timer.spec.js`. Use existing tests as templates (copy helper patterns from `tests/e2e/*.spec.js`). Cover:
   - **Backwards compat**: create a session WITHOUT toggling timer → Vote page has no timer chip (`await expect(page.getByRole('button', { name: /start timer/i })).toHaveCount(0)`).
   - **Enable + visible**: create a session WITH timer toggle on, duration 1 minute → host sees chip with label "Timer 01:00" and a Start button.
   - **Start + tick**: open 2 browser contexts (host + joiner). Host clicks Start. After ~2 seconds, both pages show a countdown value less than 01:00. Use `expect.poll` with a 5s timeout.
   - **Pause freeze**: host clicks Pause → both pages' chip value is identical and stays stable for 1.5s.
   - **Reset**: host clicks Reset → both pages show "Timer 01:00" again.
   - **Next Item resets timer**: host starts timer, waits, clicks Next Item → both pages show "Timer 01:00" again and the chip is back to idle Start state.
   Use `LEGAL_ESTIMATES` etc. as per existing specs. Ensure Playwright config still targets port 9000.

Run ESLint/Prettier again to cover Vote.jsx/Results.jsx/e2e spec edits. Playwright requires backend running on 9000 — instructions per CLAUDE.md: build web, build fat jar, start it, then `npx playwright test tests/e2e/timer.spec.js`. Also run the full existing e2e suite afterwards to confirm no regressions.
  </action>
  <verify>
    <automated>cd /Users/richard/Projects/planningpoker/planningpoker-web && npm run lint && npx prettier --check . && cd /Users/richard/Projects/planningpoker && ./gradlew planningpoker-web:jar planningpoker-api:bootJar &amp;&amp; (java -jar planningpoker-api/build/libs/planningpoker-api-*.jar &amp; echo $! &gt; /tmp/pp-timer.pid; sleep 8; cd planningpoker-web &amp;&amp; npx playwright test; RC=$?; kill $(cat /tmp/pp-timer.pid) 2&gt;/dev/null; exit $RC)</automated>
  </verify>
  <done>
    Vote.jsx renders timer chip inline on label row only when enabled. Host sees controls; non-host sees read-only chip. Next Item resets timer. Full Playwright suite (existing + new timer.spec.js) is green. Lint + Prettier clean. No regressions in backend tests.
  </done>
</task>

</tasks>

<verification>
- Backend: `./gradlew planningpoker-api:spotlessCheck planningpoker-api:test` passes
- Frontend unit: `npx vitest run` passes including new `useTimer.test.js`
- Lint/format: `npm run lint && npx prettier --check .` pass
- E2E: full Playwright suite passes including new `timer.spec.js`
- Backwards compat: a session created without timer toggle renders exactly as before (no chip, no extra network calls)
- Manual sanity: timer chip matches Option B visual in `docs/timer-mockups.html`
</verification>

<success_criteria>
- All `must_haves.truths` observable in a running session
- All `must_haves.artifacts` exist
- All `must_haves.key_links` wired
- Zero regressions: every previously-passing test still passes
- `SessionResponse` remains backwards compatible (timer field defaults to idle/disabled)
</success_criteria>

<output>
After completion, create `.planning/quick/260413-dqq-add-round-timer-feature-with-host-contro/260413-dqq-SUMMARY.md` documenting:
- Files touched
- Backend endpoints added
- Redux shape changes
- Test counts (backend unit added, frontend unit added, e2e added)
- Any deviations from the plan
</output>
