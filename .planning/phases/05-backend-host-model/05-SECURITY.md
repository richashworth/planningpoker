---
phase: 05
slug: backend-host-model
status: verified
threats_open: 0
asvs_level: 1
created: 2026-04-06
---

# Phase 05 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| controller → SessionManager | Controllers pass user-supplied sessionId and userName to service layer | sessionId (string), userName (string) |
| client → REST API | Client receives host identity in SessionResponse; cannot set it directly | SessionResponse JSON (read-only host field) |
| server → WebSocket subscribers | Users message now includes host; all subscribers see it | STOMP message with users list + host string |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-05-01 | Spoofing | setHost | mitigate | `setHost` is internal to SessionManager only; no controller exposes it. Phase 6 will add caller validation when promote endpoint is added. | closed |
| T-05-02 | Tampering | sessionHosts map | accept | ConcurrentHashMap provides thread-safe writes; synchronized blocks in controllers prevent TOCTOU races. Same pattern as existing sessionUsers. | closed |
| T-05-03 | Denial of Service | removeUser auto-promote | accept | Auto-promotion is O(1) lookup of first element in existing list; no amplification vector. | closed |
| T-05-04 | Information Disclosure | SessionResponse.host | accept | Host username is already visible in the users list broadcast over WebSocket. Including it in SessionResponse adds no new information exposure. | closed |
| T-05-05 | Spoofing | host field in response | mitigate | Host field is read-only in the response — server sets it from `SessionManager.getHost()`. No client-supplied host value is accepted by any endpoint. Verified: controllers only call `getHost` (read). | closed |
| T-05-06 | Information Disclosure | Users WebSocket host field | accept | Same rationale as T-05-04 — host is already a session participant whose name is in the users list. Adding the host field to the WebSocket payload exposes no new information. | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-05-01 | T-05-02 | ConcurrentHashMap matches existing pattern; no new concurrency risk | gsd-secure-phase | 2026-04-06 |
| AR-05-02 | T-05-03 | O(1) operation with no amplification; trivial DoS surface | gsd-secure-phase | 2026-04-06 |
| AR-05-03 | T-05-04 | Host name already in users list; no new information disclosed | gsd-secure-phase | 2026-04-06 |
| AR-05-04 | T-05-06 | Same as AR-05-03; WebSocket host field adds no new exposure | gsd-secure-phase | 2026-04-06 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-04-06 | 6 | 6 | 0 | gsd-secure-phase |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-04-06
