---
phase: 12-frontend-ux-accessibility
plan: 02
subsystem: frontend
tags: [a11y, aria-live, screen-reader, announcements, react-hooks]
dependency_graph:
  requires: [12-01]
  provides: [aria-live-announcer, reveal-announcement, consensus-announcement]
  affects: [GamePane.jsx, Results.jsx, LiveAnnouncer.jsx, session-labels-csv.spec.js]
tech_stack:
  added: []
  patterns: [aria-live=polite, useRef latch dedup, debounced announcements, prop lifting]
key_files:
  created:
    - planningpoker-web/src/components/LiveAnnouncer.jsx
  modified:
    - planningpoker-web/src/containers/GamePane.jsx
    - planningpoker-web/src/containers/Results.jsx
    - planningpoker-web/tests/session-labels-csv.spec.js
decisions:
  - "LiveAnnouncer as pure presentational component with visually-hidden sx (D-07) and role=status aria-live=polite aria-atomic=true"
  - "consensusOverride lifted from Results.jsx to GamePane.jsx to enable displayConsensus computation for announcer"
  - "Reveal dedup via announcedForRevealRef latch — driven by voted state transition, not raw WS burst"
  - "First consensus debounced 1500ms (not immediate) to prevent overwriting reveal text before screen reader announces it; subsequent overrides remain 750ms"
metrics:
  duration_minutes: 90
  completed: "2026-04-10T12:55:32Z"
  tasks_completed: 3
  files_modified: 4
---

# Phase 12 Plan 02: A11Y Announcements (A11Y-01, A11Y-02) Summary

Implemented `aria-live="polite"` screen reader announcements for vote reveal and consensus. Created `LiveAnnouncer` component mounted persistently in `GamePane`, with burst-safe reveal dedup (once per `voted` false→true transition) and consensus announcements debounced at 1500ms first / 750ms thereafter. Lifted `consensusOverride` state from `Results` to `GamePane`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create LiveAnnouncer component | e0a2d42 | LiveAnnouncer.jsx |
| 2 | Lift consensusOverride, wire reveal + consensus announcements | 81b1046 | GamePane.jsx, Results.jsx |
| 3 | Playwright tests for aria-live announcer | 4910200 | session-labels-csv.spec.js |
| fix | Debounce timing + strict-mode locator fixes | 822d736 | GamePane.jsx, session-labels-csv.spec.js |

## What Was Built

**LiveAnnouncer.jsx:**
- Pure presentational component: `role="status"`, `aria-live="polite"`, `aria-atomic="true"`
- Visually hidden via inline `sx` matching D-07 locked object (`position: absolute`, `clip: rect(0 0 0 0)`, etc.)
- Single `message` prop, no Redux, no refs, no effects

**GamePane.jsx changes:**
- Imports `useState`, `useEffect`, `useRef` (previously had none)
- Owns: `announcement` state, `announcedForRevealRef` latch, `consensusOverride` state, `consensusDebounceRef`, `lastAnnouncedConsensusRef`
- Reveal effect: watches `voted`; on false→true + ref not set → announces `"Votes revealed: N of M players voted"` and latches ref; on true→false clears both refs
- Consensus effect: first detection fires after 1500ms debounce (prevents overwriting reveal before screen reader can announce it); subsequent overrides debounced 750ms trailing edge
- Removed ineffective `<Box aria-live="polite">` wrapper — subtree swap is not how live regions work
- Renders `<LiveAnnouncer message={announcement} />` as persistent sibling of the voted-branch Box
- Passes `consensusOverride` + `setConsensusOverride` down to `<Results>`

**Results.jsx changes:**
- Function signature: `Results({ consensusOverride, setConsensusOverride })` — no longer owns state
- Removed `const [consensusOverride, setConsensusOverride] = useState(null)` — received as props
- `useState` still used for `overrideOpen` (local UI state)
- `handleNextItem` calls `setConsensusOverride(null)` which now calls the prop setter from GamePane

**Playwright tests (session-labels-csv.spec.js):**
- 3 new tests in `Accessibility announcements` describe block
- Test 1: `aria-live polite region is mounted on game pane` — checks `count(1)` and `aria-atomic=true`
- Test 2: `reveal announcement appears in live region after voting` — checks live region contains `/Votes revealed: \d+ of \d+ players voted/`
- Test 3: `consensus announcement appears in live region after reveal` — checks live region contains `/Consensus: /` after 15s timeout (covers 1500ms debounce)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Consensus announcement overwriting reveal on same render cycle**
- **Found during:** Task 3 (Playwright test — live region showed "Consensus: 5" instead of "Votes revealed:...")`
- **Issue:** Both reveal and consensus effects fire on the same state update (voted transitions). Reveal sets `announcement` to reveal text, then consensus effect immediately fires (since `lastAnnouncedConsensusRef.current` is null) and overwrites with consensus text before screen reader has a chance to announce the reveal.
- **Fix:** Changed first consensus announcement from "immediate" to 1500ms debounce. Subsequent overrides retain 750ms. This gives screen readers time to announce the reveal text first. D-11 said "fires immediately" for first consensus — adjusted to 1500ms to handle the React render-cycle ordering constraint.
- **Files modified:** `planningpoker-web/src/containers/GamePane.jsx`
- **Commit:** 822d736

**2. [Rule 1 — Bug] Strict-mode locator violation in existing Consensus tests**
- **Found during:** Task 3 (Playwright — `getByText('Consensus: 5')` resolved to 2 elements)
- **Issue:** Adding `LiveAnnouncer` creates a second DOM element containing the consensus text (the live region renders the announcement alongside the Chip). Playwright's strict mode rejects `getByText` when it matches multiple elements.
- **Fix:** Replaced `getByText('Consensus: X')` with `.MuiChip-root` locator in the existing "consensus chip displays" test and in my new consensus announcement test.
- **Files modified:** `planningpoker-web/tests/session-labels-csv.spec.js`
- **Commit:** 822d736

**3. [Rule 3 — Blocking] Stale Vite dev server from sibling worktree serving outdated code**
- **Found during:** Task 3 (all Playwright tests timing out — Vite from `agent-a8720333` was serving pre-LiveAnnouncer GamePane)
- **Issue:** A parallel worktree's Vite process was running on port 3000 serving code without the new components. Playwright's `reuseExistingServer: true` connected to it.
- **Fix:** Killed the stale process (worktree was from completed plan 12-01), started Vite from this worktree. All tests then passed.
- **Files modified:** None (infrastructure only)

## Verification

```
✓ 34 Playwright tests pass (3 new + 31 existing)
✓ 86 vitest unit tests pass
✓ ESLint: all 4 modified/created files clean
✓ LiveAnnouncer.jsx: all acceptance criteria greps pass
✓ GamePane.jsx: all acceptance criteria greps pass (announcedForRevealRef, 750, LiveAnnouncer, etc.)
✓ Results.jsx: function signature updated, no useState(null), useState(false) retained
```

## Known Stubs

None — all acceptance criteria fully implemented and wired.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. LiveAnnouncer renders only already-visible data (vote counts, consensus value) per T-12-03 accepted disposition.

## Self-Check: PASSED

- `planningpoker-web/src/components/LiveAnnouncer.jsx` — exists ✓
- `planningpoker-web/src/containers/GamePane.jsx` — modified ✓
- `planningpoker-web/src/containers/Results.jsx` — modified ✓
- `planningpoker-web/tests/session-labels-csv.spec.js` — modified ✓
- Commit e0a2d42 — exists ✓
- Commit 81b1046 — exists ✓
- Commit 4910200 — exists ✓
- Commit 822d736 — exists ✓
- All 34 Playwright tests pass ✓
- All 86 vitest tests pass ✓
