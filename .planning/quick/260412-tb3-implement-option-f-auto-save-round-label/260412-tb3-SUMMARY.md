---
phase: 260412-tb3
plan: 01
subsystem: frontend
tags: [ux, vote, results, auto-save, csv, playwright]
dependency_graph:
  requires: []
  provides:
    - Option-F-banner
    - Option-F-autosave
    - Option-F-export-relocation
  affects:
    - planningpoker-web/src/containers/Vote.jsx
    - planningpoker-web/src/containers/Results.jsx
    - planningpoker-web/tests/session-labels-csv.spec.js
tech_stack:
  added: []
  patterns:
    - "Debounced auto-save via useRef timer + useEffect cleanup"
    - "Click-to-edit inline banner pattern replacing explicit Set button"
    - "isAdmin-gated inline actions below data (session-history row)"
key_files:
  created: []
  modified:
    - planningpoker-web/src/containers/Vote.jsx
    - planningpoker-web/src/containers/Results.jsx
    - planningpoker-web/tests/session-labels-csv.spec.js
decisions:
  - "commitLabel accepts an optional nextValue argument so the debounce timer can commit the latest typed string without waiting for a re-render — avoids stale closure bugs while keeping a single code path for blur/Enter/debounce commit"
  - "Non-host banner rendered as display-only variant of the host banner (same chrome, no pencil, no click handler) to keep visual parity; still hidden entirely when currentLabel is empty"
  - "Saved indicator rendered in two places (inside the inline TextField's right cluster, and inside the banner's right cluster) so it does not shift layout when the banner swaps between display and edit modes"
metrics:
  duration: "~20 minutes"
  completed: 2026-04-12
---

# Quick Task 260412-tb3: Option F — Auto-save round label + relocate Export CSV

One-liner: Replaced Vote.jsx label TextField + Set button with a click-to-edit CURRENT ITEM banner that auto-saves on debounce/blur/Enter, and moved Export CSV from the Results header into a new SESSION HISTORY row below the chart.

## What Shipped

### Task 1 — Vote.jsx auto-saving CURRENT ITEM banner (commit c9020d6)

- Host sees a banner above the voting grid with uppercase "CURRENT ITEM" caption and bold label value
- Empty state shows italic muted placeholder "Add item description..."
- Banner is keyboard focusable (tabIndex=0, role="button"); Enter / Space enters edit mode
- Pencil IconButton on the right (aria-label "Edit current item") opens the inline TextField
- Clicking the banner background also opens edit mode (stopPropagation on the pencil prevents double-fire)
- Inline TextField (variant="standard", autoFocus) replaces the banner while editing
- Auto-save:
  - 1000ms debounced auto-save on typing (`useRef` debounce timer; `nextValue` captured in the timeout closure to avoid stale state)
  - Commit on blur (also exits edit mode back to banner)
  - Commit on Enter (also exits edit mode)
  - Escape reverts to lastBroadcastLabel and exits edit mode
- Diff check: `commitLabel` no-ops when labelInput === lastBroadcastLabel, so pressing Enter twice or blurring without changes won't spam `/setLabel`
- Transient "✓ Saved" Typography flashes for 1500ms after each successful dispatch (cleared on unmount via cleanup useEffect)
- Non-host branch: display-only variant of the same banner chrome (no pencil, no click, no focus); hidden entirely when currentLabel is empty — preserves original non-host behavior
- Removed imports: `InputAdornment`, `Button`. Added imports: `IconButton`, `EditIcon`, `useRef`

### Task 2 — Results.jsx SESSION HISTORY row (commit ec85de8)

- Removed Export CSV Button from the header cluster (only Next Item remains on the right, still isAdmin-gated)
- Added a new Box sibling of the chart+table grid, still inside the outer Results Box:
  - Top border divider (1px solid, divider color), mt: 2, pt: 2
  - Flex row, space-between, flex-wrap for narrow screens
  - Left: uppercase caption "Session history · {N} round(s)" (pluralization handled via ternary)
  - Right: outlined Button with DownloadIcon, onClick handleExportCsv, disabled when no data
- Entire row gated on `isAdmin && (rounds.length > 0 || results.length > 0)` — hidden for non-hosts and hidden on fresh sessions with nothing to export
- `DownloadIcon` import retained; `handleExportCsv` handler unchanged
- `npm run build` succeeds

### Task 3 — Playwright spec rewrite (commit 070406c)

- Added banner-click step before every `getByPlaceholder('Round label (optional)')` so edit mode is entered first
- Replaced all `getByRole('button', { name: 'Set round label' }).click()` with `labelInput.press('Enter')` — deterministic and faster than waiting on the 1000ms debounce
- Deleted test "Set button is disabled when input matches last broadcast" — Set button no longer exists; the "no dispatch on unchanged value" behavior is still covered via the network-counting test
- Rewrote "no /setLabel network request fires while typing — only on Set" to "no /setLabel fires while typing; exactly one fires after debounce settles":
  - Counts POST /setLabel requests via `page.on('request')`
  - Types 'Hello' character-by-character with 80ms per char (total well under 1000ms)
  - Asserts request count is 0 immediately after typing
  - Waits 1200ms
  - Asserts request count is exactly 1
- Renamed "Set button explicitly broadcasts label to non-host" → "label broadcasts to non-host on Enter key"
- Renamed "Empty Set submission clears the broadcast label" → "empty label on Enter clears broadcast" (re-enters edit mode between the two commits since the banner collapses after each commit)
- CSV download test: added `await exportBtn.scrollIntoViewIfNeeded()` before clicking, since the button is now below the chart
- "label clears on next round" test now asserts the "Add item description..." placeholder is visible (instead of asserting `labelInput` value), since after a round reset the banner is in display mode

## Commits

| Task | Commit  | Files                                              |
| ---- | ------- | -------------------------------------------------- |
| 1    | c9020d6 | planningpoker-web/src/containers/Vote.jsx          |
| 2    | ec85de8 | planningpoker-web/src/containers/Results.jsx       |
| 3    | 070406c | planningpoker-web/tests/session-labels-csv.spec.js |

## Verification Status

- `npm run lint` — PASS
- `npm run format:check` — PASS
- `npm run build` — PASS (Vite build: 1040 modules, no errors)
- Playwright e2e — NOT RUN by the executor (requires backend on port 9000; handed to human checkpoint per task 4)
- `./gradlew planningpoker-api:test` — NOT RUN (no backend changes in this task)

## Deviations from Plan

None — plan executed as written. One minor implementation choice worth noting: the plan suggested "Preferred: replace the manual timer with a useEffect that watches labelInput". I used the manual useRef timer approach inside `handleLabelChange` instead, capturing `nextValue` directly in the setTimeout closure. This avoids the stale-closure problem the plan warned about without the extra useEffect indirection, and the cleanup useEffect on unmount still clears the timer cleanly.

## Handoff to Human Verification (Task 4)

**Checkpoint type:** human-verify
**Action required by user:**

1. Run the full frontend build + backend tests:
   ```
   cd planningpoker-web && npm run build
   cd .. && ./gradlew planningpoker-api:test
   ```
2. Start the backend: `./gradlew planningpoker-api:bootRun`
3. Run the e2e tests against it:
   ```
   cd planningpoker-web && npx playwright test tests/session-labels-csv.spec.js
   ```
4. Start the dev server (`cd planningpoker-web && npm run dev`) and walk the visual checks in the plan's `how-to-verify` section — two browser windows (host + join), confirm:
   - CURRENT ITEM banner renders with placeholder when empty
   - Clicking banner or pencil enters edit mode
   - Typing for ~1s produces a "✓ Saved" flash and the non-host sees the new label
   - Blur commits; Enter commits; Escape reverts
   - Non-host sees display-only banner (no pencil), banner hidden when host clears
   - Results header has no Export CSV (only Results + Consensus + Next Item)
   - SESSION HISTORY row appears below chart with correct pluralization (0 rounds → "0 rounds"; 1 round → "1 round")
   - Export CSV download works from the new location
   - Dark/light mode both render the banner tint legibly
   - Fresh session (no rounds, no results) hides the session-history row entirely

## Self-Check: PASSED

- FOUND: planningpoker-web/src/containers/Vote.jsx
- FOUND: planningpoker-web/src/containers/Results.jsx
- FOUND: planningpoker-web/tests/session-labels-csv.spec.js
- FOUND: commit c9020d6
- FOUND: commit ec85de8
- FOUND: commit 070406c
