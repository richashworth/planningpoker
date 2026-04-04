# Coding Conventions

**Analysis Date:** 2026-04-04

## Naming Patterns

**Files:**
- React components: PascalCase `.jsx` (e.g., `PlayGame.jsx`, `GamePane.jsx`, `NameInput.jsx`)
- Hooks: camelCase prefixed with `use`, `.js` extension (e.g., `useStomp.js`)
- Redux reducers: `reducer_<domain>.js` snake_case (e.g., `reducer_game.js`, `reducer_results.js`)
- Redux action index: `actions/index.js` (single barrel file)
- Config: `Constants.js` PascalCase
- Theme: `theme.js` lowercase
- Java classes: PascalCase matching Spring conventions (e.g., `GameController`, `SessionManager`, `MessagingUtils`)
- Java test classes: `<ClassName>Test` suffix (e.g., `GameControllerTest`)
- Java packages: lowercase, domain-structured (`com.richashworth.planningpoker.controller`)

**Functions/Methods:**
- Frontend: camelCase for handlers prefixed by verb (e.g., `handleSubmit`, `handleLogout`, `handleCopy`, `handleThemeToggle`)
- Action creators: camelCase verbs (e.g., `createGame`, `joinGame`, `leaveGame`, `resultsUpdated`)
- Java methods: camelCase verbs (e.g., `createSession`, `registerUser`, `isSessionActive`, `validateUserName`)
- Java test methods: `test<MethodName>` prefix (e.g., `testJoinSession`, `testCreateSession`)

**Variables:**
- Frontend: camelCase throughout
- Redux action type constants: `UPPER_SNAKE_CASE` strings (e.g., `'create-game'`, but constant names are `CREATE_GAME`)
- Java: camelCase for locals/fields; `UPPER_SNAKE_CASE` for static constants (e.g., `MAX_USERNAME_LENGTH`, `USERNAME_PATTERN`)

**Types/Interfaces:**
- No TypeScript — project is plain JavaScript (.jsx/.js) for frontend
- Java uses standard class/interface naming

## Code Style

**Formatting:**
- No Prettier or ESLint config files detected in the repo
- `eslint-disable-next-line` comments used inline where needed (e.g., `// eslint-disable-next-line no-underscore-dangle` in `src/App.jsx`)
- Java style follows standard IntelliJ/Google conventions; `.idea/codeStyles` directory present

**Indentation:**
- Frontend: 2 spaces (observed throughout all .jsx/.js files)
- Java: 4 spaces

**Quotes:**
- Frontend: single quotes for imports and strings; template literals for interpolation
- JSX attributes use double quotes

**Semicolons:**
- Frontend: omitted (no semicolons at end of statements in .jsx files)

## Import Organization

**Frontend order (observed pattern):**
1. React and React hooks (`import React, { useState, ... } from 'react'`)
2. Third-party libraries (`react-redux`, `react-router-dom`, `@mui/material`, `axios`)
3. Local actions (`../actions`)
4. Local components/containers (`../components/...`, `../containers/...`)
5. Local hooks (`../hooks/...`)
6. Local config (`../config/Constants`)

**Path Aliases:**
- None — all imports use relative paths (`../`, `./`)

**Java import order:**
- Project classes first, then third-party (Guava, SLF4J), then JDK classes

## React Component Patterns

**Component type:** All functional components with hooks — no class components.

**Export style:** `export default function ComponentName()` — named function expressions, always default export.

**Props:** Destructured inline in function signature where props are simple; passed as object otherwise.

**State management split:**
- Global state: Redux (`useSelector`/`useDispatch`) for session, game state, results, users, voted flag
- Local state: `useState` for UI-only state (form inputs, menu anchor, copied flag, selected card)

**MUI usage:**
- Layout via `Box` with `sx` prop — inline style system, not CSS files or `makeStyles`
- No separate style files; all styles in `sx` prop or `theme.js`
- Component variants: `variant="contained"` for primary, `variant="outlined"` for secondary buttons
- Theme customization centralized in `src/theme.js` — shared config object spread into dark/light variants

**Conditional rendering:** Ternary expressions inline in JSX (e.g., `{voted ? <Results /> : <Vote />}`)

## Redux Patterns

**Action shape:**
- All actions: `{ type, payload, meta }` — redux-promise middleware resolves promise payloads
- Event actions (no async): `{ type }` only (e.g., `gameCreated()`, `userRegistered()`)
- Async actions: payload is an axios Promise; `meta` carries local data not in the response

**Reducer pattern:** `switch` on `action.type`, spreading state for updates, returning `initialState` constant on reset.

**Optimistic updates:** Reducers handle `VOTE` and `RESET_SESSION` optimistically before server confirmation (e.g., `reducer_results.js` adds vote immediately; clears on reset).

## Error Handling

**Frontend:**
- HTTP errors in action creators: `err.response?.data?.error || 'Fallback message'` then `alert(msg)` for user-facing errors
- Non-critical errors logged with `console.error` (e.g., leave session failure)
- No global error boundary

**Backend:**
- Domain validation throws `IllegalArgumentException` with descriptive messages
- `ErrorHandler.java` (`@ControllerAdvice`) catches:
  - `IllegalArgumentException` → 400 Bad Request with `{ "error": "<message>" }`
  - All other `Exception` → 500 with `{ "error": "Internal server error" }`
- Controllers do not catch exceptions — they propagate to `ErrorHandler`
- SLF4J + Logback used for all server-side logging; `logger.info(...)` for business events, `logger.error(...)` for unexpected errors

## Logging

**Frontend:** `console.error` only for non-critical failures; no structured logging library.

**Backend:** SLF4J `Logger` obtained via `LoggerFactory.getLogger(getClass())` as a non-static field; `logger.info(pattern, args)` with parameterized messages (e.g., `"{} has joined session {}"`)

## Comments

**When to comment:**
- Inline explanatory comments for non-obvious logic (e.g., `// Fallback: if we voted but no WS results arrive within 8s...`)
- `eslint-disable` inline comments when rule suppression is required
- Commented-out code left in place for configuration alternatives (e.g., `// export const API_ROOT_URL = 'http://localhost:9000'`)

**JSDoc/TSDoc:** Not used — no doc comments on functions or classes.

## Function Design

**Size:** Functions kept small; helper functions extracted for reuse (e.g., `cardSx()` in `Vote.jsx`, `validateUserName()` and `validateSessionMembership()` in `GameController.java`)

**Parameters:** Frontend uses object destructuring for props; Java uses `@RequestParam` annotations with explicit `name` attribute

**Return values:** Reducers always return state (never `undefined`); action creators return plain objects or dispatch calls

## Module Design

**Frontend exports:** Single default export per file for components and hooks; named exports for action creators and action type constants from `actions/index.js`

**Barrel files:** `actions/index.js` is the single barrel for all actions; `reducers/index.js` combines reducers; `hooks/index.js` re-exports hooks

**Java:** One class per file; Spring annotations drive component registration — no factory classes

---

*Convention analysis: 2026-04-04*
