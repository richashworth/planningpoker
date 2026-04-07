---- MODULE ReconnectProtocol ----
EXTENDS Integers, FiniteSets

\* ---------------------------------------------------------------------------
\* Constants and type domains
\* ---------------------------------------------------------------------------

CONSTANTS
    Clients     \* e.g. {c1, c2}

MaxSeq        == 2               \* bound on mutations; enough for Vote+Reset sequence
WsStates      == {"null_state", "disconnected", "connected"}
ViewStates    == {"in_game", "on_welcome"}
SessionStates == {"active", "evicted"}
Versions      == 0..1
Seqs          == 0..MaxSeq

\* ---------------------------------------------------------------------------
\* Variables
\* ---------------------------------------------------------------------------

VARIABLES
    wsState,              \* Clients -> WsStates
    wasConnected,         \* Clients -> BOOLEAN
    clientViewState,      \* Clients -> ViewStates
    sessionState,         \* SessionStates
    members,              \* SUBSET Clients
    validations,          \* Clients -> SUBSET [seenEvicted: BOOLEAN, seenMember: BOOLEAN]
    serverResultsVersion, \* Versions
    clientResultsVersion, \* Clients -> Versions
    serverSeq,            \* Seqs  — monotonically increasing; bumped on every mutation
    clientSeq,            \* Clients -> Seqs  — last seq applied by each client
    burstQueue,           \* SUBSET [client: Clients, version: Versions, seq: Seqs]
    usersBurstPending     \* SUBSET Clients  — clients awaiting a users-list notification

vars == << wsState, wasConnected, clientViewState, sessionState, members,
           validations, serverResultsVersion, clientResultsVersion,
           serverSeq, clientSeq, burstQueue, usersBurstPending >>

\* ---------------------------------------------------------------------------
\* Type invariant
\* ---------------------------------------------------------------------------

TypeOK ==
    /\ wsState             \in [Clients -> WsStates]
    /\ wasConnected        \in [Clients -> BOOLEAN]
    /\ clientViewState     \in [Clients -> ViewStates]
    /\ sessionState        \in SessionStates
    /\ members             \in SUBSET Clients
    /\ validations         \in [Clients -> SUBSET [seenEvicted: BOOLEAN, seenMember: BOOLEAN]]
    /\ serverResultsVersion \in Versions
    /\ clientResultsVersion \in [Clients -> Versions]
    /\ serverSeq           \in Seqs
    /\ clientSeq           \in [Clients -> Seqs]
    /\ burstQueue          \in SUBSET [client: Clients, version: Versions, seq: Seqs]
    /\ usersBurstPending   \in SUBSET Clients

\* ---------------------------------------------------------------------------
\* Initial state
\* ---------------------------------------------------------------------------

Init ==
    /\ wsState             = [c \in Clients |-> "null_state"]
    /\ wasConnected        = [c \in Clients |-> FALSE]
    /\ clientViewState     = [c \in Clients |-> "in_game"]
    /\ sessionState        = "active"
    /\ members             = Clients
    /\ validations         = [c \in Clients |-> {}]
    /\ serverResultsVersion = 0
    /\ clientResultsVersion = [c \in Clients |-> 0]
    /\ serverSeq           = 0
    /\ clientSeq           = [c \in Clients |-> 0]
    /\ burstQueue          = {}
    /\ usersBurstPending   = {}

\* ---------------------------------------------------------------------------
\* Actions
\* ---------------------------------------------------------------------------

\* Client makes its first WebSocket connection.
InitialConnect(c) ==
    /\ wsState[c]         = "null_state"
    /\ clientViewState[c] = "in_game"
    /\ wsState'           = [wsState EXCEPT ![c] = "connected"]
    /\ UNCHANGED << wasConnected, clientViewState, sessionState, members,
                    validations, serverResultsVersion, clientResultsVersion,
                    serverSeq, clientSeq, burstQueue, usersBurstPending >>

\* After the initial connection is established, record that this client has
\* been connected at least once.  No validation is issued on first connect.
\* Monotonicity of wasConnected is enforced structurally: only this action
\* ever modifies wasConnected, and it only ever sets it to TRUE.
SetWasConnected(c) ==
    /\ wsState[c]      = "connected"
    /\ wasConnected[c] = FALSE
    /\ wasConnected'   = [wasConnected EXCEPT ![c] = TRUE]
    /\ UNCHANGED << wsState, clientViewState, sessionState, members,
                    validations, serverResultsVersion, clientResultsVersion,
                    serverSeq, clientSeq, burstQueue, usersBurstPending >>

\* Connection drops (network fault, server restart, etc.).
Disconnect(c) ==
    /\ wsState[c] = "connected"
    /\ wsState'   = [wsState EXCEPT ![c] = "disconnected"]
    /\ UNCHANGED << wasConnected, clientViewState, sessionState, members,
                    validations, serverResultsVersion, clientResultsVersion,
                    serverSeq, clientSeq, burstQueue, usersBurstPending >>

\* Client auto-reconnects after a drop.  A validation record is added,
\* capturing a snapshot of the server state at the moment the HTTP call
\* is issued.  The call will resolve later via ResolveValidationOk /
\* ResolveValidationError.
Reconnect(c) ==
    /\ wsState[c]         = "disconnected"
    /\ wasConnected[c]    = TRUE
    /\ clientViewState[c] = "in_game"  \* STOMP client deactivated once on_welcome
    /\ wsState'        = [wsState EXCEPT ![c] = "connected"]
    /\ LET snap == [seenEvicted |-> (sessionState = "evicted"),
                    seenMember  |-> (c \in members)]
       IN validations' = [validations EXCEPT ![c] = validations[c] \union {snap}]
    /\ UNCHANGED << wasConnected, clientViewState, sessionState, members,
                    serverResultsVersion, clientResultsVersion,
                    serverSeq, clientSeq, burstQueue, usersBurstPending >>

\* The GET /sessionUsers call returns 200.  This happens when the session was
\* not evicted at snapshot time — including the case where the client had
\* already been kicked (seenMember = FALSE), which is the protocol gap:
\* the server returns 200 because the session still exists, so the client
\* stays in_game even though it is no longer a member.
ResolveValidationOk(c, v) ==
    /\ v \in validations[c]
    /\ v.seenEvicted = FALSE
    /\ validations' = [validations EXCEPT ![c] = validations[c] \ {v}]
    /\ UNCHANGED << wsState, wasConnected, clientViewState, sessionState, members,
                    serverResultsVersion, clientResultsVersion,
                    serverSeq, clientSeq, burstQueue, usersBurstPending >>

\* The GET /sessionUsers call returns 4xx/5xx.  Client dispatches kicked()
\* and navigates to the welcome screen.
ResolveValidationError(c, v) ==
    /\ v \in validations[c]
    /\ v.seenEvicted = TRUE
    /\ validations'     = [validations EXCEPT ![c] = validations[c] \ {v}]
    /\ clientViewState' = [clientViewState EXCEPT ![c] = "on_welcome"]
    /\ UNCHANGED << wsState, wasConnected, sessionState, members,
                    serverResultsVersion, clientResultsVersion,
                    serverSeq, clientSeq, burstQueue, usersBurstPending >>

\* Server cron evicts the session and clears all members.
EvictSession ==
    /\ sessionState  = "active"
    /\ sessionState' = "evicted"
    /\ members'      = {}
    /\ UNCHANGED << wsState, wasConnected, clientViewState,
                    validations, serverResultsVersion, clientResultsVersion,
                    serverSeq, clientSeq, burstQueue, usersBurstPending >>

\* Any member can kick another member (host privilege is not modelled separately).
\*
\* FIX 1 — membership check on users-list delivery:
\*   KickUser now adds the target to usersBurstPending.  DeliverUsersBurst
\*   will later fire for the target and, upon finding them absent from members,
\*   set their clientViewState to on_welcome.  This closes the gap where a
\*   kicked-while-connected client stays in_game indefinitely.
\*
\* FIX 2 — sequence number:
\*   Every mutation bumps serverSeq, and each burst item carries that seq.
\*   BurstDeliver discards items whose seq is below the last seq the client
\*   has applied, preventing stale pre-reset results from overwriting fresh ones.
KickUser(c, target) ==
    /\ sessionState = "active"
    /\ c      \in members
    /\ target \in members
    /\ c /= target
    /\ serverSeq < MaxSeq        \* prevent seq overflow in the bounded model
    /\ members'           = members \ {target}
    /\ serverSeq'         = serverSeq + 1
    /\ burstQueue'        = burstQueue \union
                              {[client |-> cl, version |-> serverResultsVersion,
                                seq    |-> serverSeq + 1] : cl \in Clients}
    /\ usersBurstPending' = usersBurstPending \union {target}
    /\ UNCHANGED << wsState, wasConnected, clientViewState, sessionState,
                    validations, serverResultsVersion, clientSeq, clientResultsVersion >>

\* FIX 1 — users-list burst delivery.
\* When the kicked client is connected and the pending notification fires,
\* check membership: if the client is no longer a member, navigate to on_welcome.
\* This ensures a client kicked while staying connected is eventually redirected.
DeliverUsersBurst(c) ==
    /\ c \in usersBurstPending
    /\ wsState[c] = "connected"
    /\ usersBurstPending' = usersBurstPending \ {c}
    /\ clientViewState' = IF c \notin members
                          THEN [clientViewState EXCEPT ![c] = "on_welcome"]
                          ELSE clientViewState
    /\ UNCHANGED << wsState, wasConnected, sessionState, members,
                    validations, serverResultsVersion, clientResultsVersion,
                    serverSeq, clientSeq, burstQueue >>

\* A member casts a vote.  The server results version advances to 1 and burst
\* delivery records are enqueued for every client.
Vote(c) ==
    /\ sessionState = "active"
    /\ c \in members
    /\ wsState[c] = "connected"
    /\ serverSeq < MaxSeq
    /\ serverResultsVersion' = 1
    /\ serverSeq'            = serverSeq + 1
    /\ burstQueue'           =
         burstQueue \union {[client |-> cl, version |-> 1,
                              seq   |-> serverSeq + 1] : cl \in Clients}
    /\ UNCHANGED << wsState, wasConnected, clientViewState, sessionState,
                    members, validations, clientResultsVersion,
                    clientSeq, usersBurstPending >>

\* Host resets the session.  Server version drops back to 0.
\* FIX 2: The reset burst carries a higher seq than the preceding vote burst.
\* BurstDeliver will discard any version-1 items with a lower seq, so stale
\* pre-reset results can no longer overwrite the post-reset state.
ResetVotes(c) ==
    /\ sessionState = "active"
    /\ c \in members
    /\ wsState[c] = "connected"
    /\ serverSeq < MaxSeq
    /\ serverResultsVersion' = 0
    /\ serverSeq'            = serverSeq + 1
    /\ burstQueue'           =
         burstQueue \union {[client |-> cl, version |-> 0,
                              seq   |-> serverSeq + 1] : cl \in Clients}
    /\ UNCHANGED << wsState, wasConnected, clientViewState, sessionState,
                    members, validations, clientResultsVersion,
                    clientSeq, usersBurstPending >>

\* FIX 2 — seq-guarded burst delivery.
\* A burst item is applied only if its seq >= the client's last-applied seq.
\* Stale items (lower seq) are still removed from the queue but do not update
\* the client's view.  This prevents out-of-order burst delivery from causing
\* the NoStaleResultsAfterReset violation.
BurstDeliver(item) ==
    /\ item \in burstQueue
    /\ clientResultsVersion' = [clientResultsVersion EXCEPT
           ![item.client] = IF item.seq >= clientSeq[item.client]
                            THEN item.version
                            ELSE clientResultsVersion[item.client]]
    /\ clientSeq'  = [clientSeq EXCEPT
           ![item.client] = IF item.seq >= clientSeq[item.client]
                            THEN item.seq
                            ELSE clientSeq[item.client]]
    /\ burstQueue' = burstQueue \ {item}
    /\ UNCHANGED << wsState, wasConnected, clientViewState, sessionState,
                    members, validations, serverResultsVersion,
                    serverSeq, usersBurstPending >>

\* ---------------------------------------------------------------------------
\* Next-state relation
\* ---------------------------------------------------------------------------

Next ==
    \/ \E c \in Clients : InitialConnect(c)
    \/ \E c \in Clients : SetWasConnected(c)
    \/ \E c \in Clients : Disconnect(c)
    \/ \E c \in Clients : Reconnect(c)
    \/ \E c \in Clients : \E v \in validations[c] : ResolveValidationOk(c, v)
    \/ \E c \in Clients : \E v \in validations[c] : ResolveValidationError(c, v)
    \/ EvictSession
    \/ \E c \in Clients : \E target \in Clients : KickUser(c, target)
    \/ \E c \in Clients : DeliverUsersBurst(c)
    \/ \E c \in Clients : Vote(c)
    \/ \E c \in Clients : ResetVotes(c)
    \/ \E item \in burstQueue : BurstDeliver(item)

\* ---------------------------------------------------------------------------
\* Specification (with per-action fairness for liveness)
\* ---------------------------------------------------------------------------

\* Each fairness condition is named to avoid nested \A c scoping issues in SANY
Fair_InitialConnect    == \A c \in Clients : WF_vars(InitialConnect(c))
Fair_SetWasConnected   == \A c \in Clients : WF_vars(SetWasConnected(c))
Fair_Reconnect         == \A c \in Clients : WF_vars(Reconnect(c))
Fair_ValidationOk      == \A c \in Clients : WF_vars(\E v \in validations[c] : ResolveValidationOk(c, v))
Fair_ValidationError   == \A c \in Clients : WF_vars(\E v \in validations[c] : ResolveValidationError(c, v))
Fair_BurstDeliver      == \A item \in [client: Clients, version: Versions, seq: Seqs] :
                              WF_vars(BurstDeliver(item))
Fair_UsersBurst        == \A c \in Clients : WF_vars(DeliverUsersBurst(c))

Spec ==
    /\ Init
    /\ [][Next]_vars
    /\ Fair_InitialConnect
    /\ Fair_SetWasConnected
    /\ Fair_Reconnect
    /\ Fair_ValidationOk
    /\ Fair_ValidationError
    /\ Fair_BurstDeliver
    /\ Fair_UsersBurst

\* ---------------------------------------------------------------------------
\* Safety invariants
\* ---------------------------------------------------------------------------

\* A client should only be on_welcome if the session is evicted or they are
\* no longer a member.
NoFalseKick ==
    \A c \in Clients :
        clientViewState[c] = "on_welcome" =>
            (sessionState = "evicted" \/ c \notin members)

\* Validation records are only ever present when the client has previously
\* been connected (wasConnected = TRUE).
ValidationGuardHolds ==
    \A c \in Clients : validations[c] /= {} => wasConnected[c] = TRUE

\* FIX 2 verified: with seq-guarded delivery the stale state is transient —
\* any client showing version 1 when the server is at 0 must have a pending
\* reset burst (version=0, seq >= clientSeq[c]) that will correct it.
\* The disjunct captures the "in-flight correction" case.
NoStaleResultsAfterReset ==
    serverResultsVersion = 0 =>
        \A c \in Clients :
            \/ clientResultsVersion[c] = 0
            \/ \E item \in burstQueue :
                  /\ item.client  = c
                  /\ item.version = 0
                  /\ item.seq    >= clientSeq[c]

\* FIX 1 verified: the zombie state (connected + in_game + not a member) is
\* only safe if a users-list notification is already in flight (c \in
\* usersBurstPending), meaning DeliverUsersBurst will eventually redirect
\* the client.  Without a pending notification the state is a real gap.
\* This SHOULD NOW HOLD: KickUser always sets usersBurstPending, so any
\* zombie state is transient.
KickedWhileReconnectingGap ==
    \A c \in Clients :
        ~(sessionState = "active"
          /\ c \notin members
          /\ wsState[c] = "connected"
          /\ clientViewState[c] = "in_game"
          /\ c \notin usersBurstPending)  \* no pending notification = real gap

\* ---------------------------------------------------------------------------
\* Liveness properties
\* ---------------------------------------------------------------------------

\* Every disconnected client that has been connected before AND is still in the
\* game view will eventually either reconnect OR be kicked to the welcome screen.
EventualReconnect ==
    \A c \in Clients :
        (wsState[c] = "disconnected" /\ wasConnected[c] = TRUE /\ clientViewState[c] = "in_game")
            ~> (wsState[c] = "connected" \/ clientViewState[c] = "on_welcome")

====
