---- MODULE BurstRaceFixed ----
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

\* FIX: every emission re-reads current serverResults instead of using the
\* frozen burst.snapshot. The burst still carries a remaining counter so we
\* keep the retry cadence, but the payload is always fresh.
EmitMessage(i) ==
    /\ i \in 1..Len(bursts)
    /\ bursts[i].remaining > 0
    /\ clientResults' = serverResults
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

\* Primary property under the fix: clientResults is monotonically growing.
\* This is a temporal (two-state) property, expressed as a step predicate
\* over every transition.
MonotonicClient ==
    [][clientResults \subseteq clientResults']_vars

\* --- Liveness Properties ---

\* Once every burst has drained, clientResults equals serverResults.
AllDrained == \A i \in 1..Len(bursts) : bursts[i].remaining = 0

EventualConvergence ==
    <>[](serverResults = Voters /\ AllDrained /\ clientResults = serverResults)

====
