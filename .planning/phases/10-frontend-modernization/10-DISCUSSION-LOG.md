# Phase 10: Frontend Modernization - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 10-frontend-modernization
**Areas discussed:** Redux Migration Approach, Dead WebSocket Subscription, Suspense Fallback
**Mode:** auto

---

## Redux Migration Approach

| Option | Description | Selected |
|--------|-------------|----------|
| configureStore (keep reducers) | Install RTK, replace createStore, keep existing reducer files | ✓ |
| Full RTK migration (createSlice) | Convert all reducers to createSlice pattern | |
| Minimal patch (just remove deprecated) | Remove only deprecated APIs without adding RTK | |

**User's choice:** [auto] configureStore with existing reducer structure (recommended default)
**Notes:** redux-promise already removed. redux-thunk already in use. Migration is minimal — just the store setup in App.jsx.

---

## Dead WebSocket Subscription

| Option | Description | Selected |
|--------|-------------|----------|
| Verify absent and document | Grep codebase, confirm no /topic/items subscription exists | ✓ |
| Search for alternate patterns | Check for similar dead subscriptions beyond /topic/items | |

**User's choice:** [auto] Verify absent and document (recommended default)
**Notes:** Grep for "topic/items" returned zero results across the entire codebase.

---

## Suspense Fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Verify existing CircularProgress | Already implemented — confirm it works | ✓ |
| Replace with skeleton screens | Per-route skeleton loading states | |
| Add branded loading screen | Custom loading component with app branding | |

**User's choice:** [auto] Verify existing implementation (recommended default)
**Notes:** Suspense with CircularProgress already wraps all routes in App.jsx lines 52-65.

---

## Claude's Discretion

- configureStore options and middleware composition
- Development-mode type-checking middleware
- Test adjustments after store migration

## Deferred Ideas

- Host voting round labels — feature work, not modernization
- Footer copyright date — already addressed
