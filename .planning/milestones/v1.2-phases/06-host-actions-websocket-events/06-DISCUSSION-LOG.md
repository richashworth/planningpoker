# Phase 6: Host Actions & WebSocket Events - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 06-Host Actions & WebSocket Events
**Areas discussed:** Authorization model, Kick behavior

---

## Authorization Model

| Option | Description | Selected |
|--------|-------------|----------|
| 403 Forbidden | Return 403 with error message — semantically correct, easy for frontend to distinguish from 400 validation errors | ✓ |
| 400 Bad Request | Consistent with existing error handling (all errors are currently IllegalArgumentException -> 400) — simpler | |
| You decide | Claude picks the best approach | |

**User's choice:** 403 Forbidden
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Reject with 403 | Check host status at execution time inside synchronized block — if caller is no longer host, reject | ✓ |
| Accept if was host at click time | More lenient, but adds complexity tracking who was host when | |
| You decide | Claude picks during implementation | |

**User's choice:** Reject with 403 (execution-time check)
**Notes:** None

---

## Kick Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Clear votes | Reuse existing removeUser() which already clears estimates — consistent with voluntary leave | ✓ |
| Keep votes | Estimate stays in results even though they're gone | |
| You decide | Claude picks during implementation | |

**User's choice:** Clear votes (changed from initial "Keep votes" selection)
**Notes:** User initially selected "Keep votes" then changed their mind to "Clear votes"

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, add event type | Enrich /topic/users/ payload with event field for kick/promote events | |
| No, same as leave | Users just disappear from the list — simpler | |
| You decide | Claude picks during implementation | ✓ |

**User's choice:** You decide
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, can rejoin | No ban list — kick just removes them, can rejoin with session ID | ✓ |
| No, blocked for session | Maintain a kicked-users set per session | |
| You decide | Claude picks during implementation | |

**User's choice:** Yes, can rejoin
**Notes:** User questioned the value of kick feature entirely ("is there any point in the host being able to kick users out?"). Explained the use case: AFK users, trolls, wrong-session joins where the person won't leave voluntarily. User confirmed keeping kick in scope.

---

## Claude's Discretion

- API endpoint naming and parameter style
- WebSocket event shape (whether to add event type field)
- Whether kick and promote are separate endpoints or one action endpoint

## Deferred Ideas

None
