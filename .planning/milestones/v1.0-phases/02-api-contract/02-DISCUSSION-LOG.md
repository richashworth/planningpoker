# Phase 2: API Contract - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 02-api-contract
**Areas discussed:** JSON response shape, Request format, Vote rejection messaging, Redux scheme storage
**Mode:** Auto (all recommended defaults selected)

---

## JSON Response Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Flat object | sessionId, schemeType, values array, includeUnsure, includeCoffee | ✓ |
| Nested object | sessionId at top level, scheme metadata in nested object | |
| Reuse SchemeConfig | Return SchemeConfig record directly with sessionId added | |

**User's choice:** [auto] Flat object (recommended default)
**Notes:** Same shape from both create and join endpoints. Simplest for Redux consumption.

---

## Request Format

| Option | Description | Selected |
|--------|-------------|----------|
| JSON body (@RequestBody) | createSession accepts JSON body with scheme config | ✓ |
| Form params | Add scheme fields as additional @RequestParam entries | |
| Mixed | userName as param, scheme as JSON body | |

**User's choice:** [auto] JSON body (recommended default)
**Notes:** Scheme config has a list (customValues) which is awkward as form params. Other endpoints stay as form params.

---

## Vote Rejection Messaging

| Option | Description | Selected |
|--------|-------------|----------|
| Generic 400 | "Invalid estimate value" — consistent with existing pattern | ✓ |
| Specific error | Include allowed values in error message | |

**User's choice:** [auto] Generic 400 (recommended default)
**Notes:** Matches existing ErrorHandler pattern. No security benefit to exposing allowed values.

---

## Redux Scheme Storage

| Option | Description | Selected |
|--------|-------------|----------|
| Extend reducer_game | Add legalEstimates and schemeConfig to existing game state | ✓ |
| New reducer | Create reducer_scheme.js for scheme-specific state | |

**User's choice:** [auto] Extend reducer_game (recommended default)
**Notes:** Scheme is inherently game state. Only 2 new fields — new reducer would be over-engineering.

---

## Claude's Discretion

- Response DTO naming and package placement
- Test structure for new controller tests
- Whether to use a dedicated response record or reuse SchemeConfig

## Deferred Ideas

None
