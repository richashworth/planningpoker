# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Estimation Schemes

**Shipped:** 2026-04-04
**Phases:** 3 | **Plans:** 5

### What Was Built
- SchemeType enum + SchemeConfig record with per-session scheme storage in SessionManager
- JSON API contract: createSession/joinSession return scheme metadata; per-session vote validation
- Redux wiring for scheme state (legalEstimates, schemeType, meta-card flags)
- Scheme selector UI: preset picker, custom values input, meta-card toggles on CreateGame
- Dynamic vote cards and scheme-aware results chart (no hardcoded card lists)

### What Worked
- 3-phase layered approach (backend model → API contract → frontend UI) isolated risk well
- Coordinating the string→JSON API change in a single phase (Phase 2) prevented integration issues
- TDD approach in Phase 1 caught edge cases early (defensive copies, null-safety for unknown sessions)
- All 5 plans executed with zero deviations from plan

### What Was Inefficient
- REQUIREMENTS.md traceability table fell out of sync (5 items still marked Pending despite being complete) — checkbox discipline needed
- ROADMAP.md progress table similarly stale (Phase 2 & 3 marked 0/2 plans despite both complete)
- No e2e test coverage for the new feature — manual verification only

### Patterns Established
- Java records for immutable DTOs (SchemeConfig, CreateSessionRequest, SessionResponse)
- `resolveValues()` as canonical entry point for scheme → value list resolution
- `getSessionLegalValues()` returns empty list (not null) for unknown sessions
- Redux `legalEstimates` as single source for vote card rendering

### Key Lessons
1. Traceability tables need updating at plan completion, not just phase completion — stale checkboxes erode trust in the tracking system
2. Backend→frontend coordination for breaking API changes (string→JSON) is best done in a single phase with both sides committed together
3. Dead exports (LEGAL_ESTIMATES, COFFEE_SYMBOL) should be cleaned up in the same phase that supersedes them

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 3 | 5 | First milestone; established 3-phase layered delivery pattern |

### Top Lessons (Verified Across Milestones)

1. (Awaiting v1.1 data for cross-validation)
