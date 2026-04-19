---- MODULE ResetBurstRaceEpoch ----
EXTENDS Integers, FiniteSets, Sequences

(***************************************************************************
Models Option 2: round/epoch sequence numbers on every message, combined
with a stricter RESULTS reducer that sets voted[v] from payload presence.

Problem recap (from ResetBurstRace.tla and ResetBurstRaceMultiVoter.tla):
  - PR #62 added "skip RESET emit if serverResults non-empty" which fixed
    host-side flicker but introduced a stuck bug for non-host users (they
    rely on RESET to transition back to Vote view).

Option 2 design:
  - `serverRound` increments ONLY on ClickNextItem (not on CastVote).
  - Every RESET / RESULTS message carries the server's round AT THE TIME
    THE BURST WAS SPAWNED.
  - Client keeps `clientRound[v]` per voter.
  - Client rules:
      RESET   applied iff msg.round >  clientRound[v]  (strict)
      RESULTS applied iff msg.round >= clientRound[v]
  - The RESULTS reducer becomes semantic: voted[v] = (v in payload).
    Empty RESULTS → voted[v]=FALSE for all. This is key for the non-host
    case: even if RESET is filtered (stale), a subsequent RESULTS will
    flip voted[v]=FALSE because v is not in the post-reset payload.
  - CastVote(v) optimistic update also syncs clientRound[v] to serverRound
    (modelling that the /vote REST response carries the current round).
  - Join would be modelled similarly if we needed it — here we just start
    all voters at clientRound=0 and serverRound=0, consistent with a
    brand-new session.

Invariants to check:
  - NoFlicker: once v cast a vote while a RESET burst was draining and
    their vote is still recorded server-side, voted[v]=TRUE.
  - SettledCorrectness: after all bursts drain, voted[v] = (v in serverResults)
    for every v.
  - MonotonicClientRound: clientRound[v] never decreases (sanity).
***************************************************************************)

CONSTANTS
    Voters,
    Host,
    MaxMessagesPerBurst,
    MaxNextItems,
    MaxCastVotes

VARIABLES
    serverResults,
    serverRound,     \* Nat — increments on each ClickNextItem
    voted,           \* [Voters -> BOOLEAN]
    clientResults,   \* [Voters -> SUBSET Voters]
    clientRound,     \* [Voters -> Nat]
    bursts,          \* Seq of burst records (each with round field)
    voteAfterReset,  \* [Voters -> BOOLEAN]
    nextItemsDone,
    castVotesDone

vars == << serverResults, serverRound, voted, clientResults, clientRound,
           bursts, voteAfterReset, nextItemsDone, castVotesDone >>

\* Bound serverRound by MaxNextItems for finite state space.
MaxRound == MaxNextItems

BurstType == [type      : {"RESET", "RESULTS"},
              remaining : 0..MaxMessagesPerBurst,
              round     : 0..MaxRound]

TypeOK ==
    /\ serverResults \subseteq Voters
    /\ serverRound \in 0..MaxRound
    /\ voted \in [Voters -> BOOLEAN]
    /\ clientResults \in [Voters -> SUBSET Voters]
    /\ clientRound \in [Voters -> 0..MaxRound]
    /\ bursts \in Seq(BurstType)
    /\ voteAfterReset \in [Voters -> BOOLEAN]
    /\ nextItemsDone \in 0..MaxNextItems
    /\ castVotesDone \in 0..MaxCastVotes

Init ==
    /\ serverResults = {}
    /\ serverRound = 0
    /\ voted = [v \in Voters |-> FALSE]
    /\ clientResults = [v \in Voters |-> {}]
    /\ clientRound = [v \in Voters |-> 0]
    /\ bursts = << >>
    /\ voteAfterReset = [v \in Voters |-> FALSE]
    /\ nextItemsDone = 0
    /\ castVotesDone = 0

ResetDraining ==
    \E i \in 1..Len(bursts) :
        bursts[i].type = "RESET" /\ bursts[i].remaining > 0

\* Voter v casts a vote. Optimistic update: voted[v]=TRUE and clientRound[v]
\* syncs to current serverRound (the /vote REST response carries the round).
\* Server appends a RESULTS burst tagged with current serverRound.
CastVote(v) ==
    /\ castVotesDone < MaxCastVotes
    /\ v \notin serverResults
    /\ serverResults' = serverResults \cup {v}
    /\ voted' = [voted EXCEPT ![v] = TRUE]
    /\ clientRound' = [clientRound EXCEPT ![v] = serverRound]
    /\ bursts' = Append(bursts,
                        [type      |-> "RESULTS",
                         remaining |-> MaxMessagesPerBurst,
                         round     |-> serverRound])
    /\ voteAfterReset' = [voteAfterReset EXCEPT ![v] = (voteAfterReset[v] \/ ResetDraining)]
    /\ castVotesDone' = castVotesDone + 1
    /\ UNCHANGED << serverRound, clientResults, nextItemsDone >>

\* Host clicks Next Item. serverRound increments. serverResults cleared.
\* RESET and RESULTS bursts are spawned at the new round. Host's client
\* locally dispatches RESET_SESSION: voted[Host]=FALSE, clientRound[Host]
\* advances to the new round.
ClickNextItem ==
    /\ nextItemsDone < MaxNextItems
    /\ serverRound' = serverRound + 1
    /\ serverResults' = {}
    /\ voted' = [voted EXCEPT ![Host] = FALSE]
    /\ clientResults' = [clientResults EXCEPT ![Host] = {}]
    /\ clientRound' = [clientRound EXCEPT ![Host] = serverRound + 1]
    /\ bursts' = Append(Append(bursts,
                               [type      |-> "RESET",
                                remaining |-> MaxMessagesPerBurst,
                                round     |-> serverRound + 1]),
                        [type      |-> "RESULTS",
                         remaining |-> MaxMessagesPerBurst,
                         round     |-> serverRound + 1])
    /\ nextItemsDone' = nextItemsDone + 1
    /\ UNCHANGED << voteAfterReset, castVotesDone >>

\* Emit a RESET message. Every client that is still BELOW this message's
\* round applies the reset (voted=FALSE, clientResults={}, clientRound bumps).
\* Clients at or above this round drop it.
EmitReset(i) ==
    /\ i \in 1..Len(bursts)
    /\ bursts[i].type = "RESET"
    /\ bursts[i].remaining > 0
    /\ LET r == bursts[i].round IN
         /\ voted' = [v \in Voters |->
                        IF r > clientRound[v] THEN FALSE ELSE voted[v]]
         /\ clientResults' = [v \in Voters |->
                        IF r > clientRound[v] THEN {} ELSE clientResults[v]]
         /\ clientRound' = [v \in Voters |->
                        IF r > clientRound[v] THEN r ELSE clientRound[v]]
    /\ bursts' = [bursts EXCEPT ![i].remaining = @ - 1]
    /\ UNCHANGED << serverResults, serverRound, voteAfterReset,
                    nextItemsDone, castVotesDone >>

\* Emit a RESULTS message. Re-reads serverResults (chart-bounce fix).
\* Clients at or below this message's round apply: clientResults := serverResults,
\* voted[v] := (v in serverResults) — the "strict" reducer semantic change.
EmitResults(i) ==
    /\ i \in 1..Len(bursts)
    /\ bursts[i].type = "RESULTS"
    /\ bursts[i].remaining > 0
    /\ LET r == bursts[i].round IN
         /\ clientResults' = [v \in Voters |->
                        IF r >= clientRound[v] THEN serverResults ELSE clientResults[v]]
         /\ voted' = [v \in Voters |->
                        IF r >= clientRound[v] THEN (v \in serverResults) ELSE voted[v]]
         /\ clientRound' = [v \in Voters |->
                        IF r > clientRound[v] THEN r ELSE clientRound[v]]
    /\ bursts' = [bursts EXCEPT ![i].remaining = @ - 1]
    /\ UNCHANGED << serverResults, serverRound, voteAfterReset,
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

NoFlicker ==
    \A v \in Voters :
        (voteAfterReset[v] /\ v \in serverResults) => voted[v] = TRUE

SettledCorrectness ==
    AllDrained => \A v \in Voters : voted[v] = (v \in serverResults)

\* Client round never goes backwards.
MonotonicClientRound == [][\A v \in Voters : clientRound'[v] >= clientRound[v]]_vars

\* After all bursts drain, every voter's cached clientResults matches the
\* server's authoritative serverResults. This ensures the chart/vote table
\* rendered in the UI agrees with the server's view of the round.
SettledClientResults ==
    AllDrained => \A v \in Voters : clientResults[v] = serverResults

\* After all bursts drain, every voter agrees with every other voter on who
\* has voted. This captures the "everyone sees the same round" property that
\* a planning-poker app needs (team must be looking at the same numbers).
SettledConsensus ==
    AllDrained =>
        \A v1, v2 \in Voters : clientResults[v1] = clientResults[v2]

\* At the settled state, a voter's voted flag is consistent with the results
\* they can see. No "I see v in the chart but my voted flag disagrees".
SettledVotedConsistent ==
    AllDrained =>
        \A v \in Voters : voted[v] = (v \in clientResults[v])

====
