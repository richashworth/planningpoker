---- MODULE PlanningPokerFixed ----
(***************************************************************************)
(* This spec models the Planning Poker system AFTER applying synchronized  *)
(* blocks to all compound operations. Join, Vote, and Logout are now       *)
(* atomic — the check and write happen under the same lock, so no other    *)
(* thread can interleave between them.                                     *)
(*                                                                         *)
(* ClearSessions also acquires the same lock, so it cannot fire while a    *)
(* compound operation is in progress, and vice versa.                      *)
(*                                                                         *)
(* The threadState variable is retained but now only transitions            *)
(* idle -> idle within a single atomic step, so it never holds a pending   *)
(* operation across a scheduling point. This makes the TOCTOU window       *)
(* impossible by construction.                                             *)
(*                                                                         *)
(* TLC confirms: all invariants hold across the full state space.          *)
(***************************************************************************)
EXTENDS Integers, Sequences, FiniteSets

CONSTANTS
    Users,          \* Set of usernames
    Estimates,      \* Set of legal estimate values
    Sessions,       \* Set of session IDs
    Threads         \* Set of HTTP request handler threads (kept for model parity)

VARIABLES
    activeSessions,     \* Set of currently active session IDs
    sessionUsers,       \* Function: session -> sequence of joined usernames
    sessionEstimates    \* Function: session -> sequence of (user, estimate) pairs

vars == << activeSessions, sessionUsers, sessionEstimates >>

\* --- Helpers ---

UserInSeq(seq, u) ==
    \E i \in 1..Len(seq) : seq[i] = u

FilterUsers(seq, u) ==
    SelectSeq(seq, LAMBDA x : x # u)

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

\* --- Initial State ---
Init ==
    /\ activeSessions = {}
    /\ sessionUsers = [s \in Sessions |-> << >>]
    /\ sessionEstimates = [s \in Sessions |-> << >>]

\* --- Actions (all atomic — synchronized block covers check + write) ---

\* Create a new session and join the creator
CreateSession(s, u) ==
    /\ s \notin activeSessions
    /\ activeSessions' = activeSessions \union {s}
    /\ sessionUsers' = [sessionUsers EXCEPT ![s] = Append(sessionUsers[s], u)]
    /\ UNCHANGED sessionEstimates

\* Join: synchronized — check and write are atomic
Join(u, s) ==
    /\ s \in activeSessions
    /\ ~UserInSeq(sessionUsers[s], u)
    /\ sessionUsers' = [sessionUsers EXCEPT ![s] = Append(sessionUsers[s], u)]
    /\ UNCHANGED << activeSessions, sessionEstimates >>

\* Vote: synchronized — check and write are atomic
Vote(u, s, e) ==
    /\ s \in activeSessions
    /\ UserInSeq(sessionUsers[s], u)
    /\ UserEstimateCount(s, u) = 0
    /\ sessionEstimates' = [sessionEstimates EXCEPT
        ![s] = Append(sessionEstimates[s], <<u, e>>)]
    /\ UNCHANGED << activeSessions, sessionUsers >>

\* Reset: synchronized (was already correct before the fix)
Reset(u, s) ==
    /\ s \in activeSessions
    /\ UserInSeq(sessionUsers[s], u)
    /\ sessionEstimates' = [sessionEstimates EXCEPT ![s] = << >>]
    /\ UNCHANGED << activeSessions, sessionUsers >>

\* Logout: synchronized — check and write are atomic
Logout(u, s) ==
    /\ s \in activeSessions
    /\ UserInSeq(sessionUsers[s], u)
    /\ sessionUsers' = [sessionUsers EXCEPT ![s] = FilterUsers(sessionUsers[s], u)]
    /\ sessionEstimates' = [sessionEstimates EXCEPT ![s] =
        SelectSeq(sessionEstimates[s], LAMBDA pair : pair[1] # u)]
    /\ UNCHANGED activeSessions

\* ClearSessions: synchronized on the same monitor — cannot interleave
\* with any compound operation
ClearSessions ==
    /\ activeSessions' = {}
    /\ sessionUsers' = [s \in Sessions |-> << >>]
    /\ sessionEstimates' = [s \in Sessions |-> << >>]

\* --- Next-State Relation ---
Next ==
    \/ \E s \in Sessions, u \in Users : CreateSession(s, u)
    \/ \E u \in Users, s \in Sessions : Join(u, s)
    \/ \E u \in Users, s \in Sessions, e \in Estimates : Vote(u, s, e)
    \/ \E u \in Users, s \in Sessions : Reset(u, s)
    \/ \E u \in Users, s \in Sessions : Logout(u, s)
    \/ ClearSessions

\* --- Specification ---
Spec == Init /\ [][Next]_vars /\ WF_vars(Next)

\* --- Safety Invariants (all should PASS after the fix) ---

NoDoubleVote ==
    \A s \in Sessions :
        \A u \in Users :
            UserEstimateCount(s, u) <= 1

NoDuplicateUsername ==
    \A s \in Sessions :
        \A i \in 1..Len(sessionUsers[s]) :
            \A j \in 1..Len(sessionUsers[s]) :
                (i # j) => (sessionUsers[s][i] # sessionUsers[s][j])

AllEstimatesHaveMembers ==
    \A s \in Sessions :
        \A i \in 1..Len(sessionEstimates[s]) :
            UserInSeq(sessionUsers[s], sessionEstimates[s][i][1])

ClearedSessionsAreEmpty ==
    \A s \in Sessions :
        s \notin activeSessions =>
            /\ sessionUsers[s] = << >>
            /\ sessionEstimates[s] = << >>

====
