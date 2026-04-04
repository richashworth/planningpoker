# Architecture Patterns

**Domain:** Customizable estimation schemes for an existing planning poker app
**Researched:** 2026-04-04

## Recommended Architecture

The estimation schemes feature integrates into the existing two-tier client-server SPA by adding a per-session scheme layer that sits between session creation and vote validation. The pattern is: scheme is resolved to a concrete value list at session creation time, stored in `SessionManager` alongside existing state, and propagated to all participants via the create/join API responses. No new communication channel is needed — the existing REST + WebSocket topology is sufficient.

```
[CreateGame.jsx]
     |
     | POST /createSession (schemeType, customValues, includeUnsure, includeCoffee, userName)
     v
[GameController] --> validates scheme params
     |
     v
[SessionManager] --> stores SchemeConfig (type + toggles + custom values)
                 --> stores resolved List<String> legal values per session
                 --> returns sessionId + SchemeConfig in JSON response
     |
     v
[Redux: reducer_game] --> stores schemeType, customValues, includeUnsure, includeCoffee

[Vote.jsx] -- reads scheme from Redux --> resolves to card value list locally (presets)
           |                          --> uses customValues directly (custom scheme)
           |
           | POST /vote (estimateValue)
           v
[VoteController] --> sessionManager.getSessionScheme(sessionId) (per-session lookup)
                 --> replaces static LEGAL_ESTIMATES set
```

Joiners receive scheme config from `POST /joinSession` response (currently void — must change to JSON), which populates the same Redux fields as create.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `SchemeType` enum (new) | Canonical source of preset value lists | `SessionManager`, `GameController` |
| `SchemeConfig` record (new) | Scheme metadata transmitted in API responses | `GameController` (returned), `SessionManager` (stored) |
| `SessionManager` | Stores resolved legal values + raw config per session | `GameController`, `VoteController` |
| `GameController` | Accepts scheme params on create/join, validates, returns JSON | `SessionManager` |
| `VoteController` | Per-session vote validation replacing static `LEGAL_ESTIMATES` | `SessionManager` |
| `Schemes.js` (new frontend) | Preset scheme definitions + value resolver function | `Vote.jsx`, `CreateGame.jsx` |
| `reducer_game.js` | Extended Redux state: adds scheme fields alongside existing player/session identity | `Vote.jsx`, `CreateGame.jsx`, `actions/index.js` |
| `CreateGame.jsx` | Scheme selector UI (radio/toggle group) + custom value input | Dispatches `createGame` with scheme params |
| `Vote.jsx` | Resolves Redux scheme state to card value list; renders dynamically | `Schemes.js`, Redux `state.game` |
| `actions/index.js` | Passes scheme params to REST; parses JSON responses instead of plain text | `GameController`, Redux |

### Data Flow

**Session Create (scheme flows downstream to all participants):**

```
User picks scheme in CreateGame.jsx
  --> dispatch createGame(playerName, schemeParams)
  --> axios POST /createSession {userName, schemeType, customValues?, includeUnsure, includeCoffee}
  --> GameController validates schemeType, validates customValues if custom
  --> SessionManager.createSession() stores SchemeConfig + resolved legal values list
  --> Response: { sessionId, schemeType, customValues?, includeUnsure, includeCoffee }
  --> reducer_game handles CREATE_GAME: stores sessionId + all scheme fields
```

**Session Join (scheme flows to late joiners):**

```
User submits JoinGame.jsx
  --> dispatch joinGame(playerName, sessionId)
  --> axios POST /joinSession {userName, sessionId}
  --> GameController calls sessionManager.getSessionSchemeConfig(sessionId)
  --> Response: { schemeType, customValues?, includeUnsure, includeCoffee }
  --> reducer_game handles JOIN_GAME: stores scheme fields alongside existing sessionId from meta
```

**Vote Rendering (scheme drives card UI):**

```
Vote.jsx mounts in PlayGame.jsx
  --> useSelector reads { schemeType, customValues, includeUnsure, includeCoffee } from state.game
  --> if schemeType === 'custom': baseValues = customValues
      else: baseValues = SCHEMES[schemeType].values (local constant lookup, no network call)
  --> allValues = [...baseValues, ...(includeUnsure ? ['?'] : []), ...(includeCoffee ? ['☕'] : [])]
  --> renders one card per value (replaces static LEGAL_ESTIMATES + COFFEE_SYMBOL concat)
```

**Vote Validation (scheme enforced server-side):**

```
User clicks card --> POST /vote {estimateValue, sessionId, userName}
  --> VoteController: sessionManager.getSessionScheme(sessionId) returns Set<String>
  --> if !legalValues.contains(estimateValue) --> throw IllegalArgumentException (400)
  --> otherwise: registerEstimate, burstResultsMessages (unchanged)
```

## Patterns to Follow

### Pattern 1: Resolve Early, Store Resolved Form

**What:** On session creation, resolve the scheme name + toggles into the final list of legal values immediately and store that list alongside the raw config. Do not re-resolve on every vote.

**When:** Always — this is the correct approach for in-memory ephemeral state with no persistence layer.

**Rationale:** The `SessionManager` already stores session-to-estimates and session-to-users as resolved collections. Scheme legal values follow the same pattern. Vote validation becomes a single `Set.contains()` call with no enum lookups on the hot path.

```java
// In SessionManager (new maps):
private final ConcurrentHashMap<String, List<String>> sessionSchemes = new ConcurrentHashMap<>();
private final ConcurrentHashMap<String, SchemeConfig> sessionSchemeConfigs = new ConcurrentHashMap<>();
```

### Pattern 2: Frontend Resolves Presets Locally

**What:** The frontend keeps a `Schemes.js` constant with preset value lists and resolves scheme name to values without a network call. Only custom values are transmitted over the wire.

**When:** Always for preset schemes. Custom values must be transmitted in the create/join response because they are unknown to the frontend at join time.

**Rationale:** Preset definitions are static and identical on both sides. Sending the full value list over the wire for presets adds payload with no benefit. This pattern also means the frontend can render cards the instant the session response arrives, without a second request.

### Pattern 3: Scheme Locked at Creation, Propagated on Join

**What:** The scheme is set once on `createSession` and cannot change. `joinSession` returns the existing scheme config. `resetSession` only clears estimates, not the scheme.

**When:** Always — matches the out-of-scope decision in PROJECT.md ("Changing scheme mid-session not justified").

**Rationale:** Avoids mid-round confusion and eliminates the need for WebSocket scheme-change events. The existing `resetSession` endpoint touches estimates only; scheme maps are untouched.

### Pattern 4: API Response Upgrade — String to JSON

**What:** `POST /createSession` currently returns a plain `String` (session ID). It must return a JSON object. `POST /joinSession` currently returns void; it must return a JSON object.

**When:** Both endpoints must change together because `reducer_game.js` currently reads `action.payload.data` as the session ID string directly.

**Required change in `reducer_game.js`:**
```js
// Before:
case CREATE_GAME:
  return {...state, playerName: action.meta.userName, sessionId: action.payload.data};

// After:
case CREATE_GAME:
  return {
    ...state,
    playerName: action.meta.userName,
    sessionId: action.payload.data.sessionId,
    schemeType: action.payload.data.schemeType,
    customValues: action.payload.data.customValues ?? null,
    includeUnsure: action.payload.data.includeUnsure,
    includeCoffee: action.payload.data.includeCoffee,
  };
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Hardcoded LEGAL_ESTIMATES in VoteController

**What:** The current static `Set<String> LEGAL_ESTIMATES` field in `VoteController.java` lists all valid votes at compile time.

**Why bad:** With dynamic schemes it will accept votes outside the session's scheme, or reject valid votes from other schemes. It becomes a security gap the moment the frontend starts sending non-Fibonacci values.

**Instead:** Replace with `sessionManager.getSessionScheme(sessionId)` — a per-session `List<String>` converted to a `Set` for O(1) lookup. Remove the static field entirely.

### Anti-Pattern 2: Frontend Resolves Scheme with a Network Call

**What:** Fetching scheme info from a dedicated `GET /sessionScheme/{id}` endpoint when rendering cards.

**Why bad:** Adds latency before cards appear, adds an endpoint that doesn't exist, and is redundant — the scheme is already in Redux from the create/join response.

**Instead:** Read from Redux state, resolve locally using `Schemes.js` for presets.

### Anti-Pattern 3: Re-resolving Presets on Every Vote

**What:** Calling `SchemeType.fromString(config.schemeType()).getValues()` inside `VoteController.vote()` on each request.

**Why bad:** Unnecessary work on the hot path. Preset definitions are fixed; resolving at session creation and caching the result is both simpler and faster.

**Instead:** Store the resolved `List<String>` in `sessionSchemes` map at creation time. `VoteController` calls `getSessionScheme()` which returns the pre-resolved list.

### Anti-Pattern 4: Clearing Scheme State on resetSession

**What:** Removing scheme entries from `sessionSchemes` or `sessionSchemeConfigs` when a round is reset.

**Why bad:** Scheme is locked for the session duration. Reset only clears estimates. Clearing scheme state would break vote validation and the join flow after a reset.

**Instead:** Only `sessionEstimates.removeAll(sessionId)` in `resetSession()`. Leave scheme maps untouched.

## Build Order

Dependencies between components determine a strict build order. Each layer must be complete before the next layer can be built or tested.

```
Layer 1 (Backend Model)
  SchemeType enum
  SchemeConfig record
         |
Layer 2 (Backend Service)
  SessionManager extended with scheme storage
         |
Layer 3 (Backend API)
  GameController: createSession → JSON, joinSession → JSON
  VoteController: per-session validation
         |
Layer 4 (Frontend Foundation)
  Schemes.js (preset definitions)
  reducer_game.js (scheme state shape)
  actions/index.js (JSON response parsing)
         |
Layer 5 (Frontend UI)
  CreateGame.jsx (scheme selector)
  Vote.jsx (dynamic cards)
         |
Layer 6 (Tests)
  Backend unit tests (SchemeType, SessionManager, GameController, VoteController)
  Frontend unit tests (reducer_game)
  E2e Playwright tests
```

**Why this order:**
- `SchemeType` and `SchemeConfig` have no dependencies; they must exist before anything else references them
- `SessionManager` changes need `SchemeConfig` before its method signatures can compile
- Controller changes need `SessionManager` before they can delegate
- `Schemes.js` and the reducer can be written in parallel with Layer 3 (no runtime dep on backend during authoring), but `actions/index.js` parsing depends on the backend JSON contract being defined first
- `CreateGame.jsx` and `Vote.jsx` depend on `Schemes.js` and the updated Redux shape
- Tests span all layers and must come last for integration coverage (unit tests for each layer can be written test-first within that layer)

## Scalability Considerations

The existing in-memory state model is the only persistence mechanism. Scheme data adds two additional `ConcurrentHashMap` entries per session. At the scale this app operates (ephemeral sessions, weekly full clear, 24h idle eviction), this is negligible. No scalability work is required for this feature.

| Concern | Current Approach | Impact of Scheme Feature |
|---------|-----------------|--------------------------|
| Memory per session | ~4 maps per session | +2 small maps (SchemeConfig + List<String>) — negligible |
| Session eviction | `evictIdleSessions()` clears 4 maps | Must also clear the 2 new scheme maps |
| Concurrency | Synchronized blocks in controllers | No change needed — scheme is write-once at creation |
| API payload size | createSession returns 8-char string | createSession returns ~100-byte JSON object — irrelevant |

**Note:** `clearSessions()` and `evictIdleSessions()` in `SessionManager` must be updated to also clear `sessionSchemes` and `sessionSchemeConfigs`, or sessions will leak scheme state after eviction.

## Sources

- Current codebase: `planningpoker-api/src/main/java/com/richashworth/planningpoker/` (direct read, HIGH confidence)
- Design spec: `docs/superpowers/specs/2026-04-04-estimation-schemes-design.md` (direct read, HIGH confidence)
- Implementation plan: `docs/superpowers/plans/2026-04-04-estimation-schemes.md` (direct read, HIGH confidence)
- Existing architecture doc: `.planning/codebase/ARCHITECTURE.md` (direct read, HIGH confidence)
