# Phase 12: Frontend UX & Accessibility - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 12-frontend-ux-accessibility
**Mode:** discuss (user delegated all decisions — "you decide")

---

## Gray Areas Presented

| Area | Key question |
|------|--------------|
| Set button UX | Placement (inline adornment vs separate button), icon vs text, Enter behaviour, disabled styling |
| aria-live region architecture | One shared region vs two; where mounted; visually-hidden approach |
| Reveal dedup strategy | How to fire exactly one announcement across the 6-burst WebSocket replay |
| Consensus debounce & wording | Debounce window, phrasing, host-override path reuse |

## User Response

User selected no areas and replied **"you decide"** — full delegation. Claude made all decisions based on codebase evidence and WebSocket burst semantics, then presented the full 13-decision proposal for confirmation. User selected "Proceed — write CONTEXT.md" without corrections.

## Key Decisions (see CONTEXT.md for full list)

### Set Button UX
- **Chosen:** Inline `InputAdornment` with text "Set" button; Enter key handler via `onKeyDown` (no form); `disabled` when input matches last broadcast; empty submissions allowed
- **Alternatives considered:**
  - Separate button below TextField — rejected, more visual weight for little gain
  - Icon-only button (e.g., ArrowForward) — rejected, less clear than "Set" text
  - Form wrapper with onSubmit — rejected, SPA navigation risk

### aria-live Architecture
- **Chosen:** Single shared `LiveAnnouncer` component in `GamePane`, visually hidden via inline `sx`
- **Alternatives considered:**
  - Two separate regions (reveal + consensus) — rejected, cross-talk risk and more DOM
  - Visually-hidden CSS utility class — rejected, project uses `sx` convention throughout
  - Announcer per-component (Vote.jsx, Results.jsx) — rejected, harder to coordinate dedup

### Reveal Dedup
- **Chosen:** `useRef` latch watching `voted` Redux state transitions; reset on `voted → false`
- **Alternatives considered:**
  - New Redux action `REVEAL_ANNOUNCED` — rejected, Redux for local UI concern is overkill
  - Derived state via message count — rejected, MessagingUtils burst replay breaks this
  - No dedup (accept repeated announcements) — rejected, violates A11Y-01 success criterion

### Consensus Debounce & Wording
- **Chosen:** 750ms trailing-edge debounce, first announcement fires instantly, single shared live region for auto + override
- **Alternatives considered:**
  - 500ms debounce — borderline too eager for rapid override hunting
  - 1000ms debounce — feels sluggish after a deliberate pick
  - lodash.debounce — rejected, adds dependency use for a 10-line setTimeout
  - Separate live region for host override — rejected, see aria-live architecture

## Claude's Discretion (per user delegation)

- Exact prop drilling / state lifting implementation for `consensusOverride` (planner may refine)
- MUI InputAdornment visual tuning
- Playwright test fixture naming and organisation

## Deferred Ideas

- Label set/clear SR announcements (future a11y phase)
- `aria-live="assertive"` for errors (future a11y phase)
- Focus management after reveal
- Broader a11y audit (contrast, keyboard nav, skip links)
- `useAnnouncer` hook extraction (premature — one consumer)
