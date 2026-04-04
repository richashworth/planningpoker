# Phase 3: Frontend UI - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase adds the scheme selection UI to CreateGame, replaces hardcoded vote cards with dynamic cards from the session scheme, and updates the results chart to use scheme-aware labels. All backend and Redux wiring is complete from Phases 1-2.

</domain>

<decisions>
## Implementation Decisions

### Scheme Selector Layout
- **D-01:** Use MUI `ToggleButtonGroup` for preset scheme selection (Fibonacci / T-shirt / Simple / Custom), placed below the name input on CreateGame page.
- **D-02:** Fibonacci is selected by default (pre-selected toggle button).
- **D-03:** When "Custom" is selected, a `TextField` appears below for entering custom values.

### Custom Values Input
- **D-04:** Custom values entered as comma-separated text in a single `TextField`.
- **D-05:** Inline validation via `helperText` shows errors: "At least 2 values", "At most 20 values", "Value exceeds 10 characters", "Duplicate values removed". Validation runs on change, not just on submit.
- **D-06:** Values are trimmed and deduplicated before submission.

### Meta-Card Toggles
- **D-07:** Two MUI `Switch` components with `FormControlLabel`, placed below the scheme selector.
- **D-08:** Labels: "Include ? (unsure)" and "Include Coffee (break)". Both default to on.
- **D-09:** Toggles are visible regardless of selected scheme (presets or custom).

### Vote Cards
- **D-10:** Vote.jsx reads `legalEstimates` from Redux state (`state.game.legalEstimates`) instead of importing `LEGAL_ESTIMATES` from Constants.js.
- **D-11:** The existing `cardSx()` function and grid layout are preserved — no visual redesign needed.
- **D-12:** The `allValues` construction (`[...LEGAL_ESTIMATES, COFFEE_SYMBOL]`) is replaced by just reading `legalEstimates` directly (server already includes ? and Coffee if toggled on).

### Results Chart
- **D-13:** ResultsChart.jsx reads `legalEstimates` from Redux state for labels and aggregation instead of importing `LEGAL_ESTIMATES`.
- **D-14:** Chart aggregation logic (`LEGAL_ESTIMATES.map(x => estimates.filter(...))`) uses the dynamic labels.

### Claude's Discretion
- Spacing and sizing of the scheme selector relative to existing form elements
- Whether to show a preview of the selected scheme's values before starting the game
- Error state styling for custom values validation

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design Specs
- `docs/superpowers/specs/2026-04-04-estimation-schemes-design.md` — Full design spec for estimation schemes feature
- `docs/superpowers/plans/2026-04-04-estimation-schemes.md` — Detailed implementation plan

### Phase 2 Artifacts
- `.planning/phases/02-api-contract/02-CONTEXT.md` — API response shape and Redux state decisions (D-08 through D-11 define the Redux fields this phase reads)

### Existing Code (must-read before modifying)
- `planningpoker-web/src/pages/CreateGame.jsx` — Host page to extend with scheme selector
- `planningpoker-web/src/containers/Vote.jsx` — Vote cards to make dynamic (currently uses hardcoded LEGAL_ESTIMATES)
- `planningpoker-web/src/containers/ResultsChart.jsx` — Chart labels to make dynamic
- `planningpoker-web/src/config/Constants.js` — LEGAL_ESTIMATES and COFFEE_SYMBOL constants
- `planningpoker-web/src/reducers/reducer_game.js` — Redux state shape (will have legalEstimates after Phase 2)
- `planningpoker-web/src/actions/index.js` — createGame action creator (needs scheme params)
- `planningpoker-web/src/theme.js` — Theme configuration for dark/light mode

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `cardSx()` in Vote.jsx: Card styling function with hover/selected/disabled states — keep as-is
- `NameInput` component: Reusable text input with MUI TextField — pattern to follow for custom values input
- MUI `ToggleButtonGroup`: Available in MUI v5, not currently used but fits scheme preset selection
- MUI `Switch` + `FormControlLabel`: Available, used in other MUI apps for boolean toggles

### Established Patterns
- Forms use `useState` for local state, dispatch on submit (CreateGame.jsx pattern)
- MUI `Card` + `CardContent` wrapper for page-level forms
- `Box` with `sx` prop for all layout — no CSS files
- Grid for vote cards: `repeat(auto-fill, minmax(80px, 1fr))` handles variable card counts
- Redux `useSelector` to read state, `useDispatch` to trigger actions

### Integration Points
- `CreateGame.jsx` form submit → `createGame` action must include scheme params (schemeType, customValues, includeUnsure, includeCoffee)
- `Vote.jsx` line 59: `const allValues = [...LEGAL_ESTIMATES, COFFEE_SYMBOL]` → replace with `useSelector(state => state.game.legalEstimates)`
- `ResultsChart.jsx` line 21-22: `LEGAL_ESTIMATES.map(...)` → replace with Redux `legalEstimates`
- `ResultsChart.jsx` line 52: `labels: LEGAL_ESTIMATES` → replace with Redux `legalEstimates`

</code_context>

<specifics>
## Specific Ideas

- The ToggleButtonGroup should feel native to the existing MUI Card form — same spacing, same contained style
- Custom values TextField should show a placeholder like "S, M, L, XL" to hint at format
- Meta-card toggles should be compact — not take more vertical space than the scheme selector itself

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-frontend-ui*
*Context gathered: 2026-04-04*
