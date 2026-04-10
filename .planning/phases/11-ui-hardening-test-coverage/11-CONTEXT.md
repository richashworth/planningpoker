# Phase 11: UI Hardening & Test Coverage - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Add loading states to forms, replace browser alert() dialogs with MUI Snackbar notifications, implement complete vote revert on HTTP failure, and add useStomp hook unit tests covering all lifecycle events. This is hardening of existing infrastructure — no new features.

</domain>

<decisions>
## Implementation Decisions

### Form Loading States (SC-1)
- **D-01:** Already implemented. Both `JoinGame.jsx` and `CreateGame.jsx` have `submitting` state, `disabled={submitting}` on submit buttons, and `CircularProgress` spinners during request flight. No changes needed.

### Snackbar Error Handling (SC-2)
- **D-02:** Already implemented. Zero `alert()` calls exist in the frontend source. All HTTP error paths use `dispatch(showError(...))` which flows through `reducer_notification.js` to the `Snackbar` component in `App.jsx`. No changes needed.

### Vote Revert (SC-3)
- **D-03:** Already implemented. `reducer_vote.js` line 8 reverts voted flag to `false` on `VOTE` error. `reducer_results.js` line 12 filters out the optimistic entry on `VOTE` error. Both directions of the revert are covered. No changes needed.

### useStomp Test Coverage (SC-4)
- **D-04:** Existing tests at `src/hooks/__tests__/useStomp.test.js` cover connect, subscribe, message parsing, disconnect, and cleanup. Missing: reconnect lifecycle test and `connected` state transitions (onDisconnect/onStompError/onWebSocketClose callbacks).
- **D-05:** Follow the existing test pattern — `simulateMount` helper that mirrors useEffect logic without React/jsdom. Test reconnect by directly invoking the `onDisconnect`/`onStompError`/`onWebSocketClose` callbacks from the Client config and verifying the expected behavior.

### Claude's Discretion
- Exact test structure for reconnect coverage (how many test cases, naming)
- Whether to test the 5-second initial connection timeout behavior
- Whether to add any additional edge case tests discovered during implementation

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above and ROADMAP.md success criteria.

### Key source files
- `planningpoker-web/src/hooks/useStomp.js` — Hook under test
- `planningpoker-web/src/hooks/__tests__/useStomp.test.js` — Existing test file to extend
- `planningpoker-web/src/pages/JoinGame.jsx` — Form with loading state (already implemented)
- `planningpoker-web/src/pages/CreateGame.jsx` — Form with loading state (already implemented)
- `planningpoker-web/src/actions/index.js` — Error handling via showError() (already implemented)
- `planningpoker-web/src/reducers/reducer_vote.js` — Vote revert on error (already implemented)
- `planningpoker-web/src/reducers/reducer_results.js` — Optimistic entry revert on error (already implemented)
- `planningpoker-web/src/App.jsx` — Snackbar error display (already implemented)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `simulateMount` helper in existing useStomp tests — mirrors useEffect body, can be extended for reconnect scenarios
- `vi.mock('@stomp/stompjs')` and `vi.mock('sockjs-client')` — mocking pattern already established
- `lastClientConfig` / `lastClientInstance` — test utilities for accessing mock Client internals

### Established Patterns
- Tests use Vitest (`describe`, `it`, `expect`, `vi`)
- No jsdom/React rendering — tests exercise hook logic by replicating the useEffect body
- `beforeEach` clears mocks and resets shared state

### Integration Points
- `useStomp.test.js` — single file to extend with reconnect tests
- No other files need modification — SCs 1-3 are already met

</code_context>

<specifics>
## Specific Ideas

No specific requirements — the scope is narrow: add reconnect lifecycle tests to the existing useStomp test file.

</specifics>

<deferred>
## Deferred Ideas

None — analysis stayed within phase scope.

### Reviewed Todos (not folded)
- "Host can label each voting round..." — Feature work, not related to UI hardening. Belongs in a future feature phase.
- "Add date to copyright notice in footer" — Already addressed in prior commits.

</deferred>

---

*Phase: 11-ui-hardening-test-coverage*
*Context gathered: 2026-04-09*
