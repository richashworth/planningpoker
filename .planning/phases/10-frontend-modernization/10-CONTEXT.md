# Phase 10: Frontend Modernization - Context

**Gathered:** 2026-04-09 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate the Redux store setup from legacy `createStore` to Redux Toolkit's `configureStore`, remove any dead WebSocket subscription to `/topic/items`, and ensure lazy-loaded routes show a visible loading indicator. No new features — this is modernization of existing infrastructure.

</domain>

<decisions>
## Implementation Decisions

### Redux Migration Approach
- **D-01:** Install `@reduxjs/toolkit` and replace `createStore` + `applyMiddleware` + `compose` with `configureStore` in `App.jsx`
- **D-02:** Keep existing reducer structure (`combineReducers` in `reducers/index.js`) — no need to convert to `createSlice` in this phase
- **D-03:** `redux-promise` is already removed from the codebase (replaced with `redux-thunk`). Remove the `redux-promise` package from `package-lock.json` if it still appears as a transitive dependency
- **D-04:** Remove the `composeEnhancers` / `__REDUX_DEVTOOLS_EXTENSION_COMPOSE__` workaround — `configureStore` includes DevTools integration automatically

### Dead WebSocket Subscription
- **D-05:** The `/topic/items/${sessionId}` subscription does not exist anywhere in the current source code. Verify this is truly absent (not just in a different form) and document the finding. No code changes expected.

### Suspense Fallback
- **D-06:** A `Suspense` wrapper with `CircularProgress` fallback already exists in `App.jsx` (lines 52-65). Verify it renders correctly during lazy route loading. If it already works, document the finding — no code changes needed.

### Claude's Discretion
- Exact `configureStore` options (middleware array composition, devTools flag)
- Whether to add type-checking middleware in development mode (RTK includes it by default)
- Test adjustments needed after store migration

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above and ROADMAP.md success criteria.

### Key source files
- `planningpoker-web/src/App.jsx` — Current store setup with `createStore`, `Suspense` wrapper
- `planningpoker-web/src/reducers/index.js` — `combineReducers` barrel file
- `planningpoker-web/src/hooks/useStomp.js` — WebSocket subscription management
- `planningpoker-web/package.json` — Current dependencies (no `@reduxjs/toolkit` yet)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `combineReducers` in `reducers/index.js` — can be passed directly to `configureStore({ reducer: rootReducer })`
- `CircularProgress` from MUI already imported and used as Suspense fallback
- `redux-thunk` already in use as middleware (RTK includes it by default)

### Established Patterns
- Redux store created in `App.jsx` alongside theme/routing setup
- All reducers follow `reducer_<domain>.js` naming convention
- Actions use `{ type, payload, meta }` pattern with thunk for async

### Integration Points
- Store creation in `App.jsx` line 31 — single point of change for migration
- `package.json` — add `@reduxjs/toolkit`, potentially remove `redux` direct dependency
- All existing `useSelector`/`useDispatch` calls remain unchanged after migration

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The migration should be a minimal-touch change that replaces the store setup without altering reducer logic or component code.

</specifics>

<deferred>
## Deferred Ideas

None — analysis stayed within phase scope.

### Reviewed Todos (not folded)
- "Host can label each voting round..." — This is a feature todo, not related to frontend modernization. Belongs in a future feature phase.
- "Add date to copyright notice in footer" — Already addressed in prior commits (merged from worktree).

</deferred>

---

*Phase: 10-frontend-modernization*
*Context gathered: 2026-04-09*
