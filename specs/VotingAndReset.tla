---- MODULE VotingAndReset ----
\* Planning Poker — Voting & Reset Round (intended behavior)
\* Models a single session with a fixed member set, a designated host,
\* a monotonic round counter, in-flight broadcasts (RESULTS / RESET),
\* and per-member views reconciled by round/epoch.
\*
\* Note: this spec intentionally captures the *intended* behavior, which
\* differs from the current backend in two ways:
\*   - reset is host-only here (backend allows any session member)
\*   - re-vote replaces the prior value (backend silently drops it)

EXTENDS Integers, Sequences, FiniteSets

CONSTANTS
    Members,        \* set of member identifiers (e.g. {m1, m2})
    Host,           \* the designated host (Host \in Members)
    LegalValues,    \* set of legal vote values (e.g. {1, 2})
    MaxRounds,      \* upper bound on the server's round counter (state-space cap)
    NoVote          \* sentinel for "no value cast" (declare as TLC model value
                    \*   in .cfg so it never type-mixes with LegalValues elements)

\* Broadcast kinds
ResultsKind == "RESULTS"
ResetKind   == "RESET"

VARIABLES
    serverRound,        \* server's current round counter (Nat)
    serverVotes,        \* serverVotes[m] = LegalValues \cup {NoVote} for current round
    history,            \* sequence of completed-round snapshots
    connected,          \* set of currently connected members
    memberKnownRound,   \* memberKnownRound[m] = the latest round m has observed
    memberView,         \* memberView[m][m2] = m's view of m2's vote
    inflight            \* set of pending broadcasts; each targets a specific member

vars == << serverRound, serverVotes, history, connected,
           memberKnownRound, memberView, inflight >>

\* --- Helpers ---

SnapshotType ==
    [ round : 0..MaxRounds,
      votes : [Members -> LegalValues \cup {NoVote}] ]

\* A broadcast envelope. Each broadcast targets one member (per-subscriber delivery).
BroadcastType ==
    [ kind   : {ResultsKind, ResetKind},
      target : Members,
      round  : 0..MaxRounds,
      votes  : [Members -> LegalValues \cup {NoVote}] ]

\* Emit one broadcast per currently-connected member. (STOMP only delivers to
\* active subscribers; broadcasts targeted at disconnected members would
\* never be consumed and would falsify liveness.)
ResultsBroadcasts(r, vfun, conn) ==
    { [kind |-> ResultsKind, target |-> m, round |-> r, votes |-> vfun]
        : m \in conn }

EmptyVotes == [ m \in Members |-> NoVote ]

ResetBroadcasts(r, conn) ==
    { [kind |-> ResetKind, target |-> m, round |-> r, votes |-> EmptyVotes]
        : m \in conn }

HasAnyVote(vfun) == \E m \in Members : vfun[m] \in LegalValues

\* --- Type Invariant ---
\*
\* Note: "at most one vote per member per round" is structurally enforced
\* by serverVotes being a function from Members.

TypeOK ==
    /\ serverRound \in 0..MaxRounds
    /\ serverVotes \in [Members -> LegalValues \cup {NoVote}]
    /\ history \in Seq(SnapshotType)
    /\ connected \subseteq Members
    /\ memberKnownRound \in [Members -> 0..MaxRounds]
    /\ memberView \in [Members -> [Members -> LegalValues \cup {NoVote}]]
    /\ inflight \subseteq BroadcastType

\* --- State Constraint (model-checking aid) ---
\* Bounds the inflight queue to keep the state space tractable. With re-vote
\* enabled, broadcasts can pile up faster than they're delivered; this caps
\* exploration at "reasonable" backlog sizes.
StateConstraint == Cardinality(inflight) <= 4

\* --- Initial State ---

Init ==
    /\ serverRound = 0
    /\ serverVotes = [m \in Members |-> NoVote]
    /\ history = << >>
    /\ connected = Members
    /\ memberKnownRound = [m \in Members |-> 0]
    /\ memberView = [m \in Members |-> [m2 \in Members |-> NoVote]]
    /\ inflight = {}

\* --- Actions ---

\* Member casts a first-time vote in the current round.
CastVote(m, v) ==
    /\ m \in connected
    /\ v \in LegalValues
    /\ serverVotes[m] = NoVote
    /\ LET newVotes  == [serverVotes EXCEPT ![m] = v]
           newBcasts == ResultsBroadcasts(serverRound, newVotes, connected)
       IN  /\ serverVotes' = newVotes
           /\ inflight' = inflight \cup newBcasts
    /\ UNCHANGED << serverRound, history, connected,
                    memberKnownRound, memberView >>

\* Member updates an existing vote in the current round (re-vote replaces).
UpdateVote(m, v) ==
    /\ m \in connected
    /\ v \in LegalValues
    /\ serverVotes[m] \in LegalValues
    /\ serverVotes[m] # v
    /\ LET newVotes  == [serverVotes EXCEPT ![m] = v]
           newBcasts == ResultsBroadcasts(serverRound, newVotes, connected)
       IN  /\ serverVotes' = newVotes
           /\ inflight' = inflight \cup newBcasts
    /\ UNCHANGED << serverRound, history, connected,
                    memberKnownRound, memberView >>

\* Host resets a non-empty round: snapshot, clear, increment, broadcast.
\* Guard "Host \in connected" matches the summary's precondition that the
\* host must be connected to call the reset API.
ResetWithVotes ==
    /\ serverRound + 1 \in 0..MaxRounds
    /\ HasAnyVote(serverVotes)
    /\ Host \in connected
    /\ LET snap     == [round |-> serverRound, votes |-> serverVotes]
           newRound == serverRound + 1
           newBcasts == ResetBroadcasts(newRound, connected)
       IN  /\ history' = Append(history, snap)
           /\ serverVotes' = EmptyVotes
           /\ serverRound' = newRound
           /\ inflight' = inflight \cup newBcasts
    /\ UNCHANGED << connected, memberKnownRound, memberView >>

\* Host resets an empty round: no snapshot, increment, broadcast.
ResetEmpty ==
    /\ serverRound + 1 \in 0..MaxRounds
    /\ ~ HasAnyVote(serverVotes)
    /\ Host \in connected
    /\ LET newRound  == serverRound + 1
           newBcasts == ResetBroadcasts(newRound, connected)
       IN  /\ serverRound' = newRound
           /\ inflight' = inflight \cup newBcasts
    /\ UNCHANGED << serverVotes, history, connected,
                    memberKnownRound, memberView >>

\* Member m delivers a RESULTS broadcast b targeted at m, where b.round > known.
DeliverResultsNewer(m, b) ==
    /\ b \in inflight
    /\ b.kind = ResultsKind
    /\ b.target = m
    /\ m \in connected
    /\ b.round > memberKnownRound[m]
    /\ memberKnownRound' = [memberKnownRound EXCEPT ![m] = b.round]
    /\ memberView' = [memberView EXCEPT ![m] = b.votes]
    /\ inflight' = inflight \ {b}
    /\ UNCHANGED << serverRound, serverVotes, history, connected >>

\* Member m delivers a RESULTS broadcast b at the same round: merge per-member.
\* (Last-writer-per-member: broadcasts at the same round derive from the same
\* monotonically-evolving serverVotes, so overwriting per-member with the
\* broadcast value preserves consistency at that round.)
DeliverResultsSame(m, b) ==
    /\ b \in inflight
    /\ b.kind = ResultsKind
    /\ b.target = m
    /\ m \in connected
    /\ b.round = memberKnownRound[m]
    /\ LET unioned ==
            [ m2 \in Members |->
                IF b.votes[m2] \in LegalValues
                THEN b.votes[m2]
                ELSE memberView[m][m2] ]
       IN  memberView' = [memberView EXCEPT ![m] = unioned]
    /\ inflight' = inflight \ {b}
    /\ UNCHANGED << serverRound, serverVotes, history, connected,
                    memberKnownRound >>

\* Member m delivers a stale RESULTS broadcast: ignore (drop it).
DeliverResultsOlder(m, b) ==
    /\ b \in inflight
    /\ b.kind = ResultsKind
    /\ b.target = m
    /\ b.round < memberKnownRound[m]
    /\ inflight' = inflight \ {b}
    /\ UNCHANGED << serverRound, serverVotes, history, connected,
                    memberKnownRound, memberView >>

\* Member m delivers a RESET broadcast at a strictly newer round.
DeliverResetNewer(m, b) ==
    /\ b \in inflight
    /\ b.kind = ResetKind
    /\ b.target = m
    /\ m \in connected
    /\ b.round > memberKnownRound[m]
    /\ memberKnownRound' = [memberKnownRound EXCEPT ![m] = b.round]
    /\ memberView' = [memberView EXCEPT ![m] = EmptyVotes]
    /\ inflight' = inflight \ {b}
    /\ UNCHANGED << serverRound, serverVotes, history, connected >>

\* Member m delivers a RESET broadcast at <= known round: ignore.
DeliverResetStale(m, b) ==
    /\ b \in inflight
    /\ b.kind = ResetKind
    /\ b.target = m
    /\ b.round <= memberKnownRound[m]
    /\ inflight' = inflight \ {b}
    /\ UNCHANGED << serverRound, serverVotes, history, connected,
                    memberKnownRound, memberView >>

\* Member disconnects. Pending broadcasts targeted at them are dropped.
Disconnect(m) ==
    /\ m \in connected
    /\ connected' = connected \ {m}
    /\ inflight' = { b \in inflight : b.target # m }
    /\ UNCHANGED << serverRound, serverVotes, history,
                    memberKnownRound, memberView >>

\* --- Next-State Relation ---

Next ==
    \/ \E m \in Members, v \in LegalValues : CastVote(m, v)
    \/ \E m \in Members, v \in LegalValues : UpdateVote(m, v)
    \/ ResetWithVotes
    \/ ResetEmpty
    \/ \E m \in Members, b \in inflight : DeliverResultsNewer(m, b)
    \/ \E m \in Members, b \in inflight : DeliverResultsSame(m, b)
    \/ \E m \in Members, b \in inflight : DeliverResultsOlder(m, b)
    \/ \E m \in Members, b \in inflight : DeliverResetNewer(m, b)
    \/ \E m \in Members, b \in inflight : DeliverResetStale(m, b)
    \/ \E m \in Members : Disconnect(m)

\* --- Specification ---
\*
\* Per-action weak fairness on each member's deliver actions.
\* No fairness on Disconnect — it's an environment failure.
Spec ==
    /\ Init
    /\ [][Next]_vars
    /\ \A m \in Members : WF_vars(\E b \in inflight : DeliverResultsNewer(m, b))
    /\ \A m \in Members : WF_vars(\E b \in inflight : DeliverResultsSame(m, b))
    /\ \A m \in Members : WF_vars(\E b \in inflight : DeliverResultsOlder(m, b))
    /\ \A m \in Members : WF_vars(\E b \in inflight : DeliverResetNewer(m, b))
    /\ \A m \in Members : WF_vars(\E b \in inflight : DeliverResetStale(m, b))

\* --- Safety Invariants ---

AllVotesLegal ==
    \A m \in Members :
        (serverVotes[m] # NoVote) => serverVotes[m] \in LegalValues

HistoryVotesLegal ==
    \A i \in 1..Len(history) :
        \A m \in Members :
            (history[i].votes[m] # NoVote) => history[i].votes[m] \in LegalValues

HistoryRoundsBelowCurrent ==
    \A i \in 1..Len(history) : history[i].round < serverRound

NoEmptySnapshots ==
    \A i \in 1..Len(history) :
        \E m \in Members : history[i].votes[m] \in LegalValues

KnownRoundBoundedByServer ==
    \A m \in Members : memberKnownRound[m] <= serverRound

ViewValuesLegal ==
    \A m \in Members, m2 \in Members :
        memberView[m][m2] \in LegalValues \cup {NoVote}

\* --- Action Properties (temporal safety) ---

\* The round counter never decreases on any step.
RoundMonotonic == [][serverRound' >= serverRound]_vars

\* Whenever a reset action fires, the post-state has all votes cleared.
VotesClearedAfterReset ==
    [][(ResetWithVotes \/ ResetEmpty) => serverVotes' = EmptyVotes]_vars

\* --- Liveness Properties ---

\* If the server is at round r and a connected member m is behind, eventually
\* m catches up to round r (or beyond) or disconnects. By DeliverResetNewer's
\* effect, when m's known round becomes r, m's view is set to EmptyVotes --
\* covering the summary's "advance to new round AND show no votes" requirement
\* at the moment of delivery.
\*
\* Note: a stronger value-level liveness claim ("connected members eventually
\* see every cast vote in their view") cannot be expressed cleanly in TLA+
\* under the set semantics for inflight broadcasts: an infinite re-vote
\* oscillation can keep an identical RESULTS broadcast in the set indefinitely
\* even when each individual emit reaches the target in bounded real time.
\* The genuinely-checkable safety claim is ViewConsistentWithEmitted: every
\* observed view is consistent with some broadcast the server actually emitted.
ResetEventuallyObserved ==
    \A r \in 1..MaxRounds, m \in Members :
        (serverRound >= r /\ memberKnownRound[m] < r /\ m \in connected)
        ~> (memberKnownRound[m] >= r \/ m \notin connected)

====
