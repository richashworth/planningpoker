# Phase 6: Host Actions & WebSocket Events - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

The host can kick a participant or promote another participant to host, and all participants receive real-time WebSocket push notifications when either event occurs. No frontend UI changes in this phase — only backend endpoints and WebSocket event delivery.

</domain>

<decisions>
## Implementation Decisions

### Authorization Model
- **D-01:** Non-host users calling kick or promote receive a 403 Forbidden response with `{"error": "only the host can perform this action"}` — not 400, so the frontend can distinguish authorization failures from validation errors
- **D-02:** Host status is checked at execution time inside the synchronized block — if the caller is no longer host due to a race condition, the request is rejected with 403

### Kick Behavior
- **D-03:** Kicked user's votes are cleared from the session — reuse existing `removeUser()` which already clears estimates, consistent with voluntary leave
- **D-04:** Kicked users can rejoin the same session with the same username — no ban list, kick just removes them. Matches the casual nature of the app.

### Claude's Discretion
- API endpoint naming and parameter style (query params vs JSON body) — follow existing controller conventions
- WebSocket event shape — whether to enrich `/topic/users/` payload with event type (e.g., `{users, host, event: "kicked", target: "username"}`) or keep it identical to leave. Consider that Phase 7 will need kick info for toast notifications.
- Whether kick and promote are separate endpoints or a single action endpoint

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 5 implementation (host model foundation)
- `.planning/phases/05-backend-host-model/05-01-PLAN.md` — SessionManager host tracking design and TDD approach
- `.planning/phases/05-backend-host-model/05-02-PLAN.md` — Host field in API responses and WebSocket payload

### Requirements
- `.planning/REQUIREMENTS.md` — ACT-01 (kick), ACT-02 (promote), NOTIF-02 (real-time WebSocket push)

### Existing code
- `planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java` — Host tracking, removeUser() with auto-promote, all session state maps
- `planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java` — Existing endpoint patterns, validateSessionMembership(), synchronized blocks
- `planningpoker-api/src/main/java/com/richashworth/planningpoker/util/MessagingUtils.java` — Burst messaging pattern, sendUsersMessage() already sends {users, host}
- `planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/ErrorHandler.java` — Current error handling (IllegalArgumentException -> 400 only, needs 403 support)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SessionManager.removeUser()` — Already removes user from session, clears their estimates, and auto-promotes host. Can be reused directly for kick.
- `MessagingUtils.burstUsersMessages()` — Burst messaging pattern for reliable WebSocket delivery. Already sends `{users, host}` payload.
- `GameController.validateSessionMembership()` — Validates session exists and user is a member. Can be extended or composed with host validation.

### Established Patterns
- All mutations use `synchronized (sessionManager)` blocks in controllers
- POST endpoints use `@RequestParam` for simple parameters (userName, sessionId)
- After state mutations, controllers call `burstUsersMessages()` and/or `burstResultsMessages()`
- All errors currently go through `IllegalArgumentException` -> 400. A 403 response requires a new exception type or explicit `ResponseEntity` handling in `ErrorHandler`.

### Integration Points
- New kick/promote endpoints in `GameController` (or a new controller)
- `ErrorHandler` needs to handle 403 responses (new exception type like `AccessDeniedException` or Spring's existing one)
- `SessionManager` may need a `promoteHost()` method (direct host reassignment without removing the old host)
- WebSocket `/topic/users/{sessionId}` channel already delivers user list updates — kick and promote naturally trigger this

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches following existing codebase patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-host-actions-websocket-events*
*Context gathered: 2026-04-06*
