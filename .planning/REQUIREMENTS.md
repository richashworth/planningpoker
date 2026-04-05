# Requirements: Planning Poker

**Defined:** 2026-04-05
**Core Value:** Hosts can pick an estimation scheme when creating a game, and all participants see the correct cards for that session.

## v1.1 Requirements

Requirements for CreateGame redesign. Each maps to roadmap phases.

### Scheme Selector

- [ ] **SEL-01**: User sees estimation schemes as clickable tiles with emoji icon, name, description, and sample values
- [ ] **SEL-02**: User can select a scheme by clicking its tile (visual feedback: highlighted border, checkmark)
- [ ] **SEL-03**: Selecting "Custom" reveals an inline text input within the tile for comma-separated values
- [ ] **SEL-04**: Tiles display in a 2-column grid on desktop (480px+)
- [ ] **SEL-05**: Tiles display in a 3-column icon-only grid on mobile (<480px), hiding descriptions and value chips

### Extra Cards

- [ ] **EXT-01**: User can toggle "? Unsure" and "☕ Break" via toggle switches (not pills)
- [ ] **EXT-02**: Toggle state is visually clear (on/off track with sliding indicator)

### Layout

- [ ] **LAY-01**: Card Preview section is removed — scheme tiles already show values
- [ ] **LAY-02**: Custom scheme tile spans full width of the grid
- [ ] **LAY-03**: Form fits on one screen without scrolling on desktop

### Backwards Compatibility

- [ ] **BWC-01**: Default scheme remains Fibonacci — existing flows unchanged
- [ ] **BWC-02**: All existing e2e tests pass after redesign
- [ ] **BWC-03**: API contract unchanged — only frontend CreateGame component changes

## Out of Scope

| Feature | Reason |
|---------|--------|
| Stepper/wizard flow | Research showed single form is correct for <7 options |
| Separate card preview | Tiles already show values — preview is redundant |
| Scheme descriptions on mobile | Screen real estate too tight — icon + name sufficient |
| Backend changes | Pure frontend redesign |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEL-01 | Phase 4 | Pending |
| SEL-02 | Phase 4 | Pending |
| SEL-03 | Phase 4 | Pending |
| SEL-04 | Phase 4 | Pending |
| SEL-05 | Phase 4 | Pending |
| EXT-01 | Phase 4 | Pending |
| EXT-02 | Phase 4 | Pending |
| LAY-01 | Phase 4 | Pending |
| LAY-02 | Phase 4 | Pending |
| LAY-03 | Phase 4 | Pending |
| BWC-01 | Phase 4 | Pending |
| BWC-02 | Phase 4 | Pending |
| BWC-03 | Phase 4 | Pending |

**Coverage:**
- v1.1 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-05*
*Last updated: 2026-04-05 after roadmap creation*
