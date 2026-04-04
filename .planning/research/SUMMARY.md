# Project Research Summary

**Project:** Planning Poker — Estimation Schemes Milestone
**Domain:** Feature addition to an existing in-memory real-time SPA
**Researched:** 2026-04-04
**Confidence:** HIGH

## Executive Summary

This milestone adds customisable estimation schemes (Fibonacci, T-shirt, Simple, Custom) to an existing Spring Boot 3.4 / React 18 planning poker app. The feature is well-scoped: all required technologies are already installed, the architecture pattern is a straightforward additive layer on top of existing session state, and the domain conventions (preset schemes, meta-cards) are well-documented across competing tools. The recommended approach is to resolve the scheme to a concrete value list at session creation time, store it alongside existing session state in `SessionManager`, and propagate it to participants via upgraded create/join API responses. No new dependencies are required.

The principal risk is not architectural — it is the breaking change where `POST /createSession` must shift from returning a plain string to returning a JSON object. The Redux reducer currently reads the raw string as the session ID; once the response becomes a JSON object, every downstream action (vote, reset, leave) silently receives `[object Object]` as the session ID. This must be addressed atomically: backend response change and reducer fix in the same commit. A second paired change of equal importance is the `joinSession` endpoint, which currently returns void and must return scheme metadata so joiners see the same card set as the host.

All table-stakes features are already specified in the design doc and should ship together. Nothing in the anti-features list is close to the line — saving custom schemes for reuse and mid-session scheme changes require persistence or significantly more state management and are correctly deferred. The build order is strict (model -> service -> API -> frontend foundation -> UI -> tests) and maps cleanly to implementable phases.

---

## Key Findings

### Recommended Stack

No new dependencies are required. Every capability needed — `ToggleButtonGroup`, `Switch`, `TextField` on the frontend; Java records, `ConcurrentHashMap`, `@RestController` on the backend — is already in the installed dependency set. The constraint against new frameworks is not just acceptable, it is the correct call.

**Core technologies (existing, confirmed sufficient):**
- Java record `SchemeConfig`: immutable DTO for scheme metadata — idiomatic for Java 21, Jackson 2.17.x serialises records without configuration
- `SchemeType` enum: compile-time safety for scheme names, exhaustive switch coverage, clean `fromString()` factory
- `ConcurrentHashMap` (two new entries in `SessionManager`): follows the exact pattern already used for `lastActivity`; write-once at session creation means no additional synchronisation complexity
- MUI `ToggleButtonGroup` (frontend): semantic scheme selector, keyboard navigation, aria attributes; already in `@mui/material` ^5.15.0
- MUI `Switch` + `FormControlLabel`: binary meta-card toggles consistent with the dark/light toggle already in `Header.jsx`
- `reducer_game.js` extension: scheme fields are session-scoped and belong alongside `sessionId` and `isAdmin` in the game reducer; no new reducer needed
- `src/config/Schemes.js` (new): single source of truth for preset value lists on the frontend; used by both `CreateGame.jsx` and `Vote.jsx`

### Expected Features

All items below are specified in the design doc. The research confirms they are all table stakes — no discretionary trimming is appropriate.

**Must have (table stakes):**
- Fibonacci preset — industry standard; all competing tools include it; currently hardcoded, must be made explicit
- T-shirt sizes (XS/S/M/L/XL/XXL) — second most common scale; teams not using story points expect it
- Simple numeric (1-5) — coarse-grained scale common for new teams
- Custom scheme entry — expected by any team with a non-standard scale; all major tools offer it
- ? (unsure) meta-card — standard across physical and digital decks; toggle, not part of scheme
- Coffee break meta-card — standard convention; toggle, not part of scheme
- All participants see the same card set — core correctness; broken without scheme propagation on join
- Per-session vote validation — server must reject votes outside the session's scheme
- Scheme defaults to Fibonacci — backwards compatibility; existing flows must not break
- Card labels match scheme values in results — results chart already works on string keys per spec

**Should have (differentiators):**
- Meta-card toggles surfaced as host controls — no competing tool prominently offers this; low complexity
- Real-time custom value validation with inline feedback — prevents the most common failure mode; medium complexity

**Defer (v2+):**
- Saving custom schemes for reuse — requires persistence; app is in-memory only
- Changing scheme mid-session — invalidates cast votes; no standard pattern; explicitly out of scope
- Deck builder with label/value separation — not meaningful for a qualitative tool; PlanningPoker.com pattern does not apply here
- Card colours, import/export, AI suggestions — cosmetic or infrastructure-dependent

### Architecture Approach

The scheme layer inserts cleanly between session creation and vote validation without touching any other data flows. Scheme is resolved to a concrete `List<String>` at `createSession` time, stored in two new `ConcurrentHashMap` entries in `SessionManager`, and returned in the JSON response. Joiners receive the same config from an upgraded `joinSession` response. `Vote.jsx` reads scheme from Redux and resolves preset names to value lists locally (no network call); custom values are passed through the wire. `VoteController` replaces its static `LEGAL_ESTIMATES` set with a per-session lookup via `sessionManager.getSessionScheme(sessionId)`.

**Major components:**
1. `SchemeType` enum + `SchemeConfig` record (new backend model) — canonical scheme definitions and metadata DTO
2. `SessionManager` (extended) — stores resolved legal values and raw config per session; cleared by existing eviction hooks
3. `GameController` (extended) — validates scheme params; returns JSON from create/join endpoints
4. `VoteController` (modified) — per-session validation replacing static `LEGAL_ESTIMATES`
5. `Schemes.js` (new frontend config) — preset value resolver; used by `CreateGame.jsx` and `Vote.jsx`
6. `reducer_game.js` (extended) — adds scheme fields to Redux game state populated from create/join responses

### Critical Pitfalls

1. **`createSession` string-to-JSON breaks Redux silently** — `reducer_game.js` currently reads `action.payload.data` directly as the session ID string. When the response becomes JSON, `state.sessionId` is set to an object and all subsequent requests send `sessionId=[object Object]` with no console error. Fix: update the `CREATE_GAME` reducer case atomically with the backend change; add tests for both payload shapes.

2. **`joinSession` returns void — joiners miss scheme info** — the `joinGame` action currently discards the response body; the `JOIN_GAME` reducer reads only `action.meta`. Without updating both, joiners always render Fibonacci cards regardless of the session's actual scheme and then have their votes rejected by the per-session validator. Fix: implement backend response change, action update, and reducer update together.

3. **Meta-card symbol mismatch between frontend and backend** — the coffee symbol is `\u2615`; it must be spelled identically in `SchemeType.resolveValues()` and `Constants.js`. A one-character difference causes valid coffee votes to be rejected (HTTP 400) with no obvious cause. Fix: unit-test `resolveValues` output for both `?` and `\u2615` explicitly.

4. **`clearSessions()` / `evictIdleSessions()` do not clear new scheme maps** — orphaned scheme entries after session eviction create a slow memory leak and risk of a recycled session ID inheriting the previous session's scheme. Fix: add both new maps to the clear/evict methods in the same commit that introduces them; add assertions to `SessionManagerTest`.

5. **Frontend/backend custom value validation divergence** — splitting, trimming, deduplication, and length-checking must follow the same algorithm on both sides. Any difference lets the frontend accept values the server rejects, or the server accept values the frontend rejects. Fix: define the canonical algorithm on the backend first (unit-test it), then mirror it exactly in the frontend helper.

---

## Implications for Roadmap

The architecture research defines a strict six-layer build order based on compile-time dependencies. The roadmap phases should follow this order directly.

### Phase 1: Backend Model
**Rationale:** `SchemeType` enum and `SchemeConfig` record have no dependencies and must exist before anything else can compile. This is the safest first commit — purely additive, no existing code changes.
**Delivers:** Canonical scheme definitions and the DTO used in API responses.
**Addresses:** Table-stakes preset schemes (Fibonacci, T-shirt, Simple); meta-card symbol canonicalisation.
**Avoids:** Pitfall 3 (symbol mismatch) — unit-test `resolveValues` output for `?` and `\u2615` here.

### Phase 2: Backend Service (SessionManager)
**Rationale:** `SessionManager` needs `SchemeConfig` before its method signatures can compile. This phase is also where the memory-leak risk lives.
**Delivers:** Per-session scheme storage and retrieval; scheme eviction integrated into existing session lifecycle.
**Avoids:** Pitfall 4 (orphaned scheme maps) — implement map lifecycle as a single atomic unit with tests.

### Phase 3: Backend API
**Rationale:** Controllers depend on `SessionManager`; API response contracts must be defined before frontend can consume them.
**Delivers:** `createSession` returning JSON; `joinSession` returning JSON; `VoteController` per-session validation replacing static `LEGAL_ESTIMATES`; custom value validation.
**Avoids:** Pitfall 5 (validation divergence) — write backend `CustomValueValidator` with tests before writing frontend validation.

### Phase 4: Frontend Foundation
**Rationale:** `Schemes.js` and reducer changes can be authored in parallel with Phase 3, but must be paired with the API contract. The reducer fix for `CREATE_GAME` and `JOIN_GAME` must land in the same deploy as the backend JSON responses.
**Delivers:** `Schemes.js` preset definitions; updated `reducer_game.js` with scheme fields; updated `actions/index.js` parsing JSON responses.
**Avoids:** Pitfall 1 (string-to-JSON session ID breakage); Pitfall 2 (joiners missing scheme); Pitfall 6 (unguarded `action.error` branches).

### Phase 5: Frontend UI
**Rationale:** Depends on `Schemes.js` and updated Redux shape being in place.
**Delivers:** Scheme selector in `CreateGame.jsx` (ToggleButtonGroup + custom TextField + Switch toggles); dynamic card list in `Vote.jsx`.
**Avoids:** Pitfall 7 (missing form defaults break happy path — set `schemeType='fibonacci'`, both toggles `true` as initial state); Pitfall 8 (T-shirt strings through `parseInt` paths in results chart — audit `ResultsChart.jsx`).

### Phase 6: Tests
**Rationale:** Integration coverage spans all layers; meaningful E2E tests require all layers to be live.
**Delivers:** `GameControllerTest` scheme extensions; `SessionManagerTest` clear/evict assertions; `VoteControllerTest` per-session validation including coffee card; `reducer_game.test.js` scheme fields and error branches; `Schemes.test.js`; Playwright E2E for multi-user scheme propagation.

### Phase Ordering Rationale

- The backend-first order is forced by compile-time dependencies: the enum and record must exist before `SessionManager`, which must exist before controllers.
- Phases 3 and 4 are the highest-risk pair: the `createSession` response type change breaks the frontend if not coordinated. Treat them as a single deploy boundary.
- Phase 5 is safe to develop against a mocked backend (local `Schemes.js` + Redux store) but must be integration-tested against a live Phase 3-4 backend before shipping.
- Phase 6 tests should be written test-first within each phase for unit tests, and as a final integration pass for E2E.

### Research Flags

Phases with standard, well-documented patterns (no additional research needed):
- **Phase 1:** Java records and enums are standard Java 21; no research required.
- **Phase 2:** `ConcurrentHashMap` extension follows existing `SessionManager` patterns exactly.
- **Phase 5:** MUI `ToggleButtonGroup` and `Switch` are documented in MUI v5 docs; no surprises.

Phases that warrant implementation-time care (not additional research, but careful cross-checking):
- **Phase 3/4 boundary:** The paired backend/frontend API change is the highest-risk coordination point. Verify the `Content-Type: application/json` header is set on the backend response so Axios parses it automatically. If the header is missing, Axios delivers a string and the reducer still breaks silently.
- **Phase 6:** The Playwright test for "joiner sees the same cards as host" is the canonical integration test for this entire feature. It is the most valuable test to write and the most likely to reveal latent issues.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against `package.json` and `build.gradle`; zero new dependencies needed |
| Features | HIGH | Standard preset schemes and meta-cards confirmed across Wikipedia, multiple tool docs, and 2025/2026 comparison articles |
| Architecture | HIGH | Patterns verified directly against the existing codebase; no speculative design choices |
| Pitfalls | HIGH | Pitfalls 1-5 have direct codebase evidence (specific file and line references); pitfalls 6-9 are MEDIUM but well-mitigated |

**Overall confidence:** HIGH

### Gaps to Address

- **Scheme-locking as standard pattern (MEDIUM confidence):** No competing tool explicitly documents a "locked scheme" state. The conclusion that locking is the right pattern is drawn from the absence of mid-session change patterns in tool documentation. This is a design decision, not a discovered fact — validate against the PROJECT.md constraint before finalising.
- **`Content-Type` header on upgraded `createSession` response:** Research confirms Spring Boot 3.4 with `@RestController` returns `application/json` for record return types. Verify empirically with a quick manual test after Phase 3 before building Phase 4, since this is the keystone of the frontend parsing assumption.
- **Reconnection behaviour (Pitfall 9):** A joiner who loses Redux state mid-session must re-join to recover scheme info. This is acceptable under the current design but should be documented as a known limitation before a WebSocket reconnection story is considered.

---

## Sources

### Primary (HIGH confidence)
- `planningpoker-web/package.json` — installed frontend dependency versions
- `planningpoker-api/build.gradle` — installed backend dependency versions
- `docs/superpowers/specs/2026-04-04-estimation-schemes-design.md` — design spec
- `docs/superpowers/plans/2026-04-04-estimation-schemes.md` — implementation plan
- `.planning/PROJECT.md` — project constraints and requirements
- `.planning/codebase/ARCHITECTURE.md` — existing architecture reference
- Existing codebase: `SessionManager.java`, `GameController.java`, `VoteController.java`, `reducer_game.js`, `actions/index.js`

### Secondary (MEDIUM confidence)
- Wikipedia — Planning poker: https://en.wikipedia.org/wiki/Planning_poker
- PlanningPoker.live glossary: https://planningpoker.live/glossary
- AgileBox blog — customise your planning poker deck: https://agilebox.app/blog/customize-planning-poker-deck/
- PlanningPoker.com deck builder docs: https://www.planningpoker.com/answer/using-the-deck-builder/
- Parabol — 5 Best Planning Poker Tools 2025: https://www.parabol.co/blog/best-planning-poker-tools/
- Kollabe — Best Free Planning Poker Tools 2026: https://kollabe.com/posts/best-free-planning-poker-tools
- TeamRetro — Best Planning Poker Tools 2026: https://www.teamretro.com/best-planning-poker-tools-for-agile-teams/
- Zenhub — Best Planning Poker Tools 2025: https://www.zenhub.com/blog-posts/best-planning-poker-tools-for-2025-from-free-to-enterprise

---

*Research completed: 2026-04-04*
*Ready for roadmap: yes*
