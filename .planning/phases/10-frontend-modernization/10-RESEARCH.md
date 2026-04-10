# Phase 10: Frontend Modernization - Research

**Researched:** 2026-04-09
**Domain:** Redux store migration, dead code removal, React Suspense
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Install `@reduxjs/toolkit` and replace `createStore` + `applyMiddleware` + `compose` with `configureStore` in `App.jsx`
- **D-02:** Keep existing reducer structure (`combineReducers` in `reducers/index.js`) — no need to convert to `createSlice` in this phase
- **D-03:** `redux-promise` is already removed from the codebase (replaced with `redux-thunk`). Remove the `redux-promise` package from `package-lock.json` if it still appears as a transitive dependency
- **D-04:** Remove the `composeEnhancers` / `__REDUX_DEVTOOLS_EXTENSION_COMPOSE__` workaround — `configureStore` includes DevTools integration automatically
- **D-05:** The `/topic/items/${sessionId}` subscription does not exist anywhere in the current source code. Verify this is truly absent (not just in a different form) and document the finding. No code changes expected.
- **D-06:** A `Suspense` wrapper with `CircularProgress` fallback already exists in `App.jsx` (lines 52-65). Verify it renders correctly during lazy route loading. If it already works, document the finding — no code changes needed.

### Claude's Discretion
- Exact `configureStore` options (middleware array composition, devTools flag)
- Whether to add type-checking middleware in development mode (RTK includes it by default)
- Test adjustments needed after store migration

### Deferred Ideas (OUT OF SCOPE)
- "Host can label each voting round..." — Feature todo, not related to frontend modernization
- "Add date to copyright notice in footer" — Already addressed in prior commits
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CLN-01 | Dead WebSocket subscription to `/topic/items/${sessionId}` is removed from frontend | Confirmed absent — grep over entire repo returns zero matches in source code |
| CLN-03 | `redux-promise` middleware replaced and `createStore` migrated to Redux Toolkit's `configureStore` | Migration pattern documented; RTK 2.11.2 verified current; package absent from lockfile |
| UI-04 | Lazy-loaded routes show a visible loading indicator instead of blank screen (`Suspense fallback`) | `Suspense` + `CircularProgress` already implemented in `App.jsx` lines 52–65; verify behavior only |
</phase_requirements>

## Summary

This phase has three requirements. Two (CLN-01 and UI-04) are already satisfied by the current codebase — CLN-01 because the dead subscription was removed in an earlier cleanup, and UI-04 because `App.jsx` already wraps lazy routes in `Suspense` with a `CircularProgress` fallback. The only code change required is CLN-03: installing `@reduxjs/toolkit` and replacing the `createStore`/`applyMiddleware`/`compose`/`composeEnhancers` pattern with `configureStore`.

The migration is a single-file change to `App.jsx` (line 31). The existing `combineReducers` root reducer in `reducers/index.js` is passed directly to `configureStore({ reducer: rootReducer })` with no changes. RTK's `configureStore` includes `redux-thunk` middleware and Redux DevTools automatically, so the explicit `thunk` import, the `middleware` array, and the `composeEnhancers` workaround are all deleted. No component code changes are needed — `useSelector`/`useDispatch` are unaffected.

**Primary recommendation:** Install `@reduxjs/toolkit@^2.11.2`, replace lines 5-6 and 26-31 in `App.jsx` with a single `configureStore` call, then document the CLN-01 and UI-04 verification results.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @reduxjs/toolkit | 2.11.2 [VERIFIED: npm registry] | `configureStore`, opinionated Redux setup | Official Redux team library; replaces manual `createStore` boilerplate |
| redux | 4.2.1 [VERIFIED: package-lock.json] | `combineReducers` in `reducers/index.js` | Already installed; RTK bundles its own redux 5.x internally but `redux` 4.x still valid for `combineReducers` import |
| react-redux | 8.1.0 [VERIFIED: package.json] | `Provider`, `useSelector`, `useDispatch` | Already installed; unchanged by migration |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| redux-thunk | 2.4.2 [VERIFIED: package-lock.json] | Async action middleware | Currently installed; RTK bundles thunk 3.x internally — the direct dep becomes redundant after migration but can be retained |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| configureStore only | Full RTK slice migration | Out of scope per D-02; would require rewriting all reducers and action creators |
| Keep redux-thunk dep | Remove redux-thunk from package.json | RTK bundles its own thunk; removing the direct dep is safe but not required |

**Installation:**
```bash
cd planningpoker-web && npm install @reduxjs/toolkit
```

**Version verification:** `npm view @reduxjs/toolkit version` returns `2.11.2` [VERIFIED: npm registry, 2026-04-09].

## Architecture Patterns

### Existing Project Structure (unchanged)
```
planningpoker-web/src/
├── App.jsx              # Store creation — THE only file changing for CLN-03
├── reducers/
│   ├── index.js         # combineReducers — unchanged
│   ├── reducer_game.js
│   ├── reducer_results.js
│   ├── reducer_users.js
│   ├── reducer_vote.js
│   ├── reducer_notification.js
│   └── reducer_rounds.js
├── actions/index.js     # Thunk action creators — unchanged
└── hooks/useStomp.js    # WebSocket hook — unchanged (no /topic/items sub present)
```

### Pattern 1: configureStore Migration

**What:** Replace the legacy `createStore` + `applyMiddleware` + DevTools compose pattern with RTK's `configureStore`.

**When to use:** Any Redux store using `createStore` — this is the standard migration path per Redux team guidance.

**Before (App.jsx lines 5-6, 26-31):**
```javascript
// Source: current planningpoker-web/src/App.jsx
import { applyMiddleware, compose, createStore } from 'redux'
import thunk from 'redux-thunk'

const middleware = [thunk]
// eslint-disable-next-line no-underscore-dangle
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
const store = createStore(reducer, composeEnhancers(applyMiddleware(...middleware)))
```

**After:**
```javascript
// Source: Redux Toolkit configureStore API [ASSUMED — standard RTK pattern]
import { configureStore } from '@reduxjs/toolkit'

const store = configureStore({ reducer })
```

**What configureStore provides automatically:**
- `redux-thunk` middleware (RTK bundles thunk 3.x) [VERIFIED: npm view @reduxjs/toolkit dependencies]
- Redux DevTools Extension integration (replaces `composeEnhancers`) [ASSUMED — standard RTK behavior]
- `serializability` and `immutability` check middleware in development [ASSUMED — standard RTK behavior]

**Import cleanup in App.jsx:**
- Remove: `import { applyMiddleware, compose, createStore } from 'redux'`
- Remove: `import thunk from 'redux-thunk'`
- Remove: `const middleware = [thunk]`
- Remove: `const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose`
- Remove: eslint-disable comment on the composeEnhancers line
- Add: `import { configureStore } from '@reduxjs/toolkit'`
- Replace: store creation with `const store = configureStore({ reducer })`

### Pattern 2: Suspense Fallback Verification (UI-04)

**What:** Confirm the existing `Suspense` wrapper in `App.jsx` renders correctly.

**Current implementation (App.jsx lines 52-65):**
```jsx
// Source: planningpoker-web/src/App.jsx [VERIFIED: file read]
<Suspense
  fallback={
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <CircularProgress />
    </Box>
  }
>
  <Routes>
    <Route path="/host" element={<CreateGame />} />
    <Route path="/join" element={<JoinGame />} />
    <Route path="/game" element={<PlayGame />} />
    <Route path="/" element={<Welcome />} />
  </Routes>
</Suspense>
```

All four routes are `lazy()`-loaded and wrapped in this `Suspense`. The fallback is a centered `CircularProgress`. This satisfies UI-04 as written. No code changes needed — the task is verification only.

### Pattern 3: Dead Subscription Verification (CLN-01)

**What:** Confirm `/topic/items/${sessionId}` subscription is absent.

**Verification result:** Grep over the entire repository (`/Users/richard/Projects/planningpoker`) for `topic/items` returns zero matches in any source file [VERIFIED: grep run 2026-04-09]. The only occurrences are in planning documents and discussion logs. The `useStomp.js` hook is generic — it subscribes to whatever `topics` array is passed to it. No caller passes `/topic/items/`.

No code changes needed.

### Anti-Patterns to Avoid

- **Passing thunk explicitly to configureStore:** RTK's `configureStore` includes `getDefaultMiddleware()` which includes thunk. Passing thunk again doubles it. Correct form: `configureStore({ reducer })` with no `middleware` key unless customizing.
- **Converting reducers to createSlice in this phase:** D-02 locks reducer structure unchanged. Slices are a separate future migration.
- **Importing `combineReducers` from `@reduxjs/toolkit` instead of `redux`:** The current import in `reducers/index.js` (`from 'redux'`) works fine and need not be changed — RTK is an enhancement to redux, not a replacement for it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Redux DevTools integration | `window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__` workaround | RTK `configureStore` | Built-in; handles all environments and versions |
| Development state mutation checks | Custom middleware | RTK `configureStore` default middleware | RTK includes `serializableCheck` and `immutableCheck` middleware automatically |
| Thunk middleware wiring | `applyMiddleware(thunk)` | RTK `configureStore` | Thunk included in default middleware stack |

**Key insight:** The entire `composeEnhancers` pattern exists solely to work around the manual DevTools wiring that `createStore` requires. `configureStore` eliminates this entirely.

## Common Pitfalls

### Pitfall 1: RTK Bundles Redux 5, Project Uses Redux 4
**What goes wrong:** RTK 2.x bundles `redux ^5.0.1` as its own dependency (not peer dep). The project's direct `redux ^4.2.1` dependency is a separate install. After adding RTK, two versions of `redux` may coexist in `node_modules` — one at 4.x consumed by the `combineReducers` import in `reducers/index.js`, one at 5.x bundled inside RTK.
**Why it happens:** npm resolution installs the bundled copy separately under RTK's own node_modules if the version ranges don't overlap (4.x vs 5.x).
**How to avoid:** The `combineReducers` import in `reducers/index.js` can remain `from 'redux'` — it resolves to the project's 4.x install, which is compatible. The store itself uses RTK's internal 5.x copy via `configureStore`. No functional conflict exists because `combineReducers` API is identical between v4 and v5. [ASSUMED — based on Redux API stability guarantee]
**Warning signs:** `npm install` output showing duplicate redux versions is expected and harmless here.

### Pitfall 2: redux-thunk v2 Default Import Becomes Dead Code
**What goes wrong:** The `import thunk from 'redux-thunk'` (default import, v2 API) becomes unused after migration. ESLint will flag it as an unused import.
**Why it happens:** RTK's `configureStore` includes its own bundled thunk v3 — the explicit `thunk` import is no longer wired in.
**How to avoid:** Delete the `import thunk from 'redux-thunk'` line and the `const middleware = [thunk]` line entirely during migration.
**Warning signs:** ESLint `no-unused-vars` error on `thunk` after replacing `createStore`.

### Pitfall 3: vite.config.js manualChunks References redux-thunk
**What goes wrong:** `vite.config.js` has a `redux` chunk: `redux: ['redux', 'react-redux', 'redux-thunk']`. After migration, `redux-thunk` is no longer directly imported by source code — it's an internal RTK dep. Vite may warn or produce an empty reference.
**Why it happens:** Manual chunk splitting by import entry point — if nothing imports `redux-thunk` directly, the chunk reference is stale.
**How to avoid:** Update the `redux` manualChunks entry to `['redux', 'react-redux', '@reduxjs/toolkit']` and remove `redux-thunk`. [ASSUMED — based on Vite chunk splitting behavior]
**Warning signs:** Vite build warning about empty chunk or unresolved entry.

### Pitfall 4: RTK Serializable Check Middleware Warns on Existing Actions
**What goes wrong:** RTK's default middleware includes a serializable check. Existing action payloads that contain non-serializable values (Promises, class instances, functions) will trigger console warnings in development after migration.
**Why it happens:** `createStore` had no such check; `configureStore` adds it automatically.
**How to avoid:** Inspect action payloads. The current codebase uses thunk action creators that dispatch plain objects with `{ type, payload, meta }` — payloads are plain data or axios responses. This should be clean, but verify by running the dev server after migration and checking the console.
**Warning signs:** `A non-serializable value was detected in the state` in browser console after first dispatch.

## Code Examples

### Minimal configureStore Migration

```javascript
// Source: Redux Toolkit docs pattern [ASSUMED — standard RTK usage]
// planningpoker-web/src/App.jsx — final state after migration

import { configureStore } from '@reduxjs/toolkit'
import reducer from './reducers'

const store = configureStore({ reducer })
```

The entire block that previously read:
```javascript
import { applyMiddleware, compose, createStore } from 'redux'
import thunk from 'redux-thunk'
const middleware = [thunk]
// eslint-disable-next-line no-underscore-dangle
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
const store = createStore(reducer, composeEnhancers(applyMiddleware(...middleware)))
```
...is replaced by those three lines.

### configureStore with Custom Middleware (if needed)
```javascript
// Source: [ASSUMED — standard RTK pattern for middleware customization]
// Only needed if RTK's default middleware needs extending
const store = configureStore({
  reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(myCustomMiddleware),
})
```
Not needed for this phase — no custom middleware exists beyond thunk.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `createStore` + `applyMiddleware` | `configureStore` | Redux Toolkit 1.x (~2020), widely adopted by 2022 | Removes boilerplate, adds DevTools + thunk automatically |
| Manual `__REDUX_DEVTOOLS_EXTENSION_COMPOSE__` | Built-in to `configureStore` | Redux Toolkit 1.x | No manual browser extension detection needed |
| `redux-promise` middleware | `redux-thunk` | Already migrated in this codebase | Thunks give full async control; promise middleware is limited |

**Deprecated/outdated:**
- `createStore`: Redux team added a visual deprecation notice in Redux 4.2+ (the function still works but emits a console warning in some build tools) [ASSUMED]
- `applyMiddleware` + `compose` as standalone store enhancer pattern: superseded by `configureStore`'s `middleware` option

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `configureStore` includes Redux DevTools integration automatically | Architecture Patterns | Low — would mean DevTools don't appear in browser; easy to verify post-migration |
| A2 | RTK default middleware includes `serializableCheck` and `immutableCheck` in development | Architecture Patterns / Pitfall 4 | Low — worst case is no warnings, not a bug |
| A3 | Two coexisting redux versions (4.x direct, 5.x via RTK) cause no functional conflict for `combineReducers` | Pitfall 1 | Low — `combineReducers` API is identical; if wrong, fix is to update `reducers/index.js` to import from `@reduxjs/toolkit` |
| A4 | vite.config.js manualChunks `redux-thunk` entry will produce a stale reference warning after migration | Pitfall 3 | Low — worst case is a Vite build warning, not a build failure |

## Open Questions

1. **redux direct dependency after migration**
   - What we know: RTK bundles redux 5.x internally; project has redux 4.x as direct dep used by `combineReducers` in `reducers/index.js`
   - What's unclear: Whether to update `package.json` to drop `redux` as a direct dep (since RTK re-exports `combineReducers`) or leave it
   - Recommendation: Leave `redux` as a direct dep and `combineReducers` import unchanged (D-02 locks reducer structure). If the planner wants to clean it up, the import can switch to `from '@reduxjs/toolkit'` — but this is cosmetic and out of phase scope.

2. **redux-thunk direct dependency after migration**
   - What we know: Resolved to 2.4.2 in lockfile; used only in `App.jsx` which is being rewritten; RTK bundles 3.1.0 internally
   - What's unclear: Whether to remove the `redux-thunk` direct dep from `package.json` after migration
   - Recommendation: Remove `redux-thunk` from `package.json` since nothing in source will import it after migration. Adjust `vite.config.js` manualChunks accordingly.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified — this is a pure npm package migration and code change within the existing frontend stack)

## Security Domain

This phase involves no authentication, session management, input validation, cryptography, or access control changes. The Redux store migration is a build-time infrastructure change only.

ASVS categories V2/V3/V4/V5/V6 do not apply to this phase.

## Sources

### Primary (HIGH confidence)
- `planningpoker-web/src/App.jsx` — Current store setup code read directly [VERIFIED]
- `planningpoker-web/src/reducers/index.js` — Root reducer structure [VERIFIED]
- `planningpoker-web/package.json` — Current dependencies [VERIFIED]
- `planningpoker-web/package-lock.json` — Resolved versions for redux 4.2.1, redux-thunk 2.4.2 [VERIFIED]
- `npm view @reduxjs/toolkit version` → 2.11.2 [VERIFIED: npm registry, 2026-04-09]
- `npm view @reduxjs/toolkit dependencies` → bundles redux ^5.0.1, redux-thunk ^3.1.0 [VERIFIED: npm registry]
- Grep for `topic/items` across entire repo → 0 source file matches [VERIFIED]
- Grep for `redux-promise` across entire repo → 0 matches [VERIFIED]

### Secondary (MEDIUM confidence)
- RTK configureStore API pattern — standard usage inferred from dependency inspection and training knowledge

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified against npm registry
- Architecture: HIGH — code read directly; migration pattern is mechanically clear
- Pitfalls: MEDIUM — Vite chunk pitfall is inferred; others verified from code inspection
- CLN-01 finding: HIGH — grep verified across entire repo
- UI-04 finding: HIGH — code read directly from App.jsx

**Research date:** 2026-04-09
**Valid until:** 2026-07-09 (stable ecosystem — RTK, React, Vite move slowly for these APIs)
