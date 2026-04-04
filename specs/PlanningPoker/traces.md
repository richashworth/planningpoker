# Planning Poker — TLC Violation Traces

## 1. Double-Join TOCTOU Race (NoDuplicateUsername violated)

Two HTTP threads simultaneously try to join the same user to a session. Both pass the "not already a member" check before either writes, resulting in the username appearing twice.

```mermaid
sequenceDiagram
    participant T1 as Thread 1 (HTTP)
    participant T2 as Thread 2 (HTTP)
    participant SM as SessionManager

    Note over SM: Session s1 exists with user u2

    T1->>SM: JoinCheck(u1, s1) — "is u1 a member?" → No
    T2->>SM: JoinCheck(u1, s1) — "is u1 a member?" → No
    Note over T1,T2: Both threads pass the guard
    T1->>SM: JoinAct — append u1 to sessionUsers[s1]
    Note over SM: sessionUsers[s1] = <<u2, u1>>
    T2->>SM: JoinAct — append u1 to sessionUsers[s1]
    Note over SM: sessionUsers[s1] = <<u2, u1, u1>> — DUPLICATE!
```

## 2. Double-Vote TOCTOU Race (NoDoubleVote violated)

Two HTTP threads simultaneously submit a vote for the same user. Both pass the "hasn't voted yet" check before either writes, resulting in two estimates for one user.

```mermaid
sequenceDiagram
    participant T1 as Thread 1 (HTTP)
    participant T2 as Thread 2 (HTTP)
    participant SM as SessionManager

    Note over SM: Session s1, user u2 is member, no votes yet

    T1->>SM: VoteCheck(u2, s1, e1) — "has u2 voted?" → No
    T2->>SM: VoteCheck(u2, s1, e1) — "has u2 voted?" → No
    Note over T1,T2: Both threads pass the guard
    T1->>SM: VoteAct — append <<u2, e1>> to estimates
    Note over SM: estimates = << <<u2, e1>> >>
    T2->>SM: VoteAct — append <<u2, e1>> to estimates
    Note over SM: estimates = << <<u2, e1>>, <<u2, e1>> >> — DOUBLE VOTE!
```

## 3. Ghost Data After Session Clear (ClearedSessionsAreEmpty + AllEstimatesHaveMembers violated)

A thread passes the membership/session-active check, then the weekly cron wipes all sessions, then the thread completes its write — leaving orphaned data in a cleared session.

```mermaid
sequenceDiagram
    participant T1 as Thread 1 (HTTP)
    participant Cron as ClearSessionsTask
    participant SM as SessionManager

    Note over SM: Session s1 active, user u1 is member

    T1->>SM: VoteCheck(u1, s1, e1) — session active? Yes. Member? Yes. Already voted? No.
    Note over T1: Thread has intent recorded, ready to write
    Cron->>SM: ClearSessions — wipe all sessions, users, estimates
    Note over SM: activeSessions = {}, sessionUsers[s1] = <<>>, estimates[s1] = <<>>
    T1->>SM: VoteAct — append <<u1, e1>> to estimates[s1]
    Note over SM: estimates[s1] = << <<u1, e1>> >> — GHOST DATA in cleared session!
    Note over SM: u1 has an estimate but is not a member — AllEstimatesHaveMembers violated too
```
