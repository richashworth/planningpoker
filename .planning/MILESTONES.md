# Milestones

## v1.0 Estimation Schemes (Shipped: 2026-04-04)

**Phases completed:** 4 phases, 5 plans, 7 tasks

**Key accomplishments:**

- SchemeType enum, SchemeConfig record, and per-session scheme storage in SessionManager with full lifecycle cleanup
- JSON API contract: createSession/joinSession return scheme metadata; VoteController validates votes per-session
- Redux layer wired to consume JSON responses and populate scheme state (legalEstimates, schemeType, meta-card flags)
- Scheme selector UI on CreateGame: preset picker, custom values input with validation, meta-card toggles
- Dynamic vote cards and scheme-aware results chart — no more hardcoded card lists

**Stats:** 36 files changed, +2,875 / -67 lines | Git range: `6632c18..1e6a76c`

---
