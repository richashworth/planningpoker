---
status: passed
phase: 02-api-contract
verified: 2026-04-04
---

# Phase 2: API Contract — Verification

## Phase Goal
The create and join endpoints return scheme metadata as JSON, and the server validates votes against the session's actual scheme; the Redux layer consumes both responses correctly.

## Success Criteria Verification

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | POST /createSession returns JSON with sessionId + scheme metadata | PASS | GameController.java returns SessionResponse record; GameControllerTest.testCreateSession verifies sessionId, schemeType, values |
| 2 | POST /joinSession returns JSON with scheme metadata | PASS | GameController.joinSession returns SessionResponse; GameControllerTest.testJoinSession verifies schemeType and values |
| 3 | Vote outside session scheme rejected (HTTP 400) | PASS | VoteController uses sessionManager.getSessionLegalValues(); VoteControllerTest.testVoteInvalidEstimateRejected confirms rejection |
| 4 | Scheme locked at creation — no change endpoint | PASS | No endpoint modifies scheme after session creation; grep confirms no setScheme/updateScheme methods |
| 5 | Redux sessionId from JSON create response | PASS | reducer_game.js reads action.payload.data.sessionId; legalEstimates populated from action.payload.data.values |

## Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| API-01 | PASS | createSession accepts JSON body with scheme fields, returns SessionResponse |
| API-02 | PASS | joinSession returns SessionResponse with scheme metadata |
| API-03 | PASS | VoteController validates against per-session legal values |
| SCHM-05 | PASS | No scheme mutation endpoint exists |
| UI-06 | PASS | reducer_game.js stores legalEstimates, schemeType, includeUnsure, includeCoffee |

## must_haves Verification

### Plan 02-01 Truths
- [x] POST /createSession accepts JSON body and returns JSON with sessionId, schemeType, values, includeUnsure, includeCoffee
- [x] POST /createSession with no scheme fields defaults to Fibonacci with both meta-cards on
- [x] POST /joinSession returns JSON with scheme metadata
- [x] POST /vote validates against sessionManager.getSessionLegalValues(sessionId)
- [x] Invalid vote value returns HTTP 400 (via IllegalArgumentException -> ErrorHandler)
- [x] No endpoint to change scheme after creation

### Plan 02-02 Truths
- [x] createGame sends JSON body with scheme config fields
- [x] Reducer extracts sessionId from action.payload.data.sessionId
- [x] joinGame response populates scheme metadata in Redux
- [x] Redux state includes legalEstimates, schemeType, includeUnsure, includeCoffee
- [x] Both CREATE_GAME and JOIN_GAME populate scheme fields
- [x] LEAVE_GAME resets scheme fields to defaults

## Automated Checks
- `./gradlew planningpoker-api:test` — All 37 tests pass (exit 0)
- `cd planningpoker-web && npm run build` — Build succeeds (exit 0)

## Artifacts Verified
- [x] CreateSessionRequest.java exists with expected record fields
- [x] SessionResponse.java exists with expected record fields
- [x] GameController.java contains @RequestBody, SessionResponse return types
- [x] VoteController.java contains getSessionLegalValues, no hardcoded LEGAL_ESTIMATES
- [x] GameControllerTest.java contains 12 tests including scheme-aware tests
- [x] VoteControllerTest.java contains 5 tests with per-session validation mocks
- [x] actions/index.js sends JSON body for createSession
- [x] reducer_game.js reads sessionId from JSON response, stores scheme metadata

## Result

**PASSED** — All 5 success criteria met, all 5 requirements verified, all must_haves confirmed.
