---
status: resolved
trigger: "Player names appearing twice in the votes table after voting. Screenshot shows 'Dffasd' appearing twice with the same vote '2w'."
created: 2026-04-06T00:00:00Z
updated: 2026-04-06T00:01:00Z
symptoms_prefilled: true
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

hypothesis: CONFIRMED. redux-promise does NOT dispatch the original action when payload is a Promise — it only dispatches after the Promise resolves. So the VOTE optimistic push fires AFTER the HTTP response resolves (not before). The WebSocket burst fires at 10ms. The sequence when WS is faster than HTTP:
  1. HTTP POST /vote sent (promise pending)
  2. 10ms: WS burst arrives → RESULTS_UPDATED → state = [{ userName, estimateValue }] (server result)
  3. HTTP response resolves → redux-promise dispatches VOTE action → VOTE case: [...state, { userName, estimateValue }] → state = [serverEntry, optimisticEntry] → DUPLICATE

When HTTP is faster than WS:
  1. HTTP resolves → VOTE → state = [optimisticEntry]
  2. WS arrives → RESULTS_UPDATED → state = [serverEntry] — no duplicate

The bug manifests when the WS burst (10ms) beats the HTTP response roundtrip. Since the WS burst is intentionally near-instant, this is the common case.

test: fix is to remove the optimistic push from the VOTE case in reducer_results.js, since RESULTS_UPDATED from WS already handles the update
next_action: apply fix — remove VOTE case from reducer_results.js

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: Each player appears once in the votes/results table with their vote
actual: A player's name appears twice in the table with the same vote value (e.g., "Dffasd" shown twice with "2w")
errors: None visible — purely visual duplication
reproduction: Join a session, vote, observe the results table
started: Unknown — just discovered

## Eliminated
<!-- APPEND only - prevents re-investigating -->

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-04-06T00:01:00Z
  checked: SessionManager.registerEstimate
  found: Uses ListMultimap which allows duplicate keys; no deduplication here — inserts unconditionally
  implication: If called twice for same user, both entries will be stored and returned

- timestamp: 2026-04-06T00:01:00Z
  checked: VoteController.vote
  found: Guards with `CollectionUtils.containsUserEstimate(sessionManager.getResults(sessionId), userName)` before calling registerEstimate
  implication: Duplicate prevention relies entirely on containsUserEstimate being correct

- timestamp: 2026-04-06T00:01:00Z
  checked: reducer_results.js
  found: VOTE case does optimistic push `[...state, { userName, estimateValue }]`; RESULTS_UPDATED case does wholesale replace `action.payload`
  implication: Initial theory that WS overwrite would eliminate the duplicate — needed to verify redux-promise behaviour

- timestamp: 2026-04-06T00:01:00Z
  checked: MessagingUtils.burstResultsMessages
  found: Sends same results payload 6 times. Each RESULTS_UPDATED replaces state. No accumulation possible from this.
  implication: WS bursting cannot cause duplication — each message is a full replace

- timestamp: 2026-04-06T00:02:00Z
  checked: CollectionUtils.containsUserEstimate + Estimate.java
  found: Guard logic is correct — case-insensitive match on userName field. Backend cannot store duplicate estimates for same user.
  implication: Backend is not the source. Duplication is frontend-only.

- timestamp: 2026-04-06T00:02:00Z
  checked: redux-promise middleware source (node_modules/redux-promise/lib/index.js)
  found: When action.payload is a Promise, redux-promise does NOT call next(action) for the original action. It only dispatches after the Promise resolves, with the resolved value as payload.
  implication: The VOTE optimistic push fires AFTER HTTP response resolves — not before. This changes the race: WS burst (10ms) fires before the HTTP roundtrip completes in the common case.

- timestamp: 2026-04-06T00:02:00Z
  checked: Race condition analysis
  found: Sequence when WS faster than HTTP (common case):
    1. HTTP POST /vote in flight
    2. 10ms: WS burst arrives → RESULTS_UPDATED → state = [{ userName, estimateValue }]
    3. HTTP resolves → VOTE case runs → [...state, { userName, estimateValue }] → DUPLICATE
  Sequence when HTTP faster than WS (rare):
    1. HTTP resolves → VOTE → state = [optimisticEntry]
    2. WS arrives → RESULTS_UPDATED → state = [serverEntry] — no duplicate
  implication: Bug manifests in the common case (fast local/LAN connection, WS burst at 10ms beats HTTP roundtrip)

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: reducer_results.js VOTE case appended an optimistic entry after the HTTP /vote response resolved. Because redux-promise only dispatches after promise resolution, and the WebSocket burst fires at 10ms (before the HTTP roundtrip completes), RESULTS_UPDATED sets state to the server result first, then the resolved VOTE action appends a second entry for the same player — a duplicate that persists until the next WS burst overwrites it.

fix: Added VOTE_OPTIMISTIC synchronous action dispatched on card click. reducer_vote sets voted=true immediately (instant chart transition). reducer_results pre-populates own vote entry; RESULTS_UPDATED replaces state entirely (idempotent). VOTE case in reducer_vote now only reverts to false on HTTP error. All 30 unit tests pass. Shipped in commit 5fa65c7.

files_changed:
  - planningpoker-web/src/actions/index.js
  - planningpoker-web/src/containers/Vote.jsx
  - planningpoker-web/src/reducers/reducer_results.js
  - planningpoker-web/src/reducers/reducer_vote.js
  - planningpoker-web/src/reducers/__tests__/reducer_results.test.js
  - planningpoker-web/src/reducers/__tests__/reducer_vote.test.js
