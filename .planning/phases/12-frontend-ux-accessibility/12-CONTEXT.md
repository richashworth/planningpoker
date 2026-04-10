# Phase 12: Frontend UX & Accessibility - Context

**Gathered:** 2026-04-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the current keystroke-debounced round label broadcast with explicit submit (Set button + Enter key), and add `aria-live="polite"` screen-reader announcements for vote reveal and consensus (auto-majority + host override). Non-host label display and all existing voting/results behaviour are unchanged.

Out of scope: announcing other state transitions, `aria-live="assertive"` errors, focus management, broader a11y audit.

</domain>

<decisions>
## Implementation Decisions

### Set Button UX (UX-01)
- **D-01:** Render a "Set" button via MUI `InputAdornment` position="end" inside the existing `TextField` at `planningpoker-web/src/containers/Vote.jsx`. Variant `text`, size `small`. Text label "Set" (not icon) — clearer and ~30px wide fits the adornment slot.
- **D-02:** Pressing Enter inside the TextField triggers the same submit handler via `onKeyDown`. No `<form>` wrapper — avoids any SPA navigation risk.
- **D-03:** Button `disabled` when `labelInput === lastBroadcastLabel`. Track `lastBroadcastLabel` in local component state, initialised from `currentLabel` Redux selector and updated after each successful `setLabel` dispatch.
- **D-04:** Empty submissions are allowed: submitting an empty string dispatches `setLabel(playerName, sessionId, '')` and broadcasts the clear. Non-host participants see the label disappear.
- **D-05:** Remove the `debounceRef` + 300ms `setTimeout` logic at `Vote.jsx:64-71` entirely. `onChange` only updates local `labelInput` state — no dispatch, no broadcast.

### aria-live Region Architecture (A11Y-01, A11Y-02)
- **D-06:** **One shared live region** mounted in `GamePane.jsx` (the common parent of `Vote` and `Results`). A single `aria-live="polite"` node avoids cross-talk between reveal and consensus announcements and keeps the DOM minimal.
- **D-07:** New component `LiveAnnouncer.jsx` in `planningpoker-web/src/components/`. Props: `message: string`. Renders `<div role="status" aria-live="polite" aria-atomic="true">`. Visually hidden via inline `sx` prop (matches project convention — no new CSS utility class):
  ```js
  sx={{
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
    border: 0,
    p: 0,
    m: '-1px',
  }}
  ```
- **D-08:** Message source is a single `announcement` state owned by `GamePane`. Two `useEffect` hooks watch (a) `voted` for reveal and (b) `displayConsensus` for consensus. Both write into the same `announcement` state, which is passed to `<LiveAnnouncer />`. No new Redux actions.

### Reveal Announcement Dedup (A11Y-01)
- **D-09:** Use a `useRef` latch `announcedForRevealRef` in `GamePane`. On `voted` transition `false → true`, set `announcement` once and set the ref to `true`. On `voted` transition `true → false` (reset / next item), clear the ref. This correctly handles the `MessagingUtils.burstResultsMessages()` 6-burst replay (10ms/50ms/150ms/500ms/2s/5s) because `voted` is a derived Redux state that only flips on the actual transition, not on each WebSocket message.
- **D-10:** Reveal text: `"Votes revealed: ${results.length} of ${users.length} players voted"` — matches ROADMAP.md success criterion verbatim. `users.length` comes from `state.users` selector.

### Consensus Announcement Debounce & Wording (A11Y-02)
- **D-11:** Debounce window: **750ms**. First announcement (auto-majority computed from incoming results) fires immediately — zero delay, feels instant. Subsequent changes (host override, rapid re-overrides) are debounced at 750ms trailing edge. Implemented via `setTimeout` + cleanup inside `useEffect` — no new dependency.
- **D-12:** Consensus text: `"Consensus: ${displayConsensus}"` — matches ROADMAP.md success criterion verbatim. `displayConsensus` source of truth is the same value computed in `Results.jsx` (auto or host-override). Since the live region lives in `GamePane`, it needs access to the same value — either lift `consensusOverride` up to `GamePane` or mirror it via Redux. **Locked decision:** lift `consensusOverride` state from `Results.jsx` into `GamePane.jsx` and pass it down as a prop pair (`consensusOverride`, `setConsensusOverride`). This keeps `displayConsensus` computable in `GamePane` for the announcer.
- **D-13:** Both auto-majority detection and host override reuse the **same shared live region** (D-06). There is no separate "override" region — the polite region simply gets a new text value and assistive tech re-announces.

### Claude's Discretion
- Exact prop drilling vs lifting approach for `consensusOverride` if a simpler alternative emerges during planning (e.g., moving `calcConsensus` into a selector). Planner may refine.
- Exact MUI `InputAdornment` layout fine-tuning (padding, alignment) — visual polish within the decided structure.
- Playwright test fixture naming and file organisation for the new Set/Enter coverage.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §UX-01 — Explicit label submit via Set button / Enter; empty clears; no-op disabled
- `.planning/REQUIREMENTS.md` §A11Y-01 — Vote reveal announcement via polite live region, once per reveal
- `.planning/REQUIREMENTS.md` §A11Y-02 — Consensus announcement on auto-majority + host override, debounced

### Roadmap
- `.planning/ROADMAP.md` §"Phase 12: Frontend UX & Accessibility" — Goal, depends-on, success criteria

### Project
- `./CLAUDE.md` — Project-level build/test commands, React/MUI conventions, WebSocket burst behaviour
- No external specs or ADRs — requirements are fully captured above and in REQUIREMENTS.md

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `planningpoker-web/src/containers/Vote.jsx:91-99` — Existing TextField for the label; adornment can attach here
- `planningpoker-web/src/containers/Results.jsx:28-29` — `autoConsensus = calcConsensus(results)` and `displayConsensus = consensusOverride || autoConsensus` already compute the value we need to announce
- `planningpoker-web/src/containers/GamePane.jsx:37` — Reveal transition edge: `{voted ? <Results /> : <Vote />}`. The `voted` Redux flag is the authoritative reveal signal
- `planningpoker-web/src/actions/index.js:173-183` — `setLabel` action creator; no changes needed, just fewer callers
- `planningpoker-web/src/utils/consensus.js` — `calcConsensus` + `calcStats`, reusable for announcements if needed at the GamePane level

### Established Patterns
- All styling via MUI `sx` prop — no CSS files, no `makeStyles`. `LiveAnnouncer`'s visually-hidden styles follow this convention
- Local UI state via `useState` + `useRef`; global state via Redux selectors. Announcement dedup belongs in local refs, not Redux
- Functional components + hooks throughout; no class components
- Backend burst messaging (`MessagingUtils` sends 6 copies at 10ms/50ms/150ms/500ms/2s/5s) means any "fire on new payload" pattern will fire 6x — dedup must be driven by derived state transitions, not raw message arrival

### Integration Points
- `GamePane.jsx` becomes owner of: shared `<LiveAnnouncer />`, `announcement` state, `announcedForRevealRef`, and (new) `consensusOverride` lifted from `Results.jsx`
- `Results.jsx` receives `consensusOverride` + `setConsensusOverride` as props instead of owning the state
- `Vote.jsx` loses its `debounceRef` / `handleLabelChange` timeout logic; gains `lastBroadcastLabel` state and `handleSubmit` (called by Set button + Enter)
- Playwright e2e tests at `planningpoker-web/tests/` — existing label broadcast coverage likely needs updating; new coverage for Set-button and Enter-key paths

</code_context>

<specifics>
## Specific Ideas

- Reveal announcement text must match ROADMAP example verbatim: `"Votes revealed: 5 of 5 players voted"` form
- Consensus announcement text must match ROADMAP example verbatim: `"Consensus: 5"` form
- Live region is a thin component — tiny footprint, reusable if future phases need assertive announcements (though only polite is in scope here)

</specifics>

<deferred>
## Deferred Ideas

- Announcing label set/clear events to screen readers — not in success criteria; separate a11y pass
- `aria-live="assertive"` for errors (WebSocket disconnect, vote failures) — future a11y phase
- Focus management after reveal / next-item transitions — not in scope
- Keyboard shortcut to submit label (e.g., Cmd+Enter) — Enter-key handling is already sufficient
- Broader a11y audit (colour contrast, keyboard nav for card grid, skip links) — separate phase
- Extracting `LiveAnnouncer` into a reusable hook (`useAnnouncer`) — only one consumer in this phase; premature abstraction

</deferred>

---

*Phase: 12-frontend-ux-accessibility*
*Context gathered: 2026-04-10*
