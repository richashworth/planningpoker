# Phase 11: UI Hardening & Test Coverage - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 11-ui-hardening-test-coverage
**Areas discussed:** Codebase analysis (pre-implementation verification)
**Mode:** discuss

---

## Pre-Implementation Codebase Analysis

Codebase analysis revealed that 3 of 4 success criteria are already met:

| SC | Requirement | Finding |
|----|-------------|---------|
| SC-1 | Form loading states | Both JoinGame.jsx and CreateGame.jsx have `submitting` state, disabled buttons, CircularProgress |
| SC-2 | Snackbar errors | Zero `alert()` calls; all errors use `showError()` -> Snackbar in App.jsx |
| SC-3 | Vote revert | `reducer_vote.js:8` reverts flag; `reducer_results.js:12` filters optimistic entry |
| SC-4 | useStomp tests | Existing tests cover connect/subscribe/disconnect; missing reconnect lifecycle |

**User's choice:** Proceed to context — capture findings and move to planning
**Notes:** Only SC-4 (reconnect test gap) requires implementation work

---

## Claude's Discretion

- Reconnect test structure and naming
- Whether to test 5-second initial connection timeout
- Additional edge case tests

## Deferred Ideas

- Host voting round labels — feature work, not hardening
- Footer copyright date — already addressed

