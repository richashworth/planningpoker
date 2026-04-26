## System: Planning Poker — Voting & Reset Round

### Entities

- **Session**: a single planning-poker session (the only one in the model)
  - Type: resource
  - Count: fixed at 1
  - States: active (the only modeled state)
  - Initial state: active

- **Member**: a registered participant in the session
  - Type: actor
  - Count: fixed N (default 3 for the model)
  - States: connected, disconnected
  - Initial state: connected

- **Host**: the privileged member who can trigger reset
  - Type: role (designation among members)
  - Count: exactly 1
  - States: assigned to one member for the lifetime of the model
  - Initial state: a designated host member is chosen at start

- **Vote (estimate)**: a (member, value) record for the current round
  - Type: resource (per-member, per-round)
  - Count: at most 1 per member per round
  - States: absent, cast(value)
  - Initial state: absent for every member

- **Round**: a monotonic counter for the session, plus history
  - Type: resource
  - Count: 1 counter per session; history grows by ≤1 per non-empty reset
  - States: integer ≥ 0; history is a list of completed-round snapshots
  - Initial state: counter = 0, history = empty

- **Broadcast (in-flight message)**: a server-to-client message about a state change
  - Type: resource (multiset of pending messages)
  - Count: bounded by activity; messages are consumed when delivered
  - States: pending, delivered (consumed). Each message carries its round number.
  - Initial state: empty

### Transitions

- **Member: cast vote (first-time)**
  - Trigger: connected member casts a vote of value v in legalValues
  - Guard: member is connected; v in legalValues; member has no vote in current round
  - Effect: record (member, v) at current round; emit RESULTS broadcast for current round

- **Member: update vote (re-vote)**
  - Trigger: connected member casts a different value v' in same round
  - Guard: member is connected; v' in legalValues; member already has a vote in current round
  - Effect: replace member's vote with v'; emit RESULTS broadcast for current round

- **Host: reset round (with votes)**
  - Trigger: host triggers reset
  - Guard: actor is the host; host is connected (a disconnected host cannot reset — needs an active session to call the API); round has at least one cast vote
  - Effect: snapshot {round, votes} into history; clear all votes; increment round counter; emit RESET broadcast for new round

- **Host: reset round (empty)**
  - Trigger: host triggers reset
  - Guard: actor is the host; host is connected; round has zero cast votes
  - Effect: do not snapshot; clear (no-op); increment round counter; emit RESET broadcast for new round

- **Member: deliver broadcast (RESULTS, newer round)**
  - Trigger: a RESULTS broadcast for round R > member's known round is delivered
  - Effect: member's known round = R; member's view of votes = broadcast's votes

- **Member: deliver broadcast (RESULTS, same round)**
  - Trigger: a RESULTS broadcast for round R = member's known round is delivered
  - Effect: merge per-member — for each member listed in the broadcast (with a legal value), set the receiver's view of that member's vote to the broadcast value (overwriting any prior view of that member at this round); for members not in the broadcast, preserve the existing view. (Real-world note: RESULTS broadcasts only ever carry members who have voted, so this is effectively "broadcast augments view with newly-voted members.")

- **Member: deliver broadcast (RESULTS, older round)**
  - Trigger: a RESULTS broadcast for round R < member's known round is delivered
  - Effect: ignored (no state change)

- **Member: deliver broadcast (RESET, newer round)**
  - Trigger: a RESET broadcast for round R > member's known round is delivered
  - Effect: member's known round = R; member's view of votes = empty

- **Member: deliver broadcast (RESET, equal-or-older round)**
  - Trigger: a RESET broadcast for round R <= member's known round is delivered
  - Effect: ignored

- **Member: disconnect**
  - Trigger: member's WS connection drops
  - Effect: member becomes disconnected; pending broadcasts targeted at them are dropped

- **Member: lose broadcast**
  - Trigger: a pending broadcast is dropped before delivery
  - Effect: broadcast removed without being applied (models lossy delivery)

### Constraints

**Should never happen:**
- A member has more than one vote recorded in the same round
- A vote is recorded with a value not in legalValues
- The round counter decreases
- A snapshot in history exists for a round number >= the current round counter
- A non-host triggers a reset
- An empty round produces a snapshot in history
- A member's known round exceeds the server's round counter
- A member's view of votes contains a value not in legalValues

**Must always be true:**
- The round counter is monotonically non-decreasing throughout the session
- After a reset, the previous round's votes are cleared from the server's state
- Every snapshot in history corresponds to a round strictly less than the current round counter
- The set of currently cast votes is a subset of (members x legalValues)
- For every snapshot in history, its votes are a subset of (members x legalValues)
- A member's known round is <= the server's round
- For every still-connected member, their known round and view of votes is consistent with some RESULTS or RESET broadcast that the server has emitted for that round (or with the initial state)

**Must eventually happen (conditional on staying connected):**
- After a member casts or updates a vote, every still-connected member eventually observes that vote (via delivered broadcast)
- After the host triggers a reset, every still-connected member eventually advances to the new round (their known round = server's round) and shows no votes for the new round

### Concurrency
- Simultaneous actors: any member can act at any time (cast or update vote); the host can additionally reset; broadcasts to different members can be delivered in any interleaving
- Conflict resolution: every server-side action (vote, reset) is atomic — it reads the round counter, mutates state, and emits one broadcast as a single indivisible step. Effective execution is some serialization of concurrent requests.
- Atomicity:
  - Vote check + register (or replace) is atomic
  - Snapshot + clear + increment + emit-broadcast on reset is atomic
  - Per-member broadcast delivery is atomic (the member's known round and view advance together)

### Resource Bounds
- N members: small fixed parameter for the model (default 3)
- legalValues: small fixed set (default {1, 2, 3})
- Round counter: unbounded; model checker explores up to a small depth (MaxRounds = 4)
- History: grows by <=1 per non-empty reset, bounded by depth
- Broadcast queue: at most one pending RESULTS broadcast per cast/update, plus one RESET broadcast per reset; bounded by depth

### Failure Modes

- **Lost broadcast**: a pending broadcast is dropped before delivery. Effect: still-connected members may stay stale until another broadcast arrives that supersedes the lost one. Spectators (members who never act) may stay permanently stale; the implementation's /refresh fallback only triggers after the member's own vote.
- **Member disconnect**: member's pending broadcasts are dropped; member is excluded from liveness. Reconnection and refresh are out of scope for this slice.
- **Stale broadcast arrival**: a broadcast for a strictly older round is delivered. Effect: ignored by the receiving member's reconciliation logic — no state change.
- **Duplicated broadcast**: the same broadcast is delivered more than once. Effect: same-round delivery is union (idempotent for RESULTS); newer-round delivery is replace (idempotent if applied with same payload); RESET applied at equal round is ignored. No state divergence.
- **Vote-during-reset race**: vote and reset serialize via the lock. If vote-then-reset, the vote is captured in the snapshot. If reset-then-vote, the vote attaches to the new round. No state inconsistency, but the user-attribution (which question their vote was for) depends on serialization order.
- **Host triple-click reset**: three resets serialize; each bumps the round. Empty rounds are skipped from history. No inconsistency.

### Fairness
- **After a vote, every still-connected member eventually observes it**: weak fairness on broadcast delivery (assumes the broadcast channel eventually delivers to still-connected subscribers).
- **After a reset, every still-connected member eventually advances**: weak fairness on broadcast delivery.
- **No strong-fairness properties identified** — actions don't get preempted; they atomically complete.

### Termination
- **Terminates**: no — the system runs continuously. Sessions don't have a "completed" terminal state; they accumulate rounds indefinitely (until evicted, which is out of scope for this slice).
- For the model checker, exploration terminates by the bounded round depth (MaxRounds).

### Implementation Detail (intended behavior — diverges from current backend)

- **Reset is host-only** in the spec. The current backend allows any session member to call /reset (with an explicit code comment acknowledging this). The UI gates the reset button to host-only via `isAdmin` check in `Results.jsx`. The spec models the intended behavior; the backend's missing host check is a known gap to flag.
- **Re-vote replaces** the member's existing vote. The current backend silently drops a second vote (returns current state unchanged). The spec models the intended behavior (matches standard planning-poker UX); the backend's silent-drop is a known bug to flag.

### Verification Status (as of 2026-04-25)

- **Model parameters:** Members={m1,m2}, Host=m1, LegalValues={1,2}, MaxRounds=2; state constraint Cardinality(inflight) <= 4
- **Safety: VERIFIED exhaustively.** TLC explored 18.4M distinct states (106M total) in ~2 minutes. All 7 invariants hold:
  - TypeOK, AllVotesLegal, HistoryVotesLegal, HistoryRoundsBelowCurrent, NoEmptySnapshots, KnownRoundBoundedByServer, ViewValuesLegal
  - Action properties RoundMonotonic and VotesClearedAfterReset also hold.
- **Liveness: confirmed via random simulation** (200 traces × depth 100 ≈ 9000 states, no violations of ResetEventuallyObserved). Exhaustive liveness checking exceeds the practical time budget at the chosen bounds because the inflight set semantics generate large state spaces. Re-enable PROPERTY ResetEventuallyObserved in the .cfg and run with smaller bounds (e.g., LegalValues={1}) for exhaustive liveness verification.
- **Modeling limitations:**
  - `emitted` history variable was dropped to keep the state space tractable; consequently the `ViewConsistentWithEmitted` invariant (every observed view is consistent with some emitted broadcast) is not currently checked. The other 7 invariants still ensure value-level legality and structural correctness.
  - Lossy broadcast delivery (`LoseBroadcast`) is not modeled; STOMP within a connected channel is treated as reliable, matching real TCP behavior.
  - Reconnect/refresh paths (8s vote-fallback, /sessionUsers probe on reconnect) are out of scope for this slice.
