# Requirements: Planning Poker — Estimation Schemes

**Defined:** 2026-04-04
**Core Value:** Hosts can pick an estimation scheme when creating a game, and all participants see the correct cards for that session.

## v1 Requirements

### Scheme Definition

- [x] **SCHM-01**: Host can select from preset schemes: Fibonacci (default), T-shirt sizes, Simple (1-5)
- [x] **SCHM-02**: Host can define a custom scheme with 2-20 values (max 10 chars each, no duplicates)
- [x] **SCHM-03**: Host can toggle ? (unsure) meta-card on/off (default: on)
- [x] **SCHM-04**: Host can toggle Coffee (break) meta-card on/off (default: on)
- [ ] **SCHM-05**: Scheme is locked for the session duration

### API & State

- [ ] **API-01**: createSession accepts scheme parameters and returns JSON with scheme metadata
- [ ] **API-02**: joinSession returns scheme metadata so joiners see correct cards
- [ ] **API-03**: Server validates votes against the session's scheme (not hardcoded set)
- [x] **API-04**: Scheme state is stored per-session in SessionManager
- [x] **API-05**: Scheme state is cleaned up when sessions are evicted/cleared

### Frontend

- [x] **UI-01**: CreateGame page shows scheme selector (ToggleButtonGroup for presets)
- [x] **UI-02**: Custom scheme shows input field for defining values
- [x] **UI-03**: Meta-card toggles (switches) visible on CreateGame page
- [x] **UI-04**: Vote cards render dynamically from session scheme
- [x] **UI-05**: Results chart labels reflect session scheme values
- [ ] **UI-06**: Redux state stores scheme info from create/join responses

## v2 Requirements

### Persistence

- **PERS-01**: Host can save custom schemes for reuse across sessions
- **PERS-02**: Recently used schemes shown as quick-pick options

### UX Polish

- **UX-01**: Scheme preview showing sample cards before game creation
- **UX-02**: Animated card transitions when scheme loads

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mid-session scheme change | No ecosystem precedent; adds complexity for no clear benefit |
| Label/value separation for averaging | App is qualitative, not quantitative — averaging mixed types is meaningless |
| Saved custom schemes | Requires persistence the app deliberately does not have; defer to v2 |
| Chat/messaging | Separate milestone (backlog 999.1) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCHM-01 | Phase 3 | Complete |
| SCHM-02 | Phase 3 | Complete |
| SCHM-03 | Phase 3 | Complete |
| SCHM-04 | Phase 3 | Complete |
| SCHM-05 | Phase 2 | Pending |
| API-01 | Phase 2 | Pending |
| API-02 | Phase 2 | Pending |
| API-03 | Phase 2 | Pending |
| API-04 | Phase 1 | Complete |
| API-05 | Phase 1 | Complete |
| UI-01 | Phase 3 | Complete |
| UI-02 | Phase 3 | Complete |
| UI-03 | Phase 3 | Complete |
| UI-04 | Phase 3 | Complete |
| UI-05 | Phase 3 | Complete |
| UI-06 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0

---
*Requirements defined: 2026-04-04*
*Last updated: 2026-04-04 after roadmap creation*
