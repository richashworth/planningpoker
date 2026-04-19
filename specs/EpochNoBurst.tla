---- MODULE EpochNoBurst ----
EXTENDS Integers, FiniteSets, Sequences

(***************************************************************************
Models the epoch-number fix WITHOUT the burst pattern.

In this design, each server-side event (CastVote, ClickNextItem) produces
a SINGLE WebSocket message per topic — no repeated bursts. Reliability
on reconnect is handled by the existing `GET /refresh` endpoint, which
returns current server state in a single atomic snapshot.

Purpose of the spec: confirm that after dropping the burst pattern, the
safety properties that matter for a planning-poker session still hold.
In particular:

  - NoFlicker still holds (no stale RESET can flicker a user).
  - SettledCorrectness, SettledClientResults, SettledConsensus,
    SettledVotedConsistent still hold once every client is online and
    their queues have drained.

Key modelling choices:
  - Messages are pending-delivery records with a receiver set. At emit
    time the receiver set is the currently-connected voters. Delivery
    is per-client, modelling that a client can receive one message
    before another.
  - Disconnect(v): sets connected[v] := FALSE and removes v from every
    pending message's receiver set (messages sent while v is offline
    are lost).
  - Reconnect(v): sets connected[v] := TRUE AND applies a synchronous
    /refresh snapshot: clientRound[v] := serverRound,
    clientResults[v] := serverResults, voted[v] := (v in serverResults).

The client-side epoch rules are unchanged from ResetBurstRaceEpoch.tla:
  RESET   applied iff msg.round >  clientRound[v]  (strict)
  RESULTS applied iff msg.round >= clientRound[v]
RESULTS reducer sets voted[v] := (v in payload).
***************************************************************************)

CONSTANTS
    Voters,
    Host,
    MaxNextItems,
    MaxCastVotes,
    MaxDisconnects           \* bound on disconnect events (keeps state space finite)

VARIABLES
    serverResults,
    serverRound,
    voted,
    clientResults,
    clientRound,
    connected,               \* [Voters -> BOOLEAN]
    messages,                \* Seq of [type, round, payload, pending]
    voteAfterReset,
    nextItemsDone,
    castVotesDone,
    disconnectsDone

vars == << serverResults, serverRound, voted, clientResults, clientRound,
           connected, messages, voteAfterReset,
           nextItemsDone, castVotesDone, disconnectsDone >>

MaxRound == MaxNextItems

MessageType == [type    : {"RESET", "RESULTS"},
                round   : 0..MaxRound,
                payload : SUBSET Voters,
                pending : SUBSET Voters]

TypeOK ==
    /\ serverResults \subseteq Voters
    /\ serverRound \in 0..MaxRound
    /\ voted \in [Voters -> BOOLEAN]
    /\ clientResults \in [Voters -> SUBSET Voters]
    /\ clientRound \in [Voters -> 0..MaxRound]
    /\ connected \in [Voters -> BOOLEAN]
    /\ messages \in Seq(MessageType)
    /\ voteAfterReset \in [Voters -> BOOLEAN]
    /\ nextItemsDone \in 0..MaxNextItems
    /\ castVotesDone \in 0..MaxCastVotes
    /\ disconnectsDone \in 0..MaxDisconnects

Init ==
    /\ serverResults = {}
    /\ serverRound = 0
    /\ voted = [v \in Voters |-> FALSE]
    /\ clientResults = [v \in Voters |-> {}]
    /\ clientRound = [v \in Voters |-> 0]
    /\ connected = [v \in Voters |-> TRUE]
    /\ messages = << >>
    /\ voteAfterReset = [v \in Voters |-> FALSE]
    /\ nextItemsDone = 0
    /\ castVotesDone = 0
    /\ disconnectsDone = 0

\* A RESET "is in flight" if any message tagged RESET still has non-empty
\* pending (not yet received by all live subscribers).
ResetInFlight ==
    \E i \in 1..Len(messages) :
        messages[i].type = "RESET" /\ messages[i].pending # {}

ConnectedVoters == {v \in Voters : connected[v]}

\* --- Actions ---

\* Voter v casts a vote. Optimistic local update syncs clientRound[v] to
\* current serverRound (modelling the /vote REST response carrying round).
\* A SINGLE RESULTS message is queued, addressed to currently-connected
\* clients.
CastVote(v) ==
    /\ castVotesDone < MaxCastVotes
    /\ connected[v]                    \* can only vote if online
    /\ v \notin serverResults
    /\ serverResults' = serverResults \cup {v}
    /\ voted' = [voted EXCEPT ![v] = TRUE]
    \* Optimistic update: if this vote bumps the client into a new round
    \* (their clientRound lags serverRound), clear stale clientResults and
    \* start fresh with just self. Otherwise (same round) add self to the
    \* existing results. Matches the semantics the /vote REST response
    \* needs to carry: a new round number + a directive to reset local
    \* results before applying the optimistic add.
    /\ clientResults' = [clientResults EXCEPT ![v] =
                            IF clientRound[v] < serverRound
                            THEN {v}
                            ELSE clientResults[v] \cup {v}]
    /\ clientRound' = [clientRound EXCEPT ![v] = serverRound]
    /\ messages' = Append(messages,
                          [type    |-> "RESULTS",
                           round   |-> serverRound,
                           payload |-> serverResults \cup {v},
                           pending |-> ConnectedVoters])
    /\ voteAfterReset' = [voteAfterReset EXCEPT ![v] = (voteAfterReset[v] \/ ResetInFlight)]
    /\ castVotesDone' = castVotesDone + 1
    /\ UNCHANGED << serverRound, connected, nextItemsDone, disconnectsDone >>

\* Host clicks Next Item. serverRound bumps. A SINGLE RESET message is
\* queued — the client-side RESET_SESSION reducer already clears the
\* chart and label, so a separate empty-RESULTS is unnecessary (and
\* removing it avoids a race where the empty RESULTS arrives after a
\* fresh vote at the same round and wipes it). Host's local state snaps
\* to the new round.
ClickNextItem ==
    /\ nextItemsDone < MaxNextItems
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
                           pending |-> ConnectedVoters])
    /\ nextItemsDone' = nextItemsDone + 1
    /\ UNCHANGED << connected, voteAfterReset, castVotesDone, disconnectsDone >>

\* Deliver message i to voter v. Apply client-side epoch rules.
\* FIFO constraint: v can only receive message i if all earlier messages
\* (indices < i) have already left v's pending set (either delivered or
\* lost via disconnect). This models STOMP/TCP in-order delivery on a
\* single WebSocket connection.
DeliverMessage(i, v) ==
    /\ i \in 1..Len(messages)
    /\ v \in messages[i].pending
    /\ \A j \in 1..(i - 1) : v \notin messages[j].pending
    /\ LET m == messages[i] IN
         IF m.type = "RESET" THEN
           /\ IF m.round > clientRound[v]
              THEN /\ voted' = [voted EXCEPT ![v] = FALSE]
                   /\ clientResults' = [clientResults EXCEPT ![v] = {}]
                   /\ clientRound' = [clientRound EXCEPT ![v] = m.round]
              ELSE /\ UNCHANGED << voted, clientResults, clientRound >>
         ELSE \* RESULTS
           \* Higher round: replace clientResults and bump clientRound.
           \* Same round: UNION payload into clientResults (within-round
           \*   votes are monotonic server-side; FIFO guarantees later
           \*   same-round payloads are supersets of earlier ones, but the
           \*   client's own optimistic vote may have added itself to a
           \*   message that the server-snapshot payload hasn't captured
           \*   yet — union preserves both without dropping either).
           \* Combined with the CastVote rule that clears clientResults
           \* when the vote bumps the client into a new round, the "same
           \* round = union" semantic does NOT carry stale cross-round
           \* state because the round bump on vote already cleared it.
           \* Lower round: drop.
           /\ IF m.round > clientRound[v]
              THEN /\ clientResults' = [clientResults EXCEPT ![v] = m.payload]
                   /\ voted' = [voted EXCEPT ![v] = (v \in m.payload)]
                   /\ clientRound' = [clientRound EXCEPT ![v] = m.round]
              ELSE IF m.round = clientRound[v]
                   THEN /\ clientResults' = [clientResults EXCEPT ![v] = clientResults[v] \cup m.payload]
                        /\ voted' = [voted EXCEPT ![v] = (v \in (clientResults[v] \cup m.payload))]
                        /\ UNCHANGED clientRound
                   ELSE /\ UNCHANGED << voted, clientResults, clientRound >>
    /\ messages' = [messages EXCEPT ![i].pending = @ \ {v}]
    /\ UNCHANGED << serverResults, serverRound, connected,
                    voteAfterReset, nextItemsDone, castVotesDone, disconnectsDone >>

\* Voter v's WebSocket drops. Any messages queued for them are lost.
Disconnect(v) ==
    /\ disconnectsDone < MaxDisconnects
    /\ connected[v]
    /\ connected' = [connected EXCEPT ![v] = FALSE]
    /\ messages' = [i \in 1..Len(messages) |->
                        [messages[i] EXCEPT !.pending = @ \ {v}]]
    /\ disconnectsDone' = disconnectsDone + 1
    /\ UNCHANGED << serverResults, serverRound, voted, clientResults, clientRound,
                    voteAfterReset, nextItemsDone, castVotesDone >>

\* v's WebSocket comes back. Client calls /refresh, which returns a
\* single atomic snapshot (serverResults, serverRound). Applied directly
\* — no message queue, no epoch filter needed (it's a REST response, the
\* client trusts it).
Reconnect(v) ==
    /\ ~connected[v]
    /\ connected' = [connected EXCEPT ![v] = TRUE]
    /\ clientRound' = [clientRound EXCEPT ![v] = serverRound]
    /\ clientResults' = [clientResults EXCEPT ![v] = serverResults]
    /\ voted' = [voted EXCEPT ![v] = (v \in serverResults)]
    /\ UNCHANGED << serverResults, serverRound, messages, voteAfterReset,
                    nextItemsDone, castVotesDone, disconnectsDone >>

Next ==
    \/ \E v \in Voters : CastVote(v)
    \/ ClickNextItem
    \/ \E i \in 1..Len(messages), v \in Voters : DeliverMessage(i, v)
    \/ \E v \in Voters : Disconnect(v)
    \/ \E v \in Voters : Reconnect(v)

\* Fairness: every emit eventually delivers to each of its pending
\* recipients, unless they disconnect. Disconnected clients eventually
\* reconnect.
Spec == Init /\ [][Next]_vars
         /\ \A v1 \in Voters : WF_vars(CastVote(v1))
         /\ WF_vars(ClickNextItem)
         /\ \A v2 \in Voters : WF_vars(Reconnect(v2))
         /\ \A i \in 1..(MaxNextItems * 2 + MaxCastVotes), v3 \in Voters :
                WF_vars(DeliverMessage(i, v3))

AllDelivered == \A i \in 1..Len(messages) : messages[i].pending = {}
AllConnected == \A v \in Voters : connected[v]
Settled == AllDelivered /\ AllConnected

\* --- Safety invariants ---

NoFlicker ==
    \A v \in Voters :
        (voteAfterReset[v] /\ v \in serverResults /\ connected[v])
            => voted[v] = TRUE

SettledCorrectness ==
    Settled => \A v \in Voters : voted[v] = (v \in serverResults)

SettledClientResults ==
    Settled => \A v \in Voters : clientResults[v] = serverResults

SettledConsensus ==
    Settled => \A v1, v2 \in Voters : clientResults[v1] = clientResults[v2]

SettledVotedConsistent ==
    Settled => \A v \in Voters : voted[v] = (v \in clientResults[v])

MonotonicClientRound ==
    [][\A v \in Voters : clientRound'[v] >= clientRound[v]]_vars

====
