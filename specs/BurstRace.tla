---- MODULE BurstRace ----
EXTENDS Integers, FiniteSets, Sequences

CONSTANTS
    Voters,              \* set of voter identities
    MaxMessagesPerBurst  \* number of messages each burst emits (6)

VARIABLES
    serverResults,  \* SUBSET Voters — voters whose votes the server has recorded
    clientResults,  \* SUBSET Voters — voters the client currently displays
    bursts          \* sequence of [snapshot |-> SUBSET Voters, remaining |-> 0..MaxMessagesPerBurst]

vars == << serverResults, clientResults, bursts >>

BurstType == [snapshot : SUBSET Voters, remaining : 0..MaxMessagesPerBurst]

\* --- Type Invariant ---
TypeOK ==
    /\ serverResults \subseteq Voters
    /\ clientResults \subseteq Voters
    /\ bursts \in Seq(BurstType)
    /\ Len(bursts) <= Cardinality(Voters)

\* --- Initial State ---
Init ==
    /\ serverResults = {}
    /\ clientResults = {}
    /\ bursts = << >>

\* --- Actions ---

\* A voter casts their vote: server records it atomically and spawns a new burst
\* whose snapshot equals the just-updated serverResults.
CastVote(v) ==
    /\ v \notin serverResults
    /\ serverResults' = serverResults \cup {v}
    /\ bursts' = Append(bursts,
                        [snapshot   |-> serverResults \cup {v},
                         remaining  |-> MaxMessagesPerBurst])
    /\ UNCHANGED clientResults

\* A burst at index i emits one message: the client's results are overwritten
\* entirely with that burst's snapshot (last-write-wins), and remaining decrements.
\* Any in-flight burst with remaining>0 may fire at any time — this models the
\* arbitrary interleaving of async delivery across bursts.
EmitMessage(i) ==
    /\ i \in 1..Len(bursts)
    /\ bursts[i].remaining > 0
    /\ clientResults' = bursts[i].snapshot
    /\ bursts' = [bursts EXCEPT ![i].remaining = @ - 1]
    /\ UNCHANGED serverResults

\* --- Next-State Relation ---
Next ==
    \/ \E v \in Voters : CastVote(v)
    \/ \E i \in 1..Len(bursts) : EmitMessage(i)

\* --- Specification ---
\* Liveness: every individual burst-emit and cast-vote must get fair scheduling
\* so that bursts drain. Per-action weak fairness.
Spec == Init /\ [][Next]_vars
         /\ \A v \in Voters : WF_vars(CastVote(v))
         /\ \A i \in 1..Cardinality(Voters) : WF_vars(EmitMessage(i))

\* --- Safety Invariants ---

\* Client never ahead of server.
ClientSubsetOfServer ==
    clientResults \subseteq serverResults

\* Primary invariant: non-monotonic regression of clientResults.
\* We express this as: at any reachable state, clientResults already contains
\* every voter that it will be "supposed to" contain given the snapshots still
\* in flight. The clean formulation is a step-level property: no step shrinks
\* clientResults. That's a temporal property, not a state invariant — encode
\* it via an action-level check that every EmitMessage preserves monotonicity.
\*
\* Equivalently as a state invariant: for every in-flight burst whose snapshot
\* is a proper subset of clientResults, that burst must not be allowed to fire
\* without regressing. Since we can't forbid it, the property this invariant
\* asserts is that no such "stale" burst exists while clientResults is larger.
\* If TLC finds a state where a stale burst is pending and clientResults has
\* already observed a larger snapshot, the next EmitMessage of that stale burst
\* will violate monotonicity.
NoStalePendingBurst ==
    \A i \in 1..Len(bursts) :
        bursts[i].remaining > 0 => clientResults \subseteq bursts[i].snapshot

\* --- Liveness Properties ---

\* Once every burst has drained, clientResults equals serverResults.
AllDrained == \A i \in 1..Len(bursts) : bursts[i].remaining = 0

EventualConvergence ==
    <>[](serverResults = Voters /\ AllDrained /\ clientResults = serverResults)

====
