---- MODULE ResetBurstRaceMultiVoter ----
EXTENDS Integers, FiniteSets, Sequences

(***************************************************************************
Multi-voter extension of ResetBurstRaceFixed.tla.

The single-voter model proved the flicker bug and validated the "skip
RESET emit if serverResults is non-empty" fix. But it did NOT capture
the host/non-host asymmetry in the real system:

  - The HOST clicks Next Item in the UI, which calls `resetSession` in
    the Redux thunk. After the POST /reset succeeds, the host's client
    LOCALLY dispatches RESET_SESSION (voted := FALSE). The host never
    needs the RESET_MESSAGE from the WebSocket to transition back to
    the Vote view.

  - NON-HOST users have no such local dispatch. They learn about the
    reset ONLY through the RESET_MESSAGE burst. Without it, they stay
    stuck in the Results view (reducer_vote.js RESULTS_UPDATED only
    flips voted := TRUE if the user is in the payload; it never flips
    voted := FALSE).

This spec models two voters (h = host, nh = non-host), each with their
own `voted` and `clientResults` state. It includes the same
"skip-if-non-empty" fix as ResetBurstRaceFixed.tla, and adds a
`SettledCorrectness` invariant that says: once all bursts have drained,
every voter's `voted` flag must agree with `serverResults`.

If the fix causes a non-host to miss a RESET, the settled state will
have voted[nh] = TRUE while nh is NOT in serverResults — invariant
violated, bug confirmed.
***************************************************************************)

CONSTANTS
    Voters,                \* {h, nh}
    Host,                  \* the host identity (h)
    MaxMessagesPerBurst,
    MaxNextItems,
    MaxCastVotes

VARIABLES
    serverResults,
    voted,           \* [Voters -> BOOLEAN] — per-voter client flag
    clientResults,   \* [Voters -> SUBSET Voters] — per-voter last results
    bursts,
    voteAfterReset,  \* [Voters -> BOOLEAN] — per-voter: latched if v cast a vote while RESET burst was draining
    nextItemsDone,
    castVotesDone

vars == << serverResults, voted, clientResults, bursts,
           voteAfterReset, nextItemsDone, castVotesDone >>

BurstType == [type      : {"RESET", "RESULTS"},
              remaining : 0..MaxMessagesPerBurst]

TypeOK ==
    /\ serverResults \subseteq Voters
    /\ voted \in [Voters -> BOOLEAN]
    /\ clientResults \in [Voters -> SUBSET Voters]
    /\ bursts \in Seq(BurstType)
    /\ voteAfterReset \in [Voters -> BOOLEAN]
    /\ nextItemsDone \in 0..MaxNextItems
    /\ castVotesDone \in 0..MaxCastVotes

Init ==
    /\ serverResults = {}
    /\ voted = [v \in Voters |-> FALSE]
    /\ clientResults = [v \in Voters |-> {}]
    /\ bursts = << >>
    /\ voteAfterReset = [v \in Voters |-> FALSE]
    /\ nextItemsDone = 0
    /\ castVotesDone = 0

ResetDraining ==
    \E i \in 1..Len(bursts) :
        bursts[i].type = "RESET" /\ bursts[i].remaining > 0

\* Voter v casts a vote. Their client optimistically flips voted[v] := TRUE.
CastVote(v) ==
    /\ castVotesDone < MaxCastVotes
    /\ v \notin serverResults
    /\ serverResults' = serverResults \cup {v}
    /\ voted' = [voted EXCEPT ![v] = TRUE]
    /\ bursts' = Append(bursts,
                        [type      |-> "RESULTS",
                         remaining |-> MaxMessagesPerBurst])
    /\ voteAfterReset' = [voteAfterReset EXCEPT ![v] = (voteAfterReset[v] \/ ResetDraining)]
    /\ castVotesDone' = castVotesDone + 1
    /\ UNCHANGED << clientResults, nextItemsDone >>

\* Host clicks Next Item. Server clears state and spawns both bursts.
\* The HOST client locally dispatches RESET_SESSION (voted[Host] := FALSE).
\* Non-host clients are unchanged — they must learn via the RESET burst.
ClickNextItem ==
    /\ nextItemsDone < MaxNextItems
    /\ serverResults' = {}
    /\ voted' = [voted EXCEPT ![Host] = FALSE]
    /\ bursts' = Append(Append(bursts,
                               [type      |-> "RESET",
                                remaining |-> MaxMessagesPerBurst]),
                        [type      |-> "RESULTS",
                         remaining |-> MaxMessagesPerBurst])
    /\ nextItemsDone' = nextItemsDone + 1
    /\ UNCHANGED << clientResults, voteAfterReset, castVotesDone >>

\* FIX under test: skip RESET emit if serverResults is non-empty.
\* When the emit fires, every connected client's RESET_SESSION reducer
\* sets voted[v] := FALSE for all v.
EmitReset(i) ==
    /\ i \in 1..Len(bursts)
    /\ bursts[i].type = "RESET"
    /\ bursts[i].remaining > 0
    /\ IF serverResults = {}
       THEN /\ voted' = [v \in Voters |-> FALSE]
            /\ clientResults' = [v \in Voters |-> {}]
       ELSE /\ UNCHANGED voted
            /\ UNCHANGED clientResults
    /\ bursts' = [bursts EXCEPT ![i].remaining = @ - 1]
    /\ UNCHANGED << serverResults, voteAfterReset,
                    nextItemsDone, castVotesDone >>

\* EmitResults: re-reads serverResults. For each voter v, clientResults[v]
\* becomes serverResults. voted[v] flips TRUE only if v is in serverResults
\* (RESULTS_UPDATED reducer rule).
EmitResults(i) ==
    /\ i \in 1..Len(bursts)
    /\ bursts[i].type = "RESULTS"
    /\ bursts[i].remaining > 0
    /\ clientResults' = [v \in Voters |-> serverResults]
    /\ voted' = [v \in Voters |->
                    IF v \in serverResults THEN TRUE ELSE voted[v]]
    /\ bursts' = [bursts EXCEPT ![i].remaining = @ - 1]
    /\ UNCHANGED << serverResults, voteAfterReset,
                    nextItemsDone, castVotesDone >>

Next ==
    \/ \E v \in Voters : CastVote(v)
    \/ ClickNextItem
    \/ \E i \in 1..Len(bursts) : EmitReset(i)
    \/ \E i \in 1..Len(bursts) : EmitResults(i)

Spec == Init /\ [][Next]_vars
         /\ \A v \in Voters : WF_vars(CastVote(v))
         /\ WF_vars(ClickNextItem)
         /\ \A i \in 1..(2 * (MaxNextItems + MaxCastVotes)) :
                WF_vars(EmitReset(i))
         /\ \A j \in 1..(2 * (MaxNextItems + MaxCastVotes)) :
                WF_vars(EmitResults(j))

AllDrained == \A i \in 1..Len(bursts) : bursts[i].remaining = 0

\* Host flicker invariant (from the single-voter model), now per-voter.
\* Once voter v has cast a vote while a RESET burst was draining, and
\* that vote is still recorded server-side, v's voted flag must stay TRUE.
NoFlicker ==
    \A v \in Voters :
        (voteAfterReset[v] /\ v \in serverResults) => voted[v] = TRUE

\* The NEW invariant this spec is designed to expose. Once every burst
\* has drained, each voter's UI state must reflect the server: voted[v]
\* iff v is in serverResults. If the fix causes a non-host to miss the
\* RESET, voted[nh] stays TRUE while nh is NOT in serverResults —
\* violation, bug confirmed.
SettledCorrectness ==
    AllDrained => \A v \in Voters : voted[v] = (v \in serverResults)

====
