---- MODULE ResetBurstRace ----
EXTENDS Integers, FiniteSets, Sequences

(***************************************************************************
Models the reset-burst race in the planning-poker app.

Host clicks "Next Item" -> POST /reset -> server calls both
   sendResetNotification()   (bursts RESET_MESSAGE 6x over ~7.7s)
   burstResultsMessages()    (bursts RESULTS_MESSAGE 6x over ~7.7s)

Each burst emits at delays {10ms, 50ms, 150ms, 500ms, 2s, 5s} and runs
asynchronously. If a host re-votes during that window, stale RESET
messages from the earlier reset can clobber `voted=TRUE` on the client.
RESULTS bursts re-read serverResults each iteration (the existing fix
in MessagingUtils#burstResultsMessages). RESET bursts have no payload.

This spec models a single HOST voter so we can track whether the host's
`voted` flag flickers from TRUE -> FALSE after a vote that came AFTER
an earlier reset burst started draining.
***************************************************************************)

CONSTANTS
    Voters,                \* set of voter identities (use {h} for host only)
    MaxMessagesPerBurst,   \* messages each burst emits (shrunk from 6 to 3)
    MaxNextItems,          \* bound on total ClickNextItem events
    MaxCastVotes           \* bound on total CastVote events

VARIABLES
    serverResults,   \* SUBSET Voters — voters recorded server-side
    voted,           \* Boolean — client UI "has voted" flag for host
    clientResults,   \* SUBSET Voters — last results payload the client saw
    bursts,          \* sequence of burst records (see BurstType below)
    voteAfterReset,  \* TRUE once a vote has been cast while a RESET burst was draining
    nextItemsDone,   \* counter — bounds ClickNextItem
    castVotesDone    \* counter — bounds CastVote

vars == << serverResults, voted, clientResults, bursts,
           voteAfterReset, nextItemsDone, castVotesDone >>

BurstType == [type      : {"RESET", "RESULTS"},
              remaining : 0..MaxMessagesPerBurst]

\* --- Type Invariant ---
TypeOK ==
    /\ serverResults \subseteq Voters
    /\ voted \in BOOLEAN
    /\ clientResults \subseteq Voters
    /\ bursts \in Seq(BurstType)
    /\ voteAfterReset \in BOOLEAN
    /\ nextItemsDone \in 0..MaxNextItems
    /\ castVotesDone \in 0..MaxCastVotes

\* --- Initial State ---
Init ==
    /\ serverResults = {}
    /\ voted = FALSE
    /\ clientResults = {}
    /\ bursts = << >>
    /\ voteAfterReset = FALSE
    /\ nextItemsDone = 0
    /\ castVotesDone = 0

\* --- Helpers ---

\* Some RESET burst is still draining. Used to detect a vote cast during a
\* reset burst's retry window.
ResetDraining ==
    \E i \in 1..Len(bursts) :
        bursts[i].type = "RESET" /\ bursts[i].remaining > 0

\* --- Actions ---

\* The modeled player casts a vote (optimistic update flips voted=TRUE
\* client-side) and the server records it and spawns a RESULTS burst.
CastVote(v) ==
    /\ castVotesDone < MaxCastVotes
    /\ v \notin serverResults
    /\ serverResults' = serverResults \cup {v}
    /\ voted' = TRUE                             \* client-local optimistic flip
    /\ bursts' = Append(bursts,
                        [type      |-> "RESULTS",
                         remaining |-> MaxMessagesPerBurst])
    /\ voteAfterReset' = (voteAfterReset \/ ResetDraining)
    /\ castVotesDone' = castVotesDone + 1
    /\ UNCHANGED << clientResults, nextItemsDone >>

\* Host clicks Next Item: server clears state and spawns BOTH a RESET burst
\* and a RESULTS burst (mirroring GameController.reset()).
ClickNextItem ==
    /\ nextItemsDone < MaxNextItems
    /\ serverResults' = {}
    /\ bursts' = Append(Append(bursts,
                               [type      |-> "RESET",
                                remaining |-> MaxMessagesPerBurst]),
                        [type      |-> "RESULTS",
                         remaining |-> MaxMessagesPerBurst])
    /\ nextItemsDone' = nextItemsDone + 1
    /\ UNCHANGED << voted, clientResults, voteAfterReset, castVotesDone >>

\* Emit one RESET message from burst i. On the client: voted -> FALSE and
\* clientResults -> {} (the RESET_MESSAGE handler in reducer_vote.js).
EmitReset(i) ==
    /\ i \in 1..Len(bursts)
    /\ bursts[i].type = "RESET"
    /\ bursts[i].remaining > 0
    /\ voted' = FALSE
    /\ clientResults' = {}
    /\ bursts' = [bursts EXCEPT ![i].remaining = @ - 1]
    /\ UNCHANGED << serverResults, voteAfterReset,
                    nextItemsDone, castVotesDone >>

\* Emit one RESULTS message from burst i. Re-reads serverResults each time
\* (the existing fix). On the client: clientResults <- serverResults; and
\* if the modeled player is in serverResults, voted -> TRUE.
EmitResults(i) ==
    /\ i \in 1..Len(bursts)
    /\ bursts[i].type = "RESULTS"
    /\ bursts[i].remaining > 0
    /\ clientResults' = serverResults
    /\ voted' = IF \E v \in Voters : v \in serverResults THEN TRUE ELSE voted
    /\ bursts' = [bursts EXCEPT ![i].remaining = @ - 1]
    /\ UNCHANGED << serverResults, voteAfterReset,
                    nextItemsDone, castVotesDone >>

\* --- Next-State Relation ---
Next ==
    \/ \E v \in Voters : CastVote(v)
    \/ ClickNextItem
    \/ \E i \in 1..Len(bursts) : EmitReset(i)
    \/ \E i \in 1..Len(bursts) : EmitResults(i)

\* --- Specification ---
\* Per-action weak fairness so all bursts eventually drain.
Spec == Init /\ [][Next]_vars
         /\ \A v \in Voters : WF_vars(CastVote(v))
         /\ WF_vars(ClickNextItem)
         /\ \A i \in 1..(2 * (MaxNextItems + MaxCastVotes)) :
                WF_vars(EmitReset(i))
         /\ \A j \in 1..(2 * (MaxNextItems + MaxCastVotes)) :
                WF_vars(EmitResults(j))

\* --- Safety Invariants ---

\* Client never shows voters the server hasn't seen.
ClientSubsetOfServer ==
    clientResults \subseteq serverResults \/ clientResults = {}

\* Primary flicker invariant.
\*
\* Once the host has voted AFTER a reset burst started draining, the host
\* should never see voted=FALSE again (that would be the flicker back to
\* the Vote screen caused by a stale RESET message from the prior reset).
\*
\* Violation exhibits the bug: TLC produces a trace where a CastVote
\* happened with ResetDraining=TRUE, then a later EmitReset fires from
\* the still-draining prior RESET burst, setting voted back to FALSE
\* despite serverResults being non-empty.
NoFlicker ==
    (voteAfterReset /\ serverResults # {}) => voted = TRUE

\* --- Liveness Properties ---

\* Every burst has drained.
AllDrained == \A i \in 1..Len(bursts) : bursts[i].remaining = 0

\* After everything settles, the client's UI reflects whether the server
\* has any recorded votes.
EventualCorrectSettled ==
    <>[](AllDrained =>
            (voted = (serverResults # {}) /\ clientResults = serverResults))

====
