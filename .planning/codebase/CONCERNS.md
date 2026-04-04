# Codebase Concerns

**Analysis Date:** 2026-04-04

## Tech Debt

**Frontend uses legacy Redux patterns (no RTK):**
- Issue: Redux store is created with `createStore` + `applyMiddleware` (deprecated API). Middleware is `redux-promise` (v0.6.0, last published 2016), which mutates action payloads in ways that conflict with modern Redux. No Redux Toolkit (`@reduxjs/toolkit`) is used.
- Files: `planningpoker-web/src/App.jsx`, `planningpoker-web/src/actions/index.js`
- Impact: `createStore` emits a deprecation warning in the console. `redux-promise` resolves promises directly onto `action.payload`, so reducers receive the raw Axios response object rather than typed data — this works today but is fragile and non-obvious. Adding new async actions requires careful adherence to the same unusual pattern.
- Fix approach: Migrate to Redux Toolkit (`configureStore`, `createSlice`, `createAsyncThunk`). Replace `redux-promise` with `createAsyncThunk`. This is a contained refactor with no API or backend changes needed.

**Reducers are anonymous functions:**
- Issue: All four reducers in `planningpoker-web/src/reducers/` export anonymous default functions (e.g. `export default function (state = ..., action)`). This makes stack traces and Redux DevTools harder to read.
- Files: `planningpoker-web/src/reducers/reducer_game.js`, `reducer_results.js`, `reducer_users.js`, `reducer_vote.js`
- Impact: Minor developer experience issue; no runtime effect.
- Fix approach: Name the functions (e.g. `export default function gameReducer(...)`).

**`getSessions()` exposes internal mutable Multimap:**
- Issue: `SessionManager.getSessions()` returns the raw `ListMultimap<String, String>` reference (the synchronized wrapper), not a defensive copy. It is only referenced in one test; no controller uses it today. If a future controller calls it, callers could mutate session state outside the synchronized blocks in the controllers.
- Files: `planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java` (line 63)
- Impact: Potential silent data corruption if the method is ever used in production code.
- Fix approach: Either remove the method (it is unused in production paths) or return an immutable copy: `return ImmutableListMultimap.copyOf(sessionUsers)`.

**`TOPIC_ITEM` constant is defined but never sent:**
- Issue: `MessagingUtils.TOPIC_ITEM = "/topic/item/"` is defined in the backend but no code ever publishes to it. The frontend subscribes to `/topic/items/${sessionId}` (note: plural, and a different path) in `PlayGame.jsx`. No messages are ever delivered on this topic.
- Files: `planningpoker-api/src/main/java/com/richashworth/planningpoker/util/MessagingUtils.java` (line 19), `planningpoker-web/src/pages/PlayGame.jsx` (line 29)
- Impact: Dead subscription in the frontend. No messages are lost today since the feature (current item broadcast) does not exist yet, but the path mismatch (`/topic/item/` vs `/topic/items/`) will cause a silent failure when it is implemented.
- Fix approach: Align paths before implementing the feature: choose either singular or plural and update both sides. Remove the dead frontend subscription or implement the backend publisher.

**`COFFEE_SYMBOL` is excluded from frontend `LEGAL_ESTIMATES` constant but appended separately in Vote:**
- Issue: `Constants.js` exports `LEGAL_ESTIMATES` without the coffee symbol, then `Vote.jsx` constructs `allValues = [...LEGAL_ESTIMATES, COFFEE_SYMBOL]`. If a future component iterates `LEGAL_ESTIMATES` expecting to include coffee, it will miss it. The backend `LEGAL_ESTIMATES` set in `VoteController.java` does include `\u2615`, so the backend is consistent.
- Files: `planningpoker-web/src/config/Constants.js`, `planningpoker-web/src/containers/Vote.jsx`
- Impact: Minor inconsistency; risk of regression if constants are reused without reviewing the Vote component.
- Fix approach: Either include `COFFEE_SYMBOL` in the exported `LEGAL_ESTIMATES` array or keep the pattern but document the intent clearly.

**Burst messaging uses blocking `Thread.sleep` on async threads:**
- Issue: `MessagingUtils.burstResultsMessages` and `burstUsersMessages` are `@Async` but call `Clock.pause()` which uses `Thread.sleep`. This holds async thread-pool threads (pool size max 8) for up to ~2.7 seconds per burst (sum of 10+50+150+500+2000ms latencies).
- Files: `planningpoker-api/src/main/java/com/richashworth/planningpoker/util/MessagingUtils.java`, `planningpoker-api/src/main/java/com/richashworth/planningpoker/util/Clock.java`, `planningpoker-api/src/main/java/com/richashworth/planningpoker/config/AsyncConfig.java`
- Impact: Under concurrent load, all 8 async threads can be blocked simultaneously, causing new burst requests to fall to `CallerRunsPolicy` (executed on the HTTP request thread, blocking the response). This degrades latency for all users when multiple votes arrive simultaneously.
- Fix approach: Replace `Thread.sleep` with scheduled tasks (`ScheduledExecutorService`) or Spring's `TaskScheduler` so threads are not held during delays.

## Known Bugs

**Vote state is not reset when the host clicks "Next Item" for non-host players:**
- Symptoms: After the host resets the session, non-host players see the results view persist briefly until the WebSocket `RESULTS_UPDATED` message arrives with an empty payload. If the WebSocket is slow or disconnected, non-host players remain stuck on the results view.
- Files: `planningpoker-web/src/reducers/reducer_vote.js` (line 11), `planningpoker-web/src/reducers/reducer_results.js` (line 14)
- Trigger: Reset on a slow or briefly-disconnected WebSocket connection.
- Workaround: The 8-second fallback refresh poll in `PlayGame.jsx` eventually recovers the state.

**Optimistic vote in reducer can diverge from server state:**
- Symptoms: `reducer_results.js` immediately adds the local user's vote to results on `VOTE` action (before server confirms). If the server rejects the vote (e.g., user not in session), the optimistic entry remains in the Redux store until the next `RESULTS_UPDATED` WebSocket message clears it. The `voted` flag in `reducer_vote.js` also switches to `true` on dispatch, not on server confirmation.
- Files: `planningpoker-web/src/reducers/reducer_results.js` (lines 10-12), `planningpoker-web/src/reducers/reducer_vote.js` (line 14)
- Trigger: Network error or server-side validation rejection after vote dispatch.
- Workaround: The burst WebSocket messages will eventually correct the UI state.

## Security Considerations

**CORS is open to all origins in production:**
- Risk: `app.cors.allowed-origins=*` is set in `application.properties`, which is the default applied to the live Railway deployment. Any website can make credentialed cross-origin requests to the API.
- Files: `planningpoker-api/src/main/resources/application.properties` (line 20), `planningpoker-api/src/main/java/com/richashworth/planningpoker/config/CorsConfig.java`
- Current mitigation: No authentication or sensitive data is stored; the app is intentionally public. The risk is limited to session manipulation by third-party pages.
- Recommendations: Set `app.cors.allowed-origins` via environment variable to the Railway production URL (`https://planning-poker.up.railway.app`) for defence in depth.

**WebSocket allows all origin patterns:**
- Risk: `WebSocketConfig` uses `.setAllowedOriginPatterns("*")`, bypassing browser origin checks for STOMP connections.
- Files: `planningpoker-api/src/main/java/com/richashworth/planningpoker/config/WebSocketConfig.java` (line 15)
- Current mitigation: Same as above — no sensitive data in sessions.
- Recommendations: Restrict to the known production origin when deploying.

**No rate limiting on any endpoint:**
- Risk: All REST endpoints (`/createSession`, `/vote`, `/reset`, etc.) are unrestricted. A client can create up to 100,000 sessions or flood the vote endpoint.
- Files: `planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java`, `VoteController.java`
- Current mitigation: `MAX_SESSIONS = 100_000` cap in `SessionManager` prevents unbounded growth. Sessions are evicted after 24h idle.
- Recommendations: Add per-IP rate limiting (Spring Boot + `Bucket4j` or a Railway edge layer) to prevent session flooding and vote spam.

**Host privilege is client-only — no server-side enforcement:**
- Risk: The `isAdmin` flag in Redux state (`reducer_game.js`) controls whether the "Next Item" reset button is shown. However, the `/reset` endpoint only validates session membership, not host status. Any session member can call `POST /reset` directly and reset the session.
- Files: `planningpoker-web/src/reducers/reducer_game.js`, `planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java` (lines 95-106)
- Current mitigation: No sensitive data is lost on reset; it is a minor UX concern for intentional misuse.
- Recommendations: Track host identity server-side (first registered user per session) and enforce host-only access on `/reset`.

**Username-only identity — no session tokens:**
- Risk: Users are identified purely by `(userName, sessionId)` tuple, both sent as plain URL parameters. Any user who knows another's username can vote or log out on their behalf by crafting a direct HTTP request.
- Files: All controller endpoints in `planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/`
- Current mitigation: The app is designed as a lightweight, trust-based tool. No sensitive data is at stake.
- Recommendations: For higher-trust environments, add a server-generated per-user token on join/create returned to the client and required on subsequent requests.

## Performance Bottlenecks

**Burst messaging total duration is ~2.7 seconds per event:**
- Problem: Each vote, join, leave, or reset triggers 5 WebSocket sends with cumulative `Thread.sleep` delays totalling 2,710ms (10+50+150+500+2000ms).
- Files: `planningpoker-api/src/main/java/com/richashworth/planningpoker/util/Clock.java` (line 12), `MessagingUtils.java`
- Cause: Designed to compensate for unreliable WebSocket delivery, but the final 2,000ms delay is excessive.
- Improvement path: Reduce the final delay or drop it entirely; rely on the frontend's 8-second fallback refresh poll for genuine delivery failures.

**All session state is in-memory on a single JVM:**
- Problem: Sessions, users, and estimates are stored in `ConcurrentHashMap` and `synchronized ListMultimap` on the single Spring Boot instance. Horizontal scaling is not possible without external state storage.
- Files: `planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java`
- Cause: Architectural choice for simplicity.
- Improvement path: A Railway deployment restart loses all active sessions. Adding Redis or a database would enable persistence and horizontal scaling. Currently acceptable for the app's scale.

## Fragile Areas

**`clearSessions()` is a weekly nuclear reset:**
- Files: `planningpoker-api/src/main/java/com/richashworth/planningpoker/tasks/ClearSessionsTask.java` (line 18), `SessionManager.java` (lines 67-73)
- Why fragile: The Sunday midnight cron (`0 0 0 * * Sun`) drops all sessions simultaneously. This cannot be tested without mocking the scheduler. `clearSessions()` is `synchronized` on the `SessionManager` instance but controllers also synchronize on `sessionManager` — there is no explicit ordering guarantee between the cron thread and an in-flight HTTP request's synchronized block when clearing.
- Safe modification: Do not add multi-step operations inside `clearSessions()` without reviewing the lock ordering. The 24h idle eviction path (`evictIdleSessions`) is the safer mechanism and should be preferred.
- Test coverage: `ClearSessionsTaskTest` covers the delegation call but not concurrent access.

**`useStomp` hook dependency uses `JSON.stringify(topics)`:**
- Files: `planningpoker-web/src/hooks/useStomp.js` (line 45)
- Why fragile: Using `JSON.stringify(topics)` as a `useEffect` dependency is an anti-pattern. If the `topics` array is recreated on each render (which it is in `PlayGame.jsx` — constructed inline), the stringify prevents reconnects, but if topics genuinely change, the hook will reconnect but the old client is not guaranteed to be cleanly deactivated before the new one activates. The `deactivate()` call in cleanup is guarded by `client.active` but `deactivate` is async.
- Safe modification: Memoize the topics array in `PlayGame.jsx` with `useMemo` to avoid relying on stringify equality.
- Test coverage: None (no unit tests for `useStomp`).

**Optimistic UI state on vote dispatch:**
- Files: `planningpoker-web/src/reducers/reducer_results.js`, `reducer_vote.js`
- Why fragile: Two reducers independently manage the "voted" and "results" state after a vote. If one updates but not the other (e.g., the `VOTE` action errors on one reducer path), the UI can show a results view with no data, or a vote view despite the server having recorded a vote.
- Safe modification: Any change to vote error handling must update both reducers consistently.
- Test coverage: Partial — `reducer_vote.test.js` and `reducer_results.test.js` exist but do not test error-on-vote scenarios end-to-end.

## Scaling Limits

**In-memory session store:**
- Current capacity: 100,000 sessions max (`MAX_SESSIONS`), uncapped users per session, uncapped votes per session.
- Limit: A single Railway instance (memory limited by plan). No persistence across restarts.
- Scaling path: Replace `SessionManager` with a Redis-backed store. No controller changes required; only `SessionManager` internals change.

## Dependencies at Risk

**`redux-promise` v0.6.0:**
- Risk: Last published in 2016. Not maintained. Incompatible with Redux Toolkit. The package mutates the action object, which conflicts with Redux's requirement for pure reducers and immutable state.
- Impact: Blocks migration to RTK; creates subtle bugs if error-handling code assumes standard Flux Standard Action shape.
- Migration plan: Replace with `redux-promise-middleware` (actively maintained) or migrate to `createAsyncThunk` from `@reduxjs/toolkit`.

**`sockjs-client` v1.6.1:**
- Risk: The SockJS client is in maintenance mode. It depends on XHR polling as a fallback, which adds complexity. Modern browsers support native WebSocket reliably.
- Impact: Extra bundle weight (~54KB gzipped) for fallback transports that are rarely needed.
- Migration plan: Remove SockJS and connect STOMP directly over native WebSocket (`new WebSocket(...)`) on the client side. Requires removing `.withSockJS()` from `WebSocketConfig.registerStompEndpoints` on the backend.

## Test Coverage Gaps

**`useStomp` hook has no unit tests:**
- What's not tested: WebSocket reconnect behaviour, connection timeout (5-second banner), topic subscription, message parsing, cleanup on unmount.
- Files: `planningpoker-web/src/hooks/useStomp.js`
- Risk: Reconnect logic or the `JSON.stringify(topics)` dependency workaround could silently break.
- Priority: Medium

**Frontend action creators have no unit tests:**
- What's not tested: Axios error handling paths in `createGame`, `joinGame`, `leaveGame`; the `alert()` calls on failure; the callback timing relative to Redux dispatch.
- Files: `planningpoker-web/src/actions/index.js`
- Risk: Error handling regressions surface only in Playwright e2e tests, which are slower and harder to diagnose.
- Priority: Medium

**`VoteController` vote-rejection paths have limited coverage:**
- What's not tested: Concurrent vote attempts from the same user (the `containsUserEstimate` guard on lines 49-53 of `VoteController.java`) are not tested under concurrent load.
- Files: `planningpoker-api/src/test/java/com/richashworth/planningpoker/controller/VoteControllerTest.java`
- Risk: A race condition between two simultaneous vote POSTs from the same user could bypass the duplicate-vote guard (both read `getResults()` before either write completes under the synchronized block — but the synchronized block wraps both, so this is actually safe; however, the test does not verify it).
- Priority: Low

**No backend integration tests for WebSocket message delivery:**
- What's not tested: That `burstResultsMessages` actually sends N messages to the STOMP broker, or that the correct topic is targeted.
- Files: `planningpoker-api/src/test/java/com/richashworth/planningpoker/util/MessagingUtilsTest.java`
- Risk: A refactor of `MessagingUtils` topic construction could silently deliver messages to wrong topics.
- Priority: Low

---

*Concerns audit: 2026-04-04*
