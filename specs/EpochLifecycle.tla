---- MODULE EpochLifecycle ----
EXTENDS Integers, FiniteSets, Sequences

(***************************************************************************
Extends EpochNoBurst.tla with session lifecycle actions:

  - JoinSession(v):    a voter not currently registered joins the session.
                       REST response carries (serverRound, serverResults) —
                       modelled as a single atomic snapshot (same shape as
                       Reconnect).
  - LeaveSession(v):   a registered voter leaves. If they had voted, the
                       server removes them from serverResults AND emits a
                       single USER_LEFT message at the CURRENT serverRound
                       so other clients subtract the leaver from their
                       local cache. No round bump — the remaining voters
                       stay on the same round.
  - AdvanceRound:      covers BOTH /nextItem and /reset — they have
                       identical server-side semantics (serverRound++,
                       serverResults := {}, emit RESET). Modelling them
                       separately would just duplicate states.
  - Host disconnect is already covered by Disconnect(v) with v = Host.

NEW MESSAGE TYPE: USER_LEFT
  payload field unused; leaver field carries the departing voter.
  Applied at the receiving client iff msg.round = clientRound[v]
  (same-round only — if the client has moved on, the subtraction is
  irrelevant because their local cache has already been replaced by a
  later RESET/RESULTS).

  Critically, USER_LEFT is NOT treated as an additive RESULTS message
  with a smaller payload. Same-round RESULTS uses UNION (to handle
  out-of-order optimistic vote messages), so a same-round "smaller
  payload" cannot subtract. We need a distinct message type whose
  reducer does set subtraction.

FIFO guarantees USER_LEFT arrives AFTER any earlier same-round RESULTS
that might have included the leaver's vote — so the subtraction is
applied to an already-unioned-in entry, cleanly removing it.

Safety invariants are scoped to REGISTERED voters (we don't care about
the state of voters who have left or not yet joined).
***************************************************************************)

CONSTANTS
    Voters,
    Host,
    InitialMembers,       \* subset of Voters registered at Init; must contain Host
    MaxRoundEvents,       \* combined bound on AdvanceRound firings
    MaxCastVotes,
    MaxDisconnects,
    MaxLeaves,
    MaxJoins

ASSUME Host \in Voters
ASSUME Host \in InitialMembers
ASSUME InitialMembers \subseteq Voters

VARIABLES
    serverResults,
    serverRound,
    registered,           \* [Voters -> BOOLEAN] — currently in the session
    voted,
    clientResults,
    clientRound,
    connected,
    messages,
    voteAfterReset,
    roundEventsDone,
    castVotesDone,
    disconnectsDone,
    leavesDone,
    joinsDone

vars == << serverResults, serverRound, registered, voted, clientResults,
           clientRound, connected, messages, voteAfterReset,
           roundEventsDone, castVotesDone, disconnectsDone,
           leavesDone, joinsDone >>

MaxRound == MaxRoundEvents

\* "NONE" sentinel for the leaver field when unused (RESET/RESULTS).
LeaverOrNone == Voters \cup {"NONE"}

MessageType == [type    : {"RESET", "RESULTS", "USER_LEFT"},
                round   : 0..MaxRound,
                payload : SUBSET Voters,
                leaver  : LeaverOrNone,
                pending : SUBSET Voters]

TypeOK ==
    /\ serverResults \subseteq Voters
    /\ serverRound \in 0..MaxRound
    /\ registered \in [Voters -> BOOLEAN]
    /\ voted \in [Voters -> BOOLEAN]
    /\ clientResults \in [Voters -> SUBSET Voters]
    /\ clientRound \in [Voters -> 0..MaxRound]
    /\ connected \in [Voters -> BOOLEAN]
    /\ messages \in Seq(MessageType)
    /\ voteAfterReset \in [Voters -> BOOLEAN]
    /\ roundEventsDone \in 0..MaxRoundEvents
    /\ castVotesDone \in 0..MaxCastVotes
    /\ disconnectsDone \in 0..MaxDisconnects
    /\ leavesDone \in 0..MaxLeaves
    /\ joinsDone \in 0..MaxJoins

Init ==
    /\ serverResults = {}
    /\ serverRound = 0
    /\ registered = [v \in Voters |-> v \in InitialMembers]
    /\ voted = [v \in Voters |-> FALSE]
    /\ clientResults = [v \in Voters |-> {}]
    /\ clientRound = [v \in Voters |-> 0]
    /\ connected = [v \in Voters |-> v \in InitialMembers]
    /\ messages = << >>
    /\ voteAfterReset = [v \in Voters |-> FALSE]
    /\ roundEventsDone = 0
    /\ castVotesDone = 0
    /\ disconnectsDone = 0
    /\ leavesDone = 0
    /\ joinsDone = 0

ResetInFlight ==
    \E i \in 1..Len(messages) :
        messages[i].type = "RESET" /\ messages[i].pending # {}

ConnectedRegisteredVoters == {v \in Voters : registered[v] /\ connected[v]}

\* --- Actions ---

CastVote(v) ==
    /\ castVotesDone < MaxCastVotes
    /\ registered[v]
    /\ connected[v]
    /\ v \notin serverResults
    /\ serverResults' = serverResults \cup {v}
    /\ voted' = [voted EXCEPT ![v] = TRUE]
    /\ clientResults' = [clientResults EXCEPT ![v] =
                            IF clientRound[v] < serverRound
                            THEN {v}
                            ELSE clientResults[v] \cup {v}]
    /\ clientRound' = [clientRound EXCEPT ![v] = serverRound]
    /\ messages' = Append(messages,
                          [type    |-> "RESULTS",
                           round   |-> serverRound,
                           payload |-> serverResults \cup {v},
                           leaver  |-> "NONE",
                           pending |-> ConnectedRegisteredVoters])
    /\ voteAfterReset' = [voteAfterReset EXCEPT ![v] = (voteAfterReset[v] \/ ResetInFlight)]
    /\ castVotesDone' = castVotesDone + 1
    /\ UNCHANGED << serverRound, registered, connected, roundEventsDone,
                    disconnectsDone, leavesDone, joinsDone >>

\* Combined action for /nextItem and /reset — both bump round + clear results.
\* The distinction (same item vs. new item) is UI state, not server state.
\* Modelling them separately would add no coverage because the transition
\* is identical.
AdvanceRound ==
    /\ roundEventsDone < MaxRoundEvents
    /\ registered[Host]
    /\ connected[Host]
    /\ serverRound' = serverRound + 1
    /\ serverResults' = {}
    /\ voted' = [voted EXCEPT ![Host] = FALSE]
    /\ clientResults' = [clientResults EXCEPT ![Host] = {}]
    /\ clientRound' = [clientRound EXCEPT ![Host] = serverRound + 1]
    /\ messages' = Append(messages,
                          [type    |-> "RESET",
                           round   |-> serverRound + 1,
                           payload |-> {},
                           leaver  |-> "NONE",
                           pending |-> ConnectedRegisteredVoters])
    /\ roundEventsDone' = roundEventsDone + 1
    /\ UNCHANGED << registered, connected, voteAfterReset,
                    castVotesDone, disconnectsDone, leavesDone, joinsDone >>

\* Deliver message i to voter v. Must be registered to receive.
\* FIFO: v only receives msg i after all earlier j<i have left pending.
DeliverMessage(i, v) ==
    /\ i \in 1..Len(messages)
    /\ registered[v]
    /\ v \in messages[i].pending
    /\ \A j \in 1..(i - 1) : v \notin messages[j].pending
    /\ LET m == messages[i] IN
         IF m.type = "RESET" THEN
           /\ IF m.round > clientRound[v]
              THEN /\ voted' = [voted EXCEPT ![v] = FALSE]
                   /\ clientResults' = [clientResults EXCEPT ![v] = {}]
                   /\ clientRound' = [clientRound EXCEPT ![v] = m.round]
              ELSE /\ UNCHANGED << voted, clientResults, clientRound >>
         ELSE IF m.type = "RESULTS" THEN
           /\ IF m.round > clientRound[v]
              THEN /\ clientResults' = [clientResults EXCEPT ![v] = m.payload]
                   /\ voted' = [voted EXCEPT ![v] = (v \in m.payload)]
                   /\ clientRound' = [clientRound EXCEPT ![v] = m.round]
              ELSE IF m.round = clientRound[v]
                   THEN /\ clientResults' = [clientResults EXCEPT ![v] = clientResults[v] \cup m.payload]
                        /\ voted' = [voted EXCEPT ![v] = (v \in (clientResults[v] \cup m.payload))]
                        /\ UNCHANGED clientRound
                   ELSE /\ UNCHANGED << voted, clientResults, clientRound >>
         ELSE \* USER_LEFT
           \* Apply subtraction only at same round. If client has advanced
           \* (m.round < clientRound), their state is already a new round
           \* where the leaver didn't vote (or did, but we'd need a new
           \* USER_LEFT at that round). If client is behind (m.round >
           \* clientRound), shouldn't happen under FIFO because the leave
           \* must have happened at the round the client is still on or
           \* before — we conservatively drop.
           /\ IF m.round = clientRound[v]
              THEN /\ clientResults' = [clientResults EXCEPT ![v] = clientResults[v] \ {m.leaver}]
                   /\ voted' = [voted EXCEPT ![v] = (v \in (clientResults[v] \ {m.leaver}))]
                   /\ UNCHANGED clientRound
              ELSE /\ UNCHANGED << voted, clientResults, clientRound >>
    /\ messages' = [messages EXCEPT ![i].pending = @ \ {v}]
    /\ UNCHANGED << serverResults, serverRound, registered, connected,
                    voteAfterReset, roundEventsDone, castVotesDone,
                    disconnectsDone, leavesDone, joinsDone >>

Disconnect(v) ==
    /\ disconnectsDone < MaxDisconnects
    /\ registered[v]
    /\ connected[v]
    /\ connected' = [connected EXCEPT ![v] = FALSE]
    /\ messages' = [i \in 1..Len(messages) |->
                        [messages[i] EXCEPT !.pending = @ \ {v}]]
    /\ disconnectsDone' = disconnectsDone + 1
    /\ UNCHANGED << serverResults, serverRound, registered, voted,
                    clientResults, clientRound, voteAfterReset,
                    roundEventsDone, castVotesDone, leavesDone, joinsDone >>

Reconnect(v) ==
    /\ registered[v]
    /\ ~connected[v]
    /\ connected' = [connected EXCEPT ![v] = TRUE]
    /\ clientRound' = [clientRound EXCEPT ![v] = serverRound]
    /\ clientResults' = [clientResults EXCEPT ![v] = serverResults]
    /\ voted' = [voted EXCEPT ![v] = (v \in serverResults)]
    /\ UNCHANGED << serverResults, serverRound, registered, messages,
                    voteAfterReset, roundEventsDone, castVotesDone,
                    disconnectsDone, leavesDone, joinsDone >>

\* New voter joins the session. REST /joinSession response is an atomic
\* snapshot (serverRound, serverResults) — same shape as Reconnect.
\* voteAfterReset resets to FALSE (clean slate for flicker accounting).
\* Host cannot "join" (they're registered from Init).
JoinSession(v) ==
    /\ joinsDone < MaxJoins
    /\ ~registered[v]
    /\ v # Host
    /\ registered' = [registered EXCEPT ![v] = TRUE]
    /\ connected' = [connected EXCEPT ![v] = TRUE]
    /\ clientRound' = [clientRound EXCEPT ![v] = serverRound]
    /\ clientResults' = [clientResults EXCEPT ![v] = serverResults]
    /\ voted' = [voted EXCEPT ![v] = (v \in serverResults)]
    /\ voteAfterReset' = [voteAfterReset EXCEPT ![v] = FALSE]
    /\ joinsDone' = joinsDone + 1
    /\ UNCHANGED << serverResults, serverRound, messages,
                    roundEventsDone, castVotesDone, disconnectsDone, leavesDone >>

\* Voter v leaves. Disallow Host (closing the session is a different concern).
\* If v had voted, remove from serverResults AND emit USER_LEFT at the
\* current round so others subtract v from their local cache.
\* Existing pending messages drop v (they no longer care about v's view).
LeaveSession(v) ==
    /\ leavesDone < MaxLeaves
    /\ registered[v]
    /\ v # Host
    /\ registered' = [registered EXCEPT ![v] = FALSE]
    /\ connected' = [connected EXCEPT ![v] = FALSE]
    /\ serverResults' = serverResults \ {v}
    /\ messages' =
         LET drained == [i \in 1..Len(messages) |->
                           [messages[i] EXCEPT !.pending = @ \ {v}]]
         IN IF v \in serverResults
            THEN Append(drained,
                        [type    |-> "USER_LEFT",
                         round   |-> serverRound,
                         payload |-> {},
                         leaver  |-> v,
                         pending |-> ConnectedRegisteredVoters \ {v}])
            ELSE drained
    /\ leavesDone' = leavesDone + 1
    /\ UNCHANGED << serverRound, voted, clientResults, clientRound,
                    voteAfterReset, roundEventsDone, castVotesDone,
                    disconnectsDone, joinsDone >>

Next ==
    \/ \E v \in Voters : CastVote(v)
    \/ AdvanceRound
    \/ \E i \in 1..Len(messages), v \in Voters : DeliverMessage(i, v)
    \/ \E v \in Voters : Disconnect(v)
    \/ \E v \in Voters : Reconnect(v)
    \/ \E v \in Voters : JoinSession(v)
    \/ \E v \in Voters : LeaveSession(v)

\* Fairness: every emit eventually delivers to live subscribers; offline
\* clients eventually reconnect; non-members eventually join.
Spec == Init /\ [][Next]_vars
         /\ \A v1 \in Voters : WF_vars(CastVote(v1))
         /\ WF_vars(AdvanceRound)
         /\ \A v2 \in Voters : WF_vars(Reconnect(v2))
         /\ \A v3 \in Voters : WF_vars(JoinSession(v3))
         /\ \A i \in 1..(MaxRoundEvents + MaxCastVotes + MaxLeaves), v4 \in Voters :
                WF_vars(DeliverMessage(i, v4))

AllDelivered == \A i \in 1..Len(messages) : messages[i].pending = {}
AllRegisteredConnected == \A v \in Voters : registered[v] => connected[v]
Settled == AllDelivered /\ AllRegisteredConnected

\* --- Safety invariants (scoped to registered voters) ---

NoFlicker ==
    \A v \in Voters :
        (registered[v] /\ voteAfterReset[v] /\ v \in serverResults /\ connected[v])
            => voted[v] = TRUE

SettledCorrectness ==
    Settled => \A v \in Voters : registered[v] => (voted[v] = (v \in serverResults))

SettledClientResults ==
    Settled => \A v \in Voters : registered[v] => clientResults[v] = serverResults

SettledConsensus ==
    Settled => \A v1, v2 \in Voters :
        (registered[v1] /\ registered[v2]) => clientResults[v1] = clientResults[v2]

SettledVotedConsistent ==
    Settled => \A v \in Voters : registered[v] => (voted[v] = (v \in clientResults[v]))

MonotonicClientRound ==
    [][\A v \in Voters : clientRound'[v] >= clientRound[v]]_vars

====
