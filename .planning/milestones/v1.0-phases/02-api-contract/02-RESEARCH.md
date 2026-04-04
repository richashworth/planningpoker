# Phase 2: API Contract - Research

**Researched:** 2026-04-04
**Domain:** Spring Boot 3.4 REST controllers, Redux action creators, axios JSON response handling
**Confidence:** HIGH

---

## Summary

Phase 2 upgrades three backend endpoints (createSession, joinSession, vote) to be scheme-aware and wires the Redux layer to consume the new JSON responses. The codebase is well-prepared: Phase 1 already delivered `SchemeType`, `SchemeConfig`, and `SessionManager` extensions with `getSessionLegalValues()` and `getSessionSchemeConfig()`. This phase connects those building blocks to the API surface and frontend state layer.

The main coordination risk is that `createSession` changes from returning a plain string to returning JSON. The frontend reducer currently reads `action.payload.data` as a raw string for `sessionId`. Both sides must change in lockstep. Spring Boot 3.4 with `@RestController` automatically sets `Content-Type: application/json` when returning an object/record, so axios will auto-parse the response — no manual JSON parsing needed.

**Primary recommendation:** Three plans in two waves. Wave 1: backend API changes (controller + vote validation + tests). Wave 2: frontend Redux wiring (action creators + reducer + Constants.js cleanup). The wave split ensures the backend contract is solid before the frontend adapts to it.

---

## Project Constraints (from CLAUDE.md)

- **Tech stack locked:** Spring Boot 3.4 + Java 21, React 18 + MUI v5 — no new frameworks
- **Backwards compatibility:** Default to Fibonacci so existing flows work unchanged
- **In-memory state:** No database — scheme config already stored per-session by Phase 1
- **API evolution:** createSession response changes from String to JSON — frontend must handle the new format
- **Build:** `planningpoker-web:jar` and `planningpoker-api:bootJar` must be separate Gradle invocations
- **Naming conventions:** Java PascalCase classes, `<ClassName>Test` suffix; JS camelCase; reducer `reducer_<domain>.js`

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| API-01 | createSession accepts scheme parameters and returns JSON with scheme metadata | Change `GameController.createSession()` to accept `@RequestBody` JSON, return a response record containing sessionId + scheme fields |
| API-02 | joinSession returns scheme metadata so joiners see correct cards | Change `GameController.joinSession()` return type from `void` to a response record with scheme fields |
| API-03 | Server validates votes against the session's scheme (not hardcoded set) | Replace `VoteController.LEGAL_ESTIMATES` with `sessionManager.getSessionLegalValues(sessionId)` lookup |
| SCHM-05 | Scheme is locked for the session duration | No endpoint to change scheme — inherent from design. No new code needed, just verify no mutation path exists |
| UI-06 | Redux state stores scheme info from create/join responses | Extend `reducer_game.js` with `legalEstimates` and `schemeConfig` fields; update action creators to parse JSON responses |
</phase_requirements>

---

## Standard Stack

### Core (all already in project)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Spring Boot Starter Web | 3.4.4 | REST controllers, JSON serialization | Already in use |
| Jackson | (via Spring Boot) | Object-to-JSON serialization of records | Built-in with Spring Boot |
| axios | 1.7 | HTTP client for REST calls | Already in use |
| redux-promise | 0.6.0 | Auto-resolves promise payloads | Already in use |

### No new dependencies needed

Java records serialize natively via Jackson in Spring Boot 3.4 — no `@JsonProperty` annotations required. The existing `SchemeConfig` record from Phase 1 works as-is for JSON serialization.

---

## Existing Code Analysis

### Backend — What Changes

**GameController.java** (major changes):
- `createSession(@RequestParam userName)` → `createSession(@RequestBody CreateSessionRequest)` accepting JSON body with userName + scheme config fields
- Return type changes from `String` to a response DTO (record) containing `sessionId`, `schemeType`, `values`, `includeUnsure`, `includeCoffee`
- `joinSession` return type changes from `void` to the same response DTO (minus sessionId, or including it for consistency)
- Decision D-03 from CONTEXT.md: createSession uses `@RequestBody` JSON; other endpoints keep `@RequestParam`

**VoteController.java** (moderate change):
- Remove `private static final Set<String> LEGAL_ESTIMATES`
- Replace with: `List<String> legalValues = sessionManager.getSessionLegalValues(sessionId)` then `if (!legalValues.contains(estimateValue))`
- The validation must happen BEFORE the synchronized block (estimateValue check is stateless against the values list, which is immutable per Phase 1's `List.copyOf`)
- Actually, vote validation order: first check legal values (can be outside sync), then check session active + membership (inside sync). Current code checks LEGAL_ESTIMATES first, then enters sync block — same pattern.

**New DTOs:**
- `CreateSessionRequest` — record with `userName`, `schemeType`, `customValues` (String, comma-separated), `includeUnsure`, `includeCoffee`
- `SessionResponse` — record with `sessionId`, `schemeType`, `values` (List<String>), `includeUnsure`, `includeCoffee`

### Frontend — What Changes

**actions/index.js:**
- `createGame`: Change from `URLSearchParams` to JSON body (`axios.post(url, { userName, schemeType, ... })`). Extract `sessionId` from `response.data.sessionId` instead of `response.data`.
- `joinGame`: Response now returns JSON. Extract scheme info from response body. Pass scheme data via `meta` or let reducer read it from `payload.data`.

**reducer_game.js:**
- `CREATE_GAME` case: Change `action.payload.data` (string) to `action.payload.data.sessionId` (from JSON)
- `CREATE_GAME` case: Also store `legalEstimates: action.payload.data.values` and scheme metadata
- `JOIN_GAME` case: Currently uses `action.meta.sessionId` for sessionId (correct, no change). Add scheme info from `action.payload.data` (the join response body).
- Add new fields to `initialGameState`: `legalEstimates: []`, `schemeType: 'fibonacci'`, `includeUnsure: true`, `includeCoffee: true`

**Constants.js:**
- `LEGAL_ESTIMATES` remains as the initial default for backward compatibility (Vote.jsx still needs it as fallback until scheme data arrives from server)
- Alternatively, remove it and have Vote.jsx read from Redux state. Decision D-09 from CONTEXT.md says server response is the source of truth.

**Vote.jsx:**
- Currently imports `LEGAL_ESTIMATES` from Constants.js and constructs `allValues = [...LEGAL_ESTIMATES, COFFEE_SYMBOL]`
- Phase 3 will change this to read from Redux state — but Phase 2 should prepare by storing `legalEstimates` in Redux
- For Phase 2: Vote.jsx can continue using `LEGAL_ESTIMATES` from Constants.js as the card set (Phase 3 handles dynamic cards). BUT the server will validate against per-session values, so votes must be valid. Since Phase 2 doesn't add scheme selection UI (that's Phase 3), all sessions still default to Fibonacci, so the hardcoded `LEGAL_ESTIMATES` remains correct for now.

### Key Insight: Phase 2 Scope Boundary

Phase 2 changes the API contract and Redux storage, but does NOT change Vote.jsx card rendering or CreateGame.jsx UI. Those are Phase 3. This means:
1. All sessions still default to Fibonacci (no UI to select otherwise)
2. Vote.jsx can keep using `LEGAL_ESTIMATES` for card display (still correct for Fibonacci)
3. The Redux `legalEstimates` field is populated but not consumed by UI until Phase 3
4. The createGame action creator sends default scheme params (Fibonacci, both toggles on)

### Test Changes

**GameControllerTest.java:**
- `testCreateSession`: Must be updated — `createSession()` signature changes, return type changes to a response object
- New tests: createSession with scheme params, joinSession returns scheme metadata
- Mock `sessionManager.createSession(any(SchemeConfig.class))` instead of `sessionManager.createSession()`

**VoteControllerTest.java:**
- `testVote`: Must mock `sessionManager.getSessionLegalValues(SESSION_ID)` to return a list containing `ESTIMATE_VALUE`
- `testVoteInvalidEstimateRejected`: Must mock `getSessionLegalValues` to return a list NOT containing "999"
- Remove dependency on static `LEGAL_ESTIMATES` field

**AbstractControllerTest.java:**
- No changes needed — SessionManager and MessagingUtils mocks are already set up

---

## Integration Points

### Request Format Change

The `createSession` endpoint switches from `@RequestParam` (form-encoded) to `@RequestBody` (JSON). This affects:
1. Frontend: `axios.post(url, new URLSearchParams({...}))` → `axios.post(url, { userName, schemeType, ... })`
2. Content-Type: Changes from `application/x-www-form-urlencoded` to `application/json`
3. Spring: Jackson deserializes the JSON body into a request record automatically

### Response Format Change

- createSession: `String` → `SessionResponse` record (Jackson serializes to JSON automatically)
- joinSession: `void` → `SessionResponse` record
- axios: Automatically parses JSON responses when `Content-Type: application/json` — no client-side change needed for parsing

### Backward Compatibility During Development

Since Phase 2 changes both backend and frontend simultaneously, there's no period where one side is updated and the other isn't. Both changes land in the same deployment. The `createSession()` no-arg method in SessionManager still exists for any direct callers, but the controller will use the new `createSession(SchemeConfig)` overload.

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| createSession response change breaks frontend | LOW | Backend + frontend changes in same commit; tests verify both sides |
| Vote validation rejects valid Fibonacci votes | LOW | Unit test confirms Fibonacci values are in the legal set by default |
| redux-promise doesn't handle JSON response | NONE | axios auto-parses JSON; redux-promise resolves the promise — already works this way for other endpoints |
| CORS issue with JSON body | NONE | CORS config already allows `*` origins; JSON content-type is a simple request |
| Symbol mismatch (Coffee/Unsure) between front and back | LOW | Phase 1 tests verify exact symbols; Constants.js Coffee symbol matches SchemeType.COFFEE |

---

## RESEARCH COMPLETE

Research confirms Phase 2 is well-scoped with clear boundaries. All building blocks from Phase 1 are in place. The main work is:
1. Two new DTO records (request + response)
2. GameController changes (createSession accepts JSON body, both endpoints return JSON)
3. VoteController change (per-session validation)
4. Frontend action creators + reducer updates
5. Test updates for all changed code

No new libraries, no database, no configuration changes needed.
