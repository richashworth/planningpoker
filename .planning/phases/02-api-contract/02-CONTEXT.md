# Phase 2: API Contract - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase upgrades the backend API endpoints (createSession, joinSession, vote) to be scheme-aware and wires the Redux layer to consume the new JSON responses. It does NOT touch the frontend UI for scheme selection (that's Phase 3).

</domain>

<decisions>
## Implementation Decisions

### JSON Response Shape
- **D-01:** Both createSession and joinSession return a flat JSON object with fields: `sessionId`, `schemeType`, `values` (array), `includeUnsure`, `includeCoffee`. Same shape from both endpoints for consistency.
- **D-02:** createSession returns the newly created sessionId plus scheme metadata. joinSession returns scheme metadata so joiners see the correct card set.

### Request Format
- **D-03:** createSession accepts a JSON request body (`@RequestBody`) with scheme config fields (schemeType, customValues, includeUnsure, includeCoffee). This replaces the current `@RequestParam` approach for this endpoint only.
- **D-04:** Other endpoints (joinSession, vote, reset, logout) keep their existing `@RequestParam` format — no change needed.
- **D-05:** When no scheme config is provided (backward compatibility), default to Fibonacci with both meta-cards on. This aligns with the existing no-arg `createSession()` in SessionManager.

### Vote Validation
- **D-06:** Replace hardcoded `LEGAL_ESTIMATES` in VoteController with per-session lookup via `sessionManager.getSessionLegalValues(sessionId)`. Check the voted value against that list.
- **D-07:** Keep generic "Invalid estimate value" error message (HTTP 400) — consistent with existing error pattern, no need to expose allowed values.

### Redux Scheme Storage
- **D-08:** Extend `reducer_game.js` with `legalEstimates` (array) and `schemeConfig` (object) fields in state. These are populated from the create/join JSON responses.
- **D-09:** `Constants.js` `LEGAL_ESTIMATES` remains as the initial default but is no longer the source of truth for voting — the server response is.
- **D-10:** `createGame` action must extract `sessionId` from JSON response (`action.payload.data.sessionId`) instead of using the raw string (`action.payload.data`).
- **D-11:** `joinGame` action must extract scheme metadata from JSON response and store in Redux state.

### Claude's Discretion
- Response DTO class naming and package placement
- Whether to use a dedicated response record or reuse/extend SchemeConfig
- Test structure and grouping for new controller tests

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design Specs
- `docs/superpowers/specs/2026-04-04-estimation-schemes-design.md` — Full design spec for estimation schemes feature
- `docs/superpowers/plans/2026-04-04-estimation-schemes.md` — Detailed implementation plan

### Phase 1 Artifacts
- `.planning/phases/01-backend-foundation/01-01-PLAN.md` — SchemeType enum, SchemeConfig record, SessionManager extensions (Phase 2 depends on these)

### Existing Code (must-read before modifying)
- `planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java` — createSession/joinSession endpoints to modify
- `planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/VoteController.java` — Vote validation to change from hardcoded to per-session
- `planningpoker-web/src/actions/index.js` — Action creators to update for JSON responses
- `planningpoker-web/src/reducers/reducer_game.js` — Reducer to extend with scheme state
- `planningpoker-web/src/config/Constants.js` — LEGAL_ESTIMATES currently hardcoded

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SchemeType.resolveValues()` (Phase 1): Resolves scheme name + toggles to concrete value list — use for createSession
- `SchemeConfig` record (Phase 1): Immutable scheme metadata — could be part of the JSON response
- `SessionManager.getSessionLegalValues()` (Phase 1): Returns the resolved values for a session — use for vote validation

### Established Patterns
- Controllers use `@RequestParam` with `URLSearchParams` from frontend — createSession will break this pattern by using `@RequestBody` JSON
- `ErrorHandler.java` catches `IllegalArgumentException` → 400 — vote validation errors follow this pattern
- Redux uses `redux-promise` middleware: `action.payload` is the axios promise, resolved to `action.payload.data` — JSON responses are auto-parsed by axios when `Content-Type: application/json`
- `reducer_game.js` currently reads `action.payload.data` as a plain string for CREATE_GAME — must change to `.sessionId`

### Integration Points
- `GameController.createSession()` → response type changes from `String` to a JSON object
- `GameController.joinSession()` → response type changes from `void` to a JSON object
- `VoteController.vote()` → validation changes from static Set to `sessionManager.getSessionLegalValues()`
- `reducer_game.js` CREATE_GAME case → must parse JSON response
- `reducer_game.js` JOIN_GAME case → currently uses `action.meta.sessionId` (fine), but needs to store scheme info too

</code_context>

<specifics>
## Specific Ideas

- createSession request body should use the userName from form param AND scheme config from JSON body — or combine both into JSON body for simplicity
- The Phase 2 coordination risk noted in STATE.md: backend and Redux changes must be compatible. Since createSession changes from string to JSON, the frontend must handle the new format immediately.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-api-contract*
*Context gathered: 2026-04-04*
