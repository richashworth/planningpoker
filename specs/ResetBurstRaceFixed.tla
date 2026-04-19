---- MODULE ResetBurstRaceFixed ----
EXTENDS Integers, FiniteSets, Sequences

(***************************************************************************
Fix for the reset-burst race (see ResetBurstRace.tla for the violating
spec). Mirror the existing `burstResultsMessages` fix onto
`sendResetNotification`: re-check server state each iteration and skip
the emit if a new vote has arrived since the reset (serverResults is
non-empty).

Concretely in MessagingUtils.java:

  @Async
  public void sendResetNotification(String sessionId) {
    for (final long LATENCY_DURATION : LATENCIES) {
      // Skip stale iterations: if a new vote arrived after this reset
      // was scheduled, serverResults is non-empty. Emitting a RESET now
      // would clobber the fresh vote on the client. The subsequent
      // burstResultsMessages iterations will push the new state.
      if (!sessionManager.getResults(sessionId).isEmpty()) {
        return;
      }
      template.convertAndSend(getTopic(TOPIC_RESULTS, sessionId),
                              new Message(RESET_MESSAGE, Map.of()));
      clock.pause(LATENCY_DURATION);
    }
  }

The rest of the model is identical to ResetBurstRace.tla; only the
EmitReset action gains a guard that requires serverResults = {}.
***************************************************************************)

CONSTANTS
    Voters,
    MaxMessagesPerBurst,
    MaxNextItems,
    MaxCastVotes

VARIABLES
    serverResults,
    voted,
    clientResults,
    bursts,
    voteAfterReset,
    nextItemsDone,
    castVotesDone

vars == << serverResults, voted, clientResults, bursts,
           voteAfterReset, nextItemsDone, castVotesDone >>

BurstType == [type      : {"RESET", "RESULTS"},
              remaining : 0..MaxMessagesPerBurst]

TypeOK ==
    /\ serverResults \subseteq Voters
    /\ voted \in BOOLEAN
    /\ clientResults \subseteq Voters
    /\ bursts \in Seq(BurstType)
    /\ voteAfterReset \in BOOLEAN
    /\ nextItemsDone \in 0..MaxNextItems
    /\ castVotesDone \in 0..MaxCastVotes

Init ==
    /\ serverResults = {}
    /\ voted = FALSE
    /\ clientResults = {}
    /\ bursts = << >>
    /\ voteAfterReset = FALSE
    /\ nextItemsDone = 0
    /\ castVotesDone = 0

ResetDraining ==
    \E i \in 1..Len(bursts) :
        bursts[i].type = "RESET" /\ bursts[i].remaining > 0

CastVote(v) ==
    /\ castVotesDone < MaxCastVotes
    /\ v \notin serverResults
    /\ serverResults' = serverResults \cup {v}
    /\ voted' = TRUE
    /\ bursts' = Append(bursts,
                        [type      |-> "RESULTS",
                         remaining |-> MaxMessagesPerBurst])
    /\ voteAfterReset' = (voteAfterReset \/ ResetDraining)
    /\ castVotesDone' = castVotesDone + 1
    /\ UNCHANGED << clientResults, nextItemsDone >>

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

\* FIX: skip the RESET emit if serverResults is non-empty (a new vote has
\* arrived since the reset was scheduled). The burst still decrements its
\* remaining counter so fairness can drain it, matching an early `return`
\* from the Java loop on the stale-state branch.
EmitReset(i) ==
    /\ i \in 1..Len(bursts)
    /\ bursts[i].type = "RESET"
    /\ bursts[i].remaining > 0
    /\ IF serverResults = {}
       THEN /\ voted' = FALSE
            /\ clientResults' = {}
       ELSE /\ UNCHANGED voted
            /\ UNCHANGED clientResults
    /\ bursts' = [bursts EXCEPT ![i].remaining = @ - 1]
    /\ UNCHANGED << serverResults, voteAfterReset,
                    nextItemsDone, castVotesDone >>

EmitResults(i) ==
    /\ i \in 1..Len(bursts)
    /\ bursts[i].type = "RESULTS"
    /\ bursts[i].remaining > 0
    /\ clientResults' = serverResults
    /\ voted' = IF serverResults # {} THEN TRUE ELSE voted
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

ClientSubsetOfServer ==
    clientResults \subseteq serverResults \/ clientResults = {}

NoFlicker ==
    (voteAfterReset /\ serverResults # {}) => voted = TRUE

AllDrained == \A i \in 1..Len(bursts) : bursts[i].remaining = 0

EventualCorrectSettled ==
    <>[](AllDrained =>
            (voted = (serverResults # {}) /\ clientResults = serverResults))

====
