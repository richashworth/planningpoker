# Requirements: Planning Poker

**Defined:** 2026-04-06
**Core Value:** Hosts can pick an estimation scheme when creating a game, and all participants see the correct cards for that session.

## v1.2 Requirements

Requirements for Host Management milestone. Each maps to roadmap phases.

### Host Identity

- [ ] **HOST-01**: Session creator is tracked as host server-side in SessionManager
- [ ] **HOST-02**: When host leaves, next participant by join order automatically becomes host
- [ ] **HOST-03**: All participants can see who the current host is (visual indicator)

### Host Actions

- [ ] **ACT-01**: Host can remove a participant from the session
- [ ] **ACT-02**: Host can promote another participant to host role
- [ ] **ACT-03**: Kick action requires confirmation before executing

### Notifications

- [ ] **NOTIF-01**: Kicked user is redirected to welcome page with a toast message explaining removal
- [ ] **NOTIF-02**: All participants receive real-time WebSocket push when host changes or a user is kicked

### UI Controls

- [ ] **UI-01**: Host sees inline kick/promote icons next to each participant in the users list
- [ ] **UI-02**: Non-host users do not see host control icons

## Future Requirements

### Host Extensions

- **HOSTEXT-01**: Persistent host preference across sessions (requires persistence layer)
- **HOSTEXT-02**: Co-host / multiple hosts per session

## Out of Scope

| Feature | Reason |
|---------|--------|
| Host-controlled reveal | Results already gate on all votes — no need |
| Persistent host across sessions | No persistence layer; host is per-session |
| Multiple hosts / co-host | Unnecessary complexity for current scope |
| Chat/messaging | Separate backlog item (999.1) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| HOST-01 | Phase 5 | Pending |
| HOST-02 | Phase 5 | Pending |
| ACT-01 | Phase 6 | Pending |
| ACT-02 | Phase 6 | Pending |
| NOTIF-02 | Phase 6 | Pending |
| HOST-03 | Phase 7 | Pending |
| ACT-03 | Phase 7 | Pending |
| NOTIF-01 | Phase 7 | Pending |
| UI-01 | Phase 7 | Pending |
| UI-02 | Phase 7 | Pending |

**Coverage:**
- v1.2 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-06*
*Last updated: 2026-04-06 after roadmap creation*
