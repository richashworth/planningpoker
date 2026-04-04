# Phase 3: Frontend UI - Research

**Researched:** 2026-04-04
**Status:** Complete

## Current State Analysis

### Backend API (completed in Phases 1-2)

The backend already supports scheme selection. Key contracts:

- `POST /createSession` accepts JSON body: `{ userName, schemeType, customValues, includeUnsure, includeCoffee }` and returns `SessionResponse { sessionId, schemeType, values[], includeUnsure, includeCoffee }`
- `POST /joinSession` returns the same `SessionResponse` shape
- `SchemeType` enum: `FIBONACCI`, `TSHIRT`, `SIMPLE` with preset value lists
- Custom scheme: `"custom"` as schemeType + CSV string in `customValues` field
- Server validates: 2-20 custom values, max 10 chars each, deduplication, and vote validation against session scheme

### Redux State (completed in Phase 2)

The reducer already handles scheme data from API responses:

```js
// reducer_game.js initialGameState
{ legalEstimates: [], schemeType: 'fibonacci', includeUnsure: true, includeCoffee: true }

// On CREATE_GAME / JOIN_GAME: extracts from action.payload.data
legalEstimates: action.payload.data.values,
schemeType: action.payload.data.schemeType,
includeUnsure: action.payload.data.includeUnsure,
includeCoffee: action.payload.data.includeCoffee
```

### Action Creator (completed in Phase 2)

`createGame()` in `actions/index.js` currently hardcodes scheme params:
```js
axios.post(`${API_ROOT_URL}/createSession`, {
  userName: playerName,
  schemeType: 'fibonacci',
  customValues: null,
  includeUnsure: true,
  includeCoffee: true
});
```

This needs to accept scheme params from the CreateGame form.

## Files to Modify

### 1. CreateGame.jsx (major changes)
- Currently: Simple form with NameInput + Submit button inside MUI Card
- Needs: ToggleButtonGroup for scheme presets, conditional TextField for custom values, two Switch toggles for meta-cards
- Pattern: Uses `useState` for local form state, dispatches `createGame()` on submit
- Card maxWidth is 400 - may need widening slightly for scheme controls

### 2. actions/index.js (minor change)
- `createGame(playerName, callback)` signature needs scheme params: `createGame(playerName, schemeType, customValues, includeUnsure, includeCoffee, callback)`
- Replace hardcoded `schemeType: 'fibonacci'` with passed params

### 3. Vote.jsx (minor change)
- Line 59: `const allValues = [...LEGAL_ESTIMATES, COFFEE_SYMBOL]` 
- Replace with: `const allValues = useSelector(state => state.game.legalEstimates)`
- Remove `LEGAL_ESTIMATES` and `COFFEE_SYMBOL` imports from Constants.js

### 4. ResultsChart.jsx (minor change)
- Line 21: `LEGAL_ESTIMATES.map(x => estimates.filter(y => y === x).length)` - replace with dynamic labels
- Line 51: `labels: LEGAL_ESTIMATES` - replace with dynamic labels
- Source: `useSelector(state => state.game.legalEstimates)` for labels
- Remove Constants.js import

## MUI Components Research

### ToggleButtonGroup
- Import: `@mui/material/ToggleButtonGroup` + `@mui/material/ToggleButton`
- Props: `value`, `onChange`, `exclusive`, `fullWidth`, `size`, `color`
- Styled by theme automatically in dark/light mode
- Already available in MUI v5.15 (project dependency)

### Switch + FormControlLabel
- Import: `@mui/material/Switch` + `@mui/material/FormControlLabel`
- Props: `checked`, `onChange`, `label`
- Compact form with label - good for boolean toggles

### TextField for custom values
- Already used in JoinGame.jsx pattern - same variant/size
- `helperText` prop for inline validation messages
- `error` prop for red border on validation failure

## Validation Strategy

### Client-side (CreateGame form)
- Custom values: parse comma-separated, trim, check count (2-20), check max length (10), check duplicates
- Show inline errors via TextField `helperText` + `error` prop
- Validation runs `onChange` (not just on submit) per CONTEXT.md D-05
- Disable submit button if custom scheme is selected and validation fails

### Server-side (already implemented)
- `SchemeType.parseAndValidateCustom()` validates the same rules
- Returns 400 with descriptive error messages
- Frontend catches in `createGame()` error handler

## Integration Notes

1. **Scheme type values for API**: Use lowercase strings matching backend expectations: `'fibonacci'`, `'tshirt'`, `'simple'`, `'custom'`
2. **Custom values format**: Comma-separated string, same as `SchemeType.parseAndValidateCustom()` expects
3. **Meta-card defaults**: Both on (`true`) by default, matching `initialGameState` in reducer
4. **No Constants.js cleanup needed**: `LEGAL_ESTIMATES` and `COFFEE_SYMBOL` may still be used by Playwright e2e tests - keep exports, just stop using them in Vote.jsx and ResultsChart.jsx

## Risk Assessment

- **Low risk**: All backend and Redux wiring is complete. This phase is purely UI component work.
- **No backward compat concern**: Default scheme is Fibonacci with both meta-cards on, matching current behavior exactly.
- **Chart label alignment**: ResultsChart aggregation must use the same `legalEstimates` array from Redux that the vote cards use, ensuring labels match cast values.

---

## RESEARCH COMPLETE

*Phase: 03-frontend-ui*
*Research completed: 2026-04-04*
