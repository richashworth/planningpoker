# Customizable Estimation Schemes

## Context

Planning poker currently supports only Fibonacci-style estimates, hardcoded in both the frontend (`Constants.js`) and backend (`VoteController.java`). Teams using T-shirt sizes or other scales have no option. This feature lets the host choose an estimation scheme when creating a game, including a fully custom option.

## Scheme Definitions

| Scheme key | Display name | Values |
|------------|-------------|--------|
| `fibonacci` | Fibonacci (default) | 0, 0.5, 1, 2, 3, 5, 8, 13, 20, 50, 100, ∞ |
| `tshirt` | T-shirt sizes | XS, S, M, L, XL, XXL |
| `simple` | Simple (1-5) | 1, 2, 3, 4, 5 |
| `custom` | Custom | Host-defined, 2-20 values, max 10 chars each, no duplicates |

Two meta-option toggles (default: on) apply to all schemes:
- **? card** — "unsure"
- **Coffee card** — "need a break"

The scheme is locked for the session duration — it cannot be changed between rounds.

## API Changes

### POST /createSession

New parameters alongside existing `userName`:

| Parameter | Type | Required | Notes |
|-----------|------|----------|-------|
| `schemeType` | string | No (default: `fibonacci`) | One of: `fibonacci`, `tshirt`, `simple`, `custom` |
| `customValues` | string | Only when `schemeType=custom` | Comma-separated values |
| `includeUnsure` | boolean | No (default: `true`) | Append ? to the scheme |
| `includeCoffee` | boolean | No (default: `true`) | Append coffee symbol to the scheme |

Response changes from returning a plain `sessionId` string to returning JSON:

```json
{
  "sessionId": "abc12345",
  "schemeType": "fibonacci",
  "includeUnsure": true,
  "includeCoffee": true
}
```

For `custom` schemes, response also includes `"customValues": ["Low", "Med", "High"]`.

### POST /joinSession

Response changes from void to returning the same scheme info:

```json
{
  "schemeType": "tshirt",
  "includeUnsure": true,
  "includeCoffee": false
}
```

For `custom`, also includes `"customValues": [...]`.

### POST /vote

No parameter changes. Server validates the submitted `estimateValue` against the session's stored legal values (resolved from scheme + toggles) instead of the hardcoded set.

### GET /refresh

No changes — scheme info is delivered on create/join and stored in Redux. The WebSocket topics continue to push results/users only.

## Backend Changes

### SessionManager

- Add `Map<String, List<String>> sessionSchemes` — stores the resolved legal vote values per session ID
- Add `Map<String, SchemeConfig> sessionSchemeConfigs` — stores the scheme metadata (type, toggles, custom values) per session for returning to joiners
- `createSession()` accepts scheme parameters, resolves them to a values list, stores both
- `getSessionScheme(sessionId)` returns the legal values list (used by VoteController)
- `getSessionSchemeConfig(sessionId)` returns the config (used by GameController for join response)
- Scheme definitions (preset name -> values) live in a `SchemeType` enum or constants class, shared between creation and validation

### SchemeConfig (new model class)

```java
public record SchemeConfig(
    String schemeType,
    List<String> customValues,  // null for presets
    boolean includeUnsure,
    boolean includeCoffee
) {}
```

### GameController

- `createSession` — accept new params, validate `schemeType`, validate `customValues` if custom, delegate to SessionManager, return JSON response
- `joinSession` — change from void return to return `SchemeConfig` for the session

### VoteController

- Replace `private static final Set<String> LEGAL_ESTIMATES` with a per-session lookup: `sessionManager.getSessionScheme(sessionId)`

### Validation

- `schemeType` must be one of the four known values
- `customValues`: required when `schemeType=custom`, rejected otherwise
  - Split on comma, trim whitespace
  - 2-20 values after deduplication
  - Each value 1-10 characters
  - No empty strings after trimming

## Frontend Changes

### Shared scheme definitions

Create `config/Schemes.js`:

```js
export const SCHEMES = {
  fibonacci: { label: 'Fibonacci', values: ['0','0.5','1','2','3','5','8','13','20','50','100','∞'] },
  tshirt:    { label: 'T-shirt sizes', values: ['XS','S','M','L','XL','XXL'] },
  simple:    { label: 'Simple (1-5)', values: ['1','2','3','4','5'] },
};
```

Remove `LEGAL_ESTIMATES` from `Constants.js`. Keep `COFFEE_SYMBOL` and add `UNSURE_SYMBOL = '?'`.

### CreateGame.jsx

Below the name input, add:
1. **Scheme selector** — radio group or MUI ToggleButtonGroup with four options
2. **Custom values input** — shown only when Custom is selected. Text field with helper text showing constraints. Validate on change, show error state for invalid input.
3. **Two switches** — "Include ? card" and "Include coffee break card", both defaulting to on

On submit, dispatch `createGame` with scheme params. The action sends them to `POST /createSession`.

### Redux store (game reducer)

Add to game state:
- `schemeType: 'fibonacci'`
- `customValues: null`
- `includeUnsure: true`
- `includeCoffee: true`

Populated from `createSession` response (CREATE_GAME) and `joinSession` response (JOIN_GAME).

### Vote.jsx

Replace:
```js
const allValues = [...LEGAL_ESTIMATES, COFFEE_SYMBOL];
```

With scheme resolution from Redux state:
```js
const { schemeType, customValues, includeUnsure, includeCoffee } = useSelector(state => state.game);
const baseValues = schemeType === 'custom' ? customValues : SCHEMES[schemeType].values;
const allValues = [
  ...baseValues,
  ...(includeUnsure ? ['?'] : []),
  ...(includeCoffee ? [COFFEE_SYMBOL] : []),
];
```

### actions/index.js

- `createGame` — send scheme params in URLSearchParams, parse JSON response instead of plain text
- `joinGame` — parse JSON response to extract scheme config

### ResultsChart.jsx / ResultsTable.jsx

No changes needed — they work with whatever estimate values are in the results. The `parseInt` bug was already fixed (uses string keys).

## Testing

### Backend unit tests
- `GameControllerTest` — create session with each scheme type, verify JSON response
- `VoteControllerTest` — vote with valid/invalid values per scheme type
- `SessionManagerTest` — scheme storage and retrieval, custom value validation

### Frontend unit tests
- Game reducer — handles scheme fields from CREATE_GAME and JOIN_GAME payloads
- Scheme resolution logic — correct values for each type + toggle combinations

### E2e tests
- Host creates game with T-shirt scheme, sees XS/S/M/L/XL/XXL cards
- Host creates game with custom values, sees those cards
- Host toggles off ? card, card does not appear
- Joiner sees the same cards as the host
