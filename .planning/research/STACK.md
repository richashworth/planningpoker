# Technology Stack: Estimation Schemes Milestone

**Project:** Planning Poker — Estimation Schemes
**Researched:** 2026-04-04
**Scope:** Additive changes only. The core stack (Spring Boot 3.4, React 18, MUI v5, Redux 4) is fixed. This document covers what to use within that stack for the new feature surface.

---

## No New Dependencies Required

Every capability needed for estimation scheme selection already exists in the installed dependency set. The constraint "no new frameworks" from PROJECT.md is not just acceptable — it is the correct call. Adding libraries for a form with four radio buttons and a text field would be over-engineering.

**Confidence: HIGH** — verified against `package.json` and `build.gradle`.

---

## Backend: Component Decisions

### Java Record for SchemeConfig (not Lombok @Data)

**Use:** `public record SchemeConfig(String schemeType, List<String> customValues, boolean includeUnsure, boolean includeCoffee) {}`

**Why:** Java 21 records give immutability and structural equality without annotation processing. Lombok `@Data` is already in the project for `Estimate`, but records are the right tool for a value object that will be serialized directly to JSON. Spring Boot 3.4's Jackson integration serializes records correctly without any configuration. No new dependency needed.

**Do not use:** A plain class with Lombok. Records communicate immutability intent more clearly and are idiomatic for DTOs in Java 21.

**Confidence: HIGH** — Spring Boot 3.4 ships Jackson 2.17.x which has first-class record support.

### SchemeType enum (not string constants)

**Use:** A Java `enum SchemeType { FIBONACCI, TSHIRT, SIMPLE, CUSTOM }` in the model package.

**Why:** The codebase currently uses `Set.of(...)` string constants for validation in `VoteController`. Replacing that pattern with an enum provides compile-time safety, exhaustive switch coverage, and a clean `fromString()` factory for parsing the incoming `schemeType` request parameter. Enum `name()` round-trips cleanly to/from the lowercase strings the frontend sends (with a simple `toLowerCase()` / `toUpperCase()` conversion).

**Do not use:** A `Map<String, List<String>>` of string keys. String keys push validation downstream and make the preset-to-values mapping implicit.

**Confidence: HIGH** — standard Java pattern, no library involvement.

### SessionManager state additions (ConcurrentHashMap, not new data structure)

**Use:** Two `ConcurrentHashMap<String, ...>` fields added to `SessionManager`:
- `ConcurrentHashMap<String, List<String>> sessionSchemes` — resolved legal vote values per session
- `ConcurrentHashMap<String, SchemeConfig> sessionSchemeConfigs` — scheme metadata per session (for join responses)

**Why:** The existing `SessionManager` already uses `ConcurrentHashMap<String, Instant>` for `lastActivity`. This is the established pattern in the class. The synchronized Guava `ListMultimap` is used for collections with multiple values per key; single-value-per-key maps use `ConcurrentHashMap`. Follow the existing pattern.

**Do not use:** Guava `HashMultimap` or any new collection type — the data model is one scheme config per session, which is exactly what a map handles.

The existing `clearSessions()` / `evictIdleSessions()` methods must be extended to clear the two new maps. This is straightforward and follows the existing pattern in those methods.

**Confidence: HIGH** — direct extension of existing code.

### JSON response from createSession / joinSession

**Use:** Return the `SchemeConfig` record (or a thin wrapper that also includes `sessionId`) directly from the controller method. Spring Boot's `@RestController` + Jackson handles serialization.

**Current state:** `createSession` returns `String` (the session ID). This must change to a JSON object. The design spec calls this out explicitly.

**Do not use:** `ResponseEntity<Map<String, Object>>` — returning a typed record is cleaner and more testable. The record fields become JSON keys via Jackson's default naming strategy (camelCase).

**Confidence: HIGH** — Jackson record serialization is standard Spring Boot 3.4 behavior.

### Validation location

**Use:** Validate `schemeType` and `customValues` in `GameController.createSession()`, before delegating to `SessionManager`. Follow the existing pattern where `GameController` validates inputs (username length, character set) before calling the service.

**Do not use:** Bean Validation (`@Valid`, `@NotBlank`, etc.) — the project uses manual validation throughout. Introducing javax/jakarta validation annotations for a single new endpoint would be inconsistent and would add complexity without benefit at this scale.

**Confidence: HIGH** — consistent with existing `validateUserName()` pattern.

---

## Frontend: Component Decisions

### Scheme selector: MUI ToggleButtonGroup (not RadioGroup, not Select)

**Use:** `ToggleButtonGroup` from `@mui/material` with `exclusive` prop, one `ToggleButton` per preset plus Custom.

**Why:** The vote card grid already uses a visually similar pattern — styled `Box` components acting as toggle buttons. `ToggleButtonGroup` is the semantic MUI equivalent for scheme selection: it gives clear visual state (selected vs not), keyboard navigation, and aria attributes for free. The four options (Fibonacci, T-shirt, Simple, Custom) fit comfortably in a single row on desktop and wrap gracefully on mobile. `RadioGroup` works but is visually heavy for this context — it implies form-filling rather than picking a card type. `Select` (dropdown) hides the options, which slows down first-time users who don't know what schemes exist.

**Do not use:** A `Select` dropdown. The four options are the primary decision on the create-game form — they should be visible, not hidden behind a click.

**Confidence: HIGH** — `ToggleButtonGroup` is in the installed `@mui/material` ^5.15.0, no new dependency.

### Custom values input: MUI TextField with helperText (not a chip input library)

**Use:** A single `TextField` with `multiline={false}`, `placeholder="e.g. Low, Med, High"`, `helperText` showing the constraint summary, and inline error state via `error` + `helperText` toggling.

**Why:** Custom values are comma-separated. A plain text field is the lowest-friction UI for this: the host types values, sees validation feedback inline. The constraint is simple enough (2-20 values, max 10 chars each, no dupes) to express in a helper text string. Chip input libraries (react-tag-input, MUI Autocomplete in freeSolo mode) add interaction overhead and a new dependency for a feature that is used once per session creation.

The field should only render when `schemeType === 'custom'` (controlled by component state). When hidden, its value should reset to `''` so stale custom values do not submit with a preset scheme.

**Do not use:** `@mui/lab` chip input or any third-party tag library. The comma-separated text field approach matches the API parameter format directly and avoids an extra parsing step.

**Confidence: HIGH** — TextField is core MUI, no new dependency.

### Meta-card toggles: MUI Switch (not Checkbox)

**Use:** Two `Switch` components with `FormControlLabel`, labeled "Include ? card" and "Include coffee break card", defaulting to `checked={true}`.

**Why:** `Switch` communicates a binary on/off state better than `Checkbox` for feature toggles. The MUI `Switch` component is already in the installed package. The existing dark/light theme toggle in `Header.jsx` uses the same pattern — this is consistent.

**Confidence: HIGH** — Switch is in installed `@mui/material` ^5.15.0.

### State: Redux game reducer extension (no new reducer)

**Use:** Extend `reducer_game.js` to include scheme fields in its initial state and populate them from `CREATE_GAME` and `JOIN_GAME` action payloads.

New initial state shape:
```js
const initialGameState = {
  playerName: '',
  sessionId: '',
  isAdmin: false,
  isRegistered: false,
  schemeType: 'fibonacci',
  customValues: null,
  includeUnsure: true,
  includeCoffee: true,
};
```

**Why:** Scheme data is session-scoped, not feature-scoped. It belongs in the game reducer alongside `sessionId` and `isAdmin`. A separate `schemeReducer` would be premature decomposition for four fields.

The `CREATE_GAME` case currently reads `action.payload.data` as a plain string (the session ID). After the API change it becomes a JSON object. The reducer must read `action.payload.data.sessionId` for the session ID and additionally extract scheme fields. This is the one place where the API change has a breaking effect on existing frontend code.

**Confidence: HIGH** — direct extension of existing reducer pattern.

### Scheme definitions: new config/Schemes.js (not inline in component)

**Use:** A new `src/config/Schemes.js` module exporting a `SCHEMES` constant map from scheme key to `{ label, values }`. This is the authoritative source for preset values on the frontend.

**Why:** The scheme-to-values mapping is needed in two places: `CreateGame.jsx` (to populate the selector UI) and `Vote.jsx` (to resolve the active scheme to card values). Defining it once in a config module prevents duplication and makes it easy to add or modify schemes in future. The design spec already specifies this module exactly.

`LEGAL_ESTIMATES` in `Constants.js` becomes dead code once `Schemes.js` is in place and should be deleted. `COFFEE_SYMBOL` stays; add `UNSURE_SYMBOL = '?'` alongside it.

**Confidence: HIGH** — no library involvement, pure JS module.

### Action changes: URLSearchParams extension (not a new HTTP client)

**Use:** Extend `createGame` and `joinGame` in `actions/index.js` to include scheme params in the existing `URLSearchParams` POST body. Parse the JSON response with `action.payload.data` (axios parses JSON automatically when the `Content-Type` response header is `application/json`).

The `createGame` action currently passes `payload: request` to redux-promise. Redux-promise resolves the promise and puts `{ data: ... }` on `action.payload`. After the API returns JSON, `action.payload.data` will be the parsed JSON object — no change to the action dispatch mechanism is needed.

**Do not use:** A new axios instance, interceptors, or RTK Query. The project uses plain axios with URLSearchParams throughout. Stay consistent.

**Confidence: HIGH** — axios 1.7.x parses JSON responses automatically, existing redux-promise pattern handles it.

---

## Testing: No New Test Libraries

### Backend: JUnit 5 + Mockito (already present)

New tests follow the `AbstractControllerTest` pattern already established:
- `GameControllerTest` — extend to cover scheme params, JSON response shape, validation rejection cases
- New `SessionManagerTest` cases — scheme storage, retrieval, custom value validation
- New `VoteControllerTest` cases — per-session vote validation against stored scheme

**Confidence: HIGH** — no new test dependencies needed.

### Frontend: Vitest (already present)

New tests follow the pattern in `reducer_game.test.js`:
- Extend `reducer_game.test.js` for scheme fields on CREATE_GAME and JOIN_GAME
- Add `Schemes.test.js` for scheme resolution logic (correct values per type + toggle combinations)

**Confidence: HIGH** — Vitest 4.1.2 is installed.

### E2E: Playwright (already present)

New e2e tests follow existing patterns in `planningpoker-web/playwright.config.*`. No new tooling needed.

**Confidence: HIGH** — Playwright 1.59.1 is installed.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Scheme selector UI | MUI ToggleButtonGroup | RadioGroup | Visually lighter, aligns with card-picking metaphor already in the UI |
| Scheme selector UI | MUI ToggleButtonGroup | Select dropdown | Hides options; slows first-time host |
| Custom values input | TextField (comma-separated) | Chip input (freeSolo Autocomplete) | Adds dependency, adds interaction complexity, same functional result |
| SchemeConfig model | Java record | Lombok @Data class | Records are idiomatic for immutable DTOs in Java 21; no annotation processing needed |
| Validation | Manual in controller | Jakarta Bean Validation (@Valid) | Inconsistent with existing codebase; over-engineered for this scale |
| Scheme state | Extend reducer_game | New scheme reducer | Scheme is session-scoped data; belongs alongside sessionId in game reducer |

---

## Summary of Version-Pinned Dependencies

All of these are already installed. Zero new packages.

| Package | Current Version | Used For |
|---------|----------------|---------|
| `@mui/material` | ^5.15.0 | ToggleButtonGroup, Switch, TextField, FormControlLabel |
| `react` | ^18.2.0 | Component state, hooks |
| `react-redux` | ^8.1.0 | useSelector for scheme state in Vote.jsx |
| `redux` | ^4.2.1 | Reducer extension |
| `axios` | ^1.7.0 | Scheme params in POST body, JSON response parsing |
| `redux-promise` | ^0.6.0 | Existing action resolution pattern (unchanged) |
| `vitest` | ^4.1.2 | Frontend unit tests |
| `@playwright/test` | ^1.59.1 | E2E tests |
| Spring Boot | 3.4.4 | Jackson JSON serialization of records |
| Lombok | 1.18.36 | Existing use only (Estimate model); SchemeConfig uses records |
| JUnit 5 | 5.11.4 | Backend unit tests |
| Mockito | 5.15.2 | Controller/service mocking |

---

## Sources

- `planningpoker-web/package.json` — installed frontend dependency versions (HIGH confidence)
- `planningpoker-api/build.gradle` — installed backend dependency versions (HIGH confidence)
- `docs/superpowers/specs/2026-04-04-estimation-schemes-design.md` — design spec (HIGH confidence, project-internal)
- `.planning/PROJECT.md` — constraints and requirements (HIGH confidence, project-internal)
- Spring Boot 3.4 release notes confirm Jackson 2.17.x with full record support (HIGH confidence)
- MUI v5 docs — ToggleButtonGroup, Switch components available in ^5.15.0 (HIGH confidence)
