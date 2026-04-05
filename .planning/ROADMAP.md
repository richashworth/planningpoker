# Planning Poker — Roadmap

## Milestones

- ✅ **v1.0 Estimation Schemes** — Phases 1-3 (shipped 2026-04-04) — [archive](milestones/v1.0-ROADMAP.md)
- **v1.1 CreateGame Redesign** — Phase 4 (active)

## Phases

<details>
<summary>✅ v1.0 Estimation Schemes (Phases 1-3) — SHIPPED 2026-04-04</summary>

- [x] Phase 1: Backend Foundation (1/1 plans) — completed 2026-04-04
- [x] Phase 2: API Contract (2/2 plans) — completed 2026-04-04
- [x] Phase 3: Frontend UI (2/2 plans) — completed 2026-04-04

</details>

### v1.1 CreateGame Redesign

- [ ] **Phase 4: CreateGame Tile Grid Redesign** - Replace scheme selector with tile grid, toggle switches for extras, verify backwards compatibility

## Phase Details

### Phase 4: CreateGame Tile Grid Redesign
**Goal**: Replace the ToggleButtonGroup scheme selector with a self-documenting tile grid, toggle switches for extras, and verify all existing flows still work
**Depends on**: Nothing (pure frontend component change)
**Requirements**: SEL-01, SEL-02, SEL-03, SEL-04, SEL-05, EXT-01, EXT-02, LAY-01, LAY-02, LAY-03, BWC-01, BWC-02, BWC-03
**Success Criteria** (what must be TRUE):
  1. Host sees each scheme as a tile showing emoji icon, name, description, and sample values
  2. Clicking a tile highlights it with a visible border and checkmark; previously selected tile unhighlights
  3. Selecting "Custom" expands an input area directly inside its tile for comma-separated values
  4. On a 480px+ wide screen, tiles appear in a 2-column grid; the Custom tile spans the full grid width
  5. On a screen narrower than 480px, tiles collapse to a 3-column icon-only layout hiding descriptions and value chips
  6. The Card Preview section is absent; the form fits on one desktop screen without vertical scrolling
  7. "? Unsure" and "☕ Break" options appear as toggle switches (on/off track with sliding indicator)
  8. Default scheme remains Fibonacci — existing flows work unchanged
  9. All existing Playwright e2e tests pass after the redesign
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 4. CreateGame Tile Grid Redesign | 0/? | Not started | - |

## Backlog

### Phase 999.1: Chat drawer with host moderation (BACKLOG)

**Goal:** Add a chat panel (left drawer) to planning poker sessions. Host can moderate (block/disable/enable chat). Users can send messages to each other in real-time. New joiners receive session message history.

**Requirements:** TBD

**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd:review-backlog when ready)
