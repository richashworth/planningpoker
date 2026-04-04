---- MODULE PlanningPoker ----
(***************************************************************************)
(* This spec models the concurrent state management of a Planning Poker    *)
(* web application (Spring Boot + React). All session state lives in       *)
(* memory, protected by synchronized collection wrappers. The wrappers     *)
(* make individual reads and writes thread-safe, but compound operations   *)
(* like "check if user exists, then add user" are NOT atomic.              *)
(*                                                                         *)
(* The spec splits these non-atomic operations into separate Check and Act *)
(* steps, allowing TLC to explore every possible interleaving. This        *)
(* exposes three classes of TOCTOU (time-of-check-to-time-of-use) bugs:   *)
(*                                                                         *)
(*   1. Double-join: two threads both pass the "not a member" check and    *)
(*      both add the same username, creating a duplicate.                  *)
(*   2. Double-vote: two threads both pass the "hasn't voted" check and    *)
(*      both record a vote, giving one user two estimates.                 *)
(*   3. Ghost writes: a thread passes all checks, then the weekly cron     *)
(*      clears all sessions, then the thread completes its write --        *)
(*      leaving orphaned data in a dead session.                           *)
(*                                                                         *)
(* With just 1 session, 2 users, 2 estimates, and 2 threads, TLC explores *)
(* 35,530 distinct states and finds concrete violation traces for all      *)
(* three bug classes in under one second.                                  *)
(***************************************************************************)
EXTENDS Integers, Sequences, FiniteSets

CONSTANTS
    Users,          \* Set of usernames
    Estimates,      \* Set of legal estimate values
    Sessions,       \* Set of session IDs (typically singleton for small model)
    Threads         \* Set of HTTP request handler threads

VARIABLES
    activeSessions,     \* Set of currently active session IDs
    sessionUsers,       \* Function: session -> sequence of joined usernames (allows duplicates)
    sessionEstimates,   \* Function: session -> sequence of (user, estimate) pairs
    \* The vulnerability window: threadState records what a thread intends
    \* to do after passing its check. Between check and act, anything can
    \* happen -- another thread can join the same user, or the cron can
    \* wipe the session entirely. The thread proceeds blindly.
    threadState         \* Function: thread -> record describing pending operation

vars == << activeSessions, sessionUsers, sessionEstimates, threadState >>

\* Thread states
Idle == [type |-> "idle"]
PendingJoin(u, s) == [type |-> "join", user |-> u, session |-> s]
PendingVote(u, s, e) == [type |-> "vote", user |-> u, session |-> s, estimate |-> e]
PendingLogout(u, s) == [type |-> "logout", user |-> u, session |-> s]

\* --- Helper: check if user appears in a sequence of usernames ---
UserInSeq(seq, u) ==
    \E i \in 1..Len(seq) : seq[i] = u

\* --- Helper: filter a sequence, keeping only elements satisfying predicate ---
\* SelectSeq is built-in for Sequences, used for estimates.
\* For user sequences we filter by inequality.
FilterUsers(seq, u) ==
    SelectSeq(seq, LAMBDA x : x # u)

\* --- Helper: count estimates for a user in a session ---
UserEstimateCount(s, u) ==
    LET matchingPairs == {i \in 1..Len(sessionEstimates[s]) :
                            sessionEstimates[s][i][1] = u}
    IN Cardinality(matchingPairs)

\* --- Type Invariant ---
TypeOK ==
    /\ activeSessions \subseteq Sessions
    /\ \A s \in Sessions :
        /\ \A i \in 1..Len(sessionUsers[s]) : sessionUsers[s][i] \in Users
        /\ \A i \in 1..Len(sessionEstimates[s]) :
            /\ sessionEstimates[s][i][1] \in Users
            /\ sessionEstimates[s][i][2] \in Estimates
    /\ \A t \in Threads : threadState[t].type \in {"idle", "join", "vote", "logout"}

\* --- Initial State ---
Init ==
    /\ activeSessions = {}
    /\ sessionUsers = [s \in Sessions |-> << >>]
    /\ sessionEstimates = [s \in Sessions |-> << >>]
    /\ threadState = [t \in Threads |-> Idle]

\* --- Actions ---

\* Create a new session and join the creator to it (atomic)
CreateSession(s, u) ==
    /\ s \notin activeSessions
    /\ activeSessions' = activeSessions \union {s}
    /\ sessionUsers' = [sessionUsers EXCEPT ![s] = Append(sessionUsers[s], u)]
    /\ UNCHANGED << sessionEstimates, threadState >>

\* --- Join: split into check and act to model TOCTOU ---

\* Phase 1: Thread checks that session is active and user is not already a member
JoinCheck(t, u, s) ==
    /\ threadState[t] = Idle
    /\ s \in activeSessions
    /\ ~UserInSeq(sessionUsers[s], u)
    /\ threadState' = [threadState EXCEPT ![t] = PendingJoin(u, s)]
    /\ UNCHANGED << activeSessions, sessionUsers, sessionEstimates >>

\* Phase 2: Thread proceeds to add the user (without re-checking guards)
\* Appends to sequence — if another thread already added same user, this creates a duplicate
JoinAct(t) ==
    /\ threadState[t].type = "join"
    /\ LET u == threadState[t].user
           s == threadState[t].session
       IN
        /\ sessionUsers' = [sessionUsers EXCEPT ![s] = Append(sessionUsers[s], u)]
        /\ threadState' = [threadState EXCEPT ![t] = Idle]
    /\ UNCHANGED << activeSessions, sessionEstimates >>

\* --- Vote: split into check and act to model TOCTOU ---

\* Phase 1: Thread checks membership and that user hasn't voted
VoteCheck(t, u, s, e) ==
    /\ threadState[t] = Idle
    /\ s \in activeSessions
    /\ UserInSeq(sessionUsers[s], u)
    /\ UserEstimateCount(s, u) = 0
    /\ threadState' = [threadState EXCEPT ![t] = PendingVote(u, s, e)]
    /\ UNCHANGED << activeSessions, sessionUsers, sessionEstimates >>

\* Phase 2: Thread writes the estimate (without re-checking)
\* Uses Append to model ListMultimap which allows duplicate entries
VoteAct(t) ==
    /\ threadState[t].type = "vote"
    /\ LET u == threadState[t].user
           s == threadState[t].session
           e == threadState[t].estimate
       IN
        /\ sessionEstimates' = [sessionEstimates EXCEPT
            ![s] = Append(sessionEstimates[s], <<u, e>>)]
        /\ threadState' = [threadState EXCEPT ![t] = Idle]
    /\ UNCHANGED << activeSessions, sessionUsers >>

\* Reset: atomic (synchronized block in implementation)
\* Does NOT cancel in-flight thread operations — they will complete after reset
Reset(u, s) ==
    /\ s \in activeSessions
    /\ UserInSeq(sessionUsers[s], u)
    /\ sessionEstimates' = [sessionEstimates EXCEPT ![s] = << >>]
    /\ UNCHANGED << activeSessions, sessionUsers, threadState >>

\* --- Logout: split into check and act to model TOCTOU ---

\* Phase 1: Thread checks membership and records intent
LogoutCheck(t, u, s) ==
    /\ threadState[t] = Idle
    /\ s \in activeSessions
    /\ UserInSeq(sessionUsers[s], u)
    /\ threadState' = [threadState EXCEPT ![t] = PendingLogout(u, s)]
    /\ UNCHANGED << activeSessions, sessionUsers, sessionEstimates >>

\* Phase 2: Thread removes user and their estimates (without re-checking)
LogoutAct(t) ==
    /\ threadState[t].type = "logout"
    /\ LET u == threadState[t].user
           s == threadState[t].session
       IN
        /\ sessionUsers' = [sessionUsers EXCEPT ![s] = FilterUsers(sessionUsers[s], u)]
        /\ sessionEstimates' = [sessionEstimates EXCEPT ![s] =
            SelectSeq(sessionEstimates[s], LAMBDA pair : pair[1] # u)]
        /\ threadState' = [threadState EXCEPT ![t] = Idle]
    /\ UNCHANGED << activeSessions >>

\* ClearSessionsTask: wipes all sessions unconditionally
\* In-flight thread operations are NOT cancelled — they continue on their thread
\* and will write ghost data to the cleared session.
ClearSessions ==
    /\ activeSessions' = {}
    /\ sessionUsers' = [s \in Sessions |-> << >>]
    /\ sessionEstimates' = [s \in Sessions |-> << >>]
    /\ UNCHANGED threadState

\* --- Next-State Relation ---
Next ==
    \/ \E s \in Sessions, u \in Users : CreateSession(s, u)
    \/ \E t \in Threads, u \in Users, s \in Sessions : JoinCheck(t, u, s)
    \/ \E t \in Threads : JoinAct(t)
    \/ \E t \in Threads, u \in Users, s \in Sessions, e \in Estimates : VoteCheck(t, u, s, e)
    \/ \E t \in Threads : VoteAct(t)
    \/ \E u \in Users, s \in Sessions : Reset(u, s)
    \/ \E t \in Threads, u \in Users, s \in Sessions : LogoutCheck(t, u, s)
    \/ \E t \in Threads : LogoutAct(t)
    \/ ClearSessions

\* --- Specification ---
\* Safety-only spec: WF_vars(Next) suffices since no liveness properties
Spec == Init /\ [][Next]_vars /\ WF_vars(Next)

\* --- Safety Invariants ---

\* EXPECTED VIOLATION: A user must not have two estimates in the same session round.
\* The TOCTOU race on vote allows two threads to both pass the "no estimate" check
\* and both write, giving the user two estimates.
NoDoubleVote ==
    \A s \in Sessions :
        \A u \in Users :
            UserEstimateCount(s, u) <= 1

\* EXPECTED VIOLATION: No session should have duplicate usernames in its user list.
\* The TOCTOU race on join allows two threads to both pass the "not a member" check
\* and both append, creating duplicate entries.
NoDuplicateUsername ==
    \A s \in Sessions :
        \A i \in 1..Len(sessionUsers[s]) :
            \A j \in 1..Len(sessionUsers[s]) :
                (i # j) => (sessionUsers[s][i] # sessionUsers[s][j])

\* EXPECTED VIOLATION: A non-member should not have an estimate in a session.
\* After ClearSessions or Logout, in-flight VoteAct writes ghost estimate to session
\* where the user is no longer a member.
AllEstimatesHaveMembers ==
    \A s \in Sessions :
        \A i \in 1..Len(sessionEstimates[s]) :
            UserInSeq(sessionUsers[s], sessionEstimates[s][i][1])

\* EXPECTED VIOLATION: After clear, no inactive session should have data.
\* Ghost writes from in-flight JoinAct or VoteAct can add data after clear.
ClearedSessionsAreEmpty ==
    \A s \in Sessions :
        s \notin activeSessions =>
            /\ sessionUsers[s] = << >>
            /\ sessionEstimates[s] = << >>

====
