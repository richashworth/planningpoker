# Domain Pitfalls: Estimation Schemes Feature

**Domain:** Adding customisable estimation schemes to an existing planning poker app
**Researched:** 2026-04-04
**Codebase:** Spring Boot 3.4 (Java 21) + React 18 + Redux 4 (legacy patterns)

---

## Critical Pitfalls

Mistakes in this category cause silent data corruption, broken UX for joiners, or test suites that pass while production breaks.

---

### Pitfall 1: `createSession` response type change breaks the Redux `CREATE_GAME` reducer silently

**What goes wrong:**
`GameController.createSession` currently returns a plain `String` (the session ID). `reducer_game.js` reads it as `action.payload.data` — the raw Axios response body. When the response becomes a JSON object, `action.payload.data` becomes an object, not a string. The reducer writes that object into `state.sessionId`. Every downstream use of `sessionId` (vote, reset, leave, WebSocket topic construction) silently receives `[object Object]` instead of a session ID string.

**Why it happens:**
`redux-promise` resolves the Axios promise and places the full Axios response on `action.payload`. The reducer then reads `.data` from that response. Changing the backend Content-Type from `text/plain` to `application/json` makes `.data` an object rather than a string — the reducer has no type guard.

**Evidence in codebase:**
`reducer_game.js` line 13: `sessionId: action.payload.data`
`actions/index.js` line 29-38: `payload: request` (raw Axios promise, resolved by redux-promise)

**Consequences:**
- Session ID stored as object; all REST calls send `sessionId=[object Object]`
- Server returns 400/500 for every subsequent action
- No console error at the point of failure; appears as a cascade of unrelated API errors

**Warning signs:**
- After adding JSON response, vote/reset buttons stop working but the lobby loads
- Backend logs show `session not found` for every request after create

**Prevention:**
In the `CREATE_GAME` case of `reducer_game.js`, explicitly extract the session ID from the response object before the backend change lands:
```js
case CREATE_GAME:
  const data = action.payload.data;
  const sessionId = typeof data === 'string' ? data : data.sessionId;
  return { ...state, playerName: action.meta.userName, sessionId };
```
Add a unit test in `reducer_game.test.js` for both the legacy string payload and the new JSON payload.

**Phase:** Backend API change (Task changing `createSession` to return JSON) must be paired with this frontend reducer fix in the same commit or the dev environment will be broken throughout the task.

---

### Pitfall 2: `joinSession` returns void — frontend receives no scheme info for joiners

**What goes wrong:**
`GameController.joinSession` currently returns `void` (HTTP 200, empty body). The design requires joiners to receive the session's scheme metadata so their Vote cards match the host's scheme. If the backend starts returning JSON but the frontend action still ignores the response body (current `joinGame` action discards the Axios response), joiners will always render the default Fibonacci cards regardless of the actual session scheme.

**Why it happens:**
`actions/index.js` `joinGame` uses `.then(() => callback())` — the response value is discarded. The `JOIN_GAME` reducer case only reads `action.meta` (player name and session ID) and ignores `action.payload.data`. Adding fields to the backend response without updating both the action and reducer leaves joiners with stale initial state.

**Evidence in codebase:**
`actions/index.js` lines 55-68: response body ignored
`reducer_game.js` line 19: `JOIN_GAME` case reads only `action.meta`

**Consequences:**
- Host creates a T-shirt session; joiner sees Fibonacci cards
- Joiner can vote with a Fibonacci value; server rejects it (the new per-session validation will reject values outside the session's resolved list)
- Joiner sees a confusing error with no explanation

**Warning signs:**
- E2e "joiner sees the same cards as host" test fails while host-only tests pass
- Joiner can see cards but attempts to vote result in HTTP 400

**Prevention:**
Update `joinGame` in `actions/index.js` to pass response data through the action payload. Update `reducer_game.js` `JOIN_GAME` case to extract scheme fields (`schemeType`, `customValues`, `includeUnsure`, `includeCoffee`) from `action.payload.data` with safe fallbacks to Fibonacci defaults.

**Phase:** Must be implemented together with the `joinSession` backend response change. Adding the backend change without the frontend update is the riskiest order; prefer implementing and testing both sides together.

---

### Pitfall 3: Vote validation race between resolved scheme values and meta-card toggles

**What goes wrong:**
The backend resolves the scheme to a flat `List<String>` of legal values at session creation time and stores it. This list includes or excludes `?` and `☕` based on the `includeUnsure` / `includeCoffee` toggles at creation time. If the `SchemeType.resolveValues()` logic includes the meta-card symbols inconsistently (e.g., only adds `?` but not `☕`, or adds them in the wrong order), the server will reject votes that the frontend correctly constructs as valid.

**Why it matters here:**
The frontend constructs `allValues` from `baseValues + conditionally('?') + conditionally(COFFEE_SYMBOL)`. The backend constructs its legal list from `SchemeType.resolveValues(...)`. If the two constructions diverge on symbol spelling, ordering, or trimming, valid votes get rejected.

The coffee symbol is `\u2615` — it must be stored and compared consistently on both sides. The existing `COFFEE_SYMBOL` constant in `Constants.js` already uses `\u2615`. The backend `VoteController.java` already uses `"\u2615"` in its hardcoded set. The new `SchemeType` enum must use exactly the same character.

**Warning signs:**
- Voting with the coffee card returns HTTP 400 (`Invalid estimate value`) after the scheme migration
- Unit tests pass but Playwright e2e test "host toggles off ? card" fails

**Prevention:**
- Add a `SchemeTypeTest` case asserting `resolveValues("fibonacci", null, true, true)` contains both `"?"` and `"\u2615"` as the last two elements
- Add a `VoteControllerTest` case for coffee votes on every scheme type
- Document that `UNSURE_SYMBOL = '?'` and `COFFEE_SYMBOL = '\u2615'` are the canonical strings on both sides

**Phase:** SchemeType enum implementation (Task 1 in the plan).

---

### Pitfall 4: `clearSessions()` does not clear new scheme maps, leaving orphaned scheme state

**What goes wrong:**
`SessionManager.clearSessions()` currently clears `sessionUsers`, `sessionEstimates`, `activeSessions`, and `lastActivity`. The design adds two new maps: `sessionSchemes` (resolved value lists) and `sessionSchemeConfigs` (raw config for joiner responses). If `clearSessions()` and `evictIdleSessions()` are not updated to clear both new maps, evicted or manually cleared sessions leave entries in the scheme maps forever. Under the 100,000-session cap, this memory leak is bounded but the state inconsistency is more dangerous: a recycled session ID (8-char UUID prefix, small namespace) could inherit the previous session's scheme, causing votes to be validated against the wrong value list.

**Evidence in codebase:**
`SessionManager.java` lines 67-73: `clearSessions()` clears four data structures. `evictIdleSessions()` lines 97-112: removes from four structures. Both must be updated.

**Warning signs:**
- `SessionManagerTest` tests for clearSessions pass but test only the original four maps
- Memory consumption grows slowly over time under load

**Prevention:**
- Add the new maps to `clearSessions()` and `evictIdleSessions()` in the same commit that adds them
- Add assertions to `SessionManagerTest.clearSessions_removesAllData` that verify the scheme maps are also empty post-clear

**Phase:** SessionManager modification task (Task 2 in the plan). Treat map lifecycle (add / clear / evict) as a single atomic implementation unit.

---

### Pitfall 5: Custom value input allows server-reachable invalid state the UI does not prevent

**What goes wrong:**
The design allows custom values defined as a comma-separated string. The frontend validates on change (showing error state for violations), but if the validation logic differs from the backend's canonical rules, a user can submit values that pass frontend validation and fail server-side validation — or vice versa.

Specific divergence risks:
- Frontend trims whitespace; backend splits on comma then trims. If frontend normalises before display but sends original string, the server may produce different values after its own trimming.
- Frontend deduplication (removing duplicate values before counting) vs backend deduplication (deduplicate after split, then check count 2-20).
- Max-length check: frontend checks each displayed chip; backend checks each trimmed value. A value of "  AB  " (6 chars with spaces) passes frontend (2-char value after trim) but if backend checks pre-trim length it fails.

**Warning signs:**
- E2e test "host creates game with custom values" passes in isolation but fails when spaces are present in the input
- `GameControllerTest` for custom validation rejects values that the UI accepted

**Prevention:**
Define a single canonical validation function (or document the exact algorithm) before implementing either side. Backend is the authority; frontend should replicate its exact rules:
1. Split on comma
2. Trim each token
3. Remove empty strings
4. Deduplicate (case-sensitive, per spec)
5. Assert 2-20 values remain
6. Assert each value 1-10 characters

Implement a `CustomValueValidator` helper on the backend that is unit-tested directly, and mirror its logic precisely in the frontend helper.

**Phase:** Custom scheme validation (part of GameController task). Write backend validation tests before frontend UI.

---

## Moderate Pitfalls

### Pitfall 6: `redux-promise` delivers raw Axios response — new scheme fields in `action.payload.data` require defensive extraction

**What goes wrong:**
`redux-promise` places the resolved Axios response object on `action.payload`. For successful requests, `action.payload.data` is the parsed response body. For failed requests, `action.error` is `true` and `action.payload` is the Axios error object. The new `CREATE_GAME` and `JOIN_GAME` reducers need to extract scheme fields from `action.payload.data` only on success.

If a reducer reads `action.payload.data.schemeType` without first checking `action.error`, a failed createSession call writes `undefined` into the scheme fields, causing the Vote component to fall through to an empty `SCHEMES[undefined]` lookup and throw a TypeError.

**Prevention:**
Every new `case` block that reads `action.payload.data` must guard with `if (action.error) return state;` first. Add a test case in `reducer_game.test.js` for the error branch of `CREATE_GAME` and `JOIN_GAME`.

**Phase:** Redux reducer modification (Task 5 in the plan).

---

### Pitfall 7: Scheme selector UI added to `CreateGame.jsx` without preserving the happy path for existing users

**What goes wrong:**
The scheme selector and toggles are new UI in `CreateGame.jsx`. If they are implemented as required fields with no sensible default, users who tab past them or use the form without interacting with the selector will submit with no scheme — the backend will receive `schemeType=undefined` and either throw a validation error or silently default to something unpredictable.

The spec says `schemeType` defaults to `fibonacci` and both toggles default to `true`. If the Redux form state initial values or the URLSearchParams construction omit these defaults, the backend receives missing params.

**Warning signs:**
- `POST /createSession` without explicit `schemeType` param returns HTTP 400

**Prevention:**
Set initial form state with explicit defaults matching the spec. Verify via a `GameControllerTest` that a `POST /createSession` with only `userName` (no scheme params) succeeds and returns a Fibonacci session.

**Phase:** CreateGame.jsx UI task (Task 6 in the plan).

---

### Pitfall 8: T-shirt size values are strings — the results chart `parseInt` path must not be taken

**What goes wrong:**
`ResultsChart.jsx` was fixed to use string keys (the `parseInt` bug is noted as already fixed in the design spec). However, if any code path in the results aggregation still attempts numeric sorting or averaging of estimate values, T-shirt sizes (`XS`, `S`, etc.) will produce `NaN` or incorrect sort order.

**Warning signs:**
- Results chart renders with all T-shirt votes grouped under `NaN` or an empty bar
- Bar order in the chart is unpredictable for non-numeric schemes

**Prevention:**
Review `ResultsChart.jsx` and `ResultsTable.jsx` for any `parseInt`, `parseFloat`, `Number(...)`, or `.sort()` calls on estimate values. Treat all estimate values as opaque strings for display and grouping purposes.

**Phase:** Any phase touching ResultsChart (likely incidental to Vote.jsx changes).

---

### Pitfall 9: WebSocket scheme delivery is not in scope — joiners who reconnect after a disconnect may lose scheme info

**What goes wrong:**
Scheme info is delivered once: on `createSession` (host) and `joinSession` (joiners). It is stored in Redux. If a joiner's page is hard-refreshed, Redux state is lost. The joiner re-enters via the Welcome screen and calls `joinSession` again, which will re-deliver the scheme info — this is safe. However, if a joiner's WebSocket drops and reconnects mid-session, no scheme re-delivery occurs because `/topic/results/{sessionId}` and `/topic/users/{sessionId}` carry only votes and user lists, not scheme metadata.

The current fallback (`GET /refresh` → WebSocket burst) also does not deliver scheme info.

**Prevention:**
This is acceptable given the explicit design decision that scheme info is delivered on join. Document the assumption: if a joiner loses their Redux state (hard refresh), they must re-join the session and will receive the scheme at that point. Do not rely on the WebSocket path to re-deliver scheme configuration.

**Phase:** Not a blocker for any single phase, but should be explicitly noted in design docs before the WebSocket architecture is revisited.

---

## Minor Pitfalls

### Pitfall 10: `SessionManager` synchronization scope must include both new maps

**What goes wrong:**
`createSession` and `joinSession` in `GameController` already hold `synchronized (sessionManager)` blocks. The new scheme map writes (`sessionSchemes.put(...)`, `sessionSchemeConfigs.put(...)`) must happen inside these blocks, not before or after them. Moving them outside the block creates a window where a joiner can call `joinSession` and read a scheme config before the host's `createSession` has written it.

**Prevention:**
Keep all SessionManager state mutations inside the existing `synchronized (sessionManager)` blocks. Do not introduce new synchronized blocks on different objects for the new maps.

**Phase:** SessionManager modification (Task 2).

---

### Pitfall 11: Custom values transmitted as `customValues` field — name collision with future persistence

**What goes wrong:**
The `SchemeConfig` record uses `customValues` as the field name for the host-defined values list. This is clear today. If a future milestone adds saved/reusable custom schemes, the same field name on a different model will create confusion. This is a naming concern, not a functional bug.

**Prevention:**
No action required now. Flag in the `SchemeConfig` Javadoc that `customValues` is null for preset schemes and that the field carries session-scoped values, not a persisted scheme definition.

**Phase:** SchemeConfig record (Task 1).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| SchemeType enum + SchemeConfig record (Task 1) | Meta-card symbol spelling mismatch (Pitfall 3) | Test `resolveValues` output for `?` and `\u2615` explicitly |
| SessionManager scheme storage (Task 2) | clearSessions orphan maps (Pitfall 4) | Implement map lifecycle as atomic unit; test immediately |
| GameController JSON responses (Task 3) | `createSession` return type breaks Redux (Pitfall 1) | Pair backend change with reducer fix; test both payloads |
| joinSession JSON response (Task 4) | Joiners miss scheme info (Pitfall 2) | Implement backend + frontend action + reducer atomically |
| Redux reducer updates (Task 5) | `redux-promise` error branch (Pitfall 6) | Guard all new payload reads with `action.error` check |
| Custom validation (Task 3 backend) | Frontend/backend validation divergence (Pitfall 5) | Write backend validator first; mirror exact rules in frontend |
| CreateGame.jsx UI (Task 6) | Missing defaults break happy path (Pitfall 7) | Test no-scheme-param createSession succeeds |
| Vote.jsx dynamic cards | T-shirt strings in numeric chart paths (Pitfall 8) | Audit ResultsChart for parseInt/sort on estimate values |

---

*Confidence: HIGH for pitfalls 1-5 (direct codebase evidence). MEDIUM for pitfalls 6-9 (design patterns observed, mitigations standard). LOW confidence pitfalls excluded — none found.*
