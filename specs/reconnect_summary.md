## System: Planning Poker — WebSocket Reconnect Protocol

### Entities
- **WebSocket Connection**: per-client transport layer
  - Type: resource
  - Count: one per mounted PlayGame instance
  - States: `null`, `disconnected`, `connected`
  - Initial state: `null`

- **wasConnected guard**: one-bit flag per client, latches after first connect
  - Type: resource
  - Count: one per PlayGame mount
  - States: `false`, `true`
  - Initial state: `false`

- **Validation Call**: in-flight `GET /sessionUsers` request
  - Type: resource
  - Count: 0 or more per client (multiple can be in-flight concurrently)
  - States: `in_flight`, `resolved_ok`, `resolved_error`
  - Initial state: `in_flight` when issued

- **Session**: server-side session object
  - Type: resource
  - Count: up to 100,000
  - States: `active`, `evicted`
  - Initial state: `active`

- **User**: a player's membership in a session
  - Type: actor
  - Count: variable per session; first is host
  - States: `member`, `not_member`
  - Initial state: `member` after join

- **Burst Sequence**: async delivery task per mutation
  - Type: timer
  - Count: one launched per mutation; multiple can overlap
  - States: `in_flight`, `complete`
  - Initial state: `in_flight`

- **Results State**: the current vote results visible to a client
  - Type: resource
  - Count: one per session
  - States: tracked as a version number (incremented on vote, reset on reset)
  - Initial state: version 0 (empty)

### Transitions
- **WS Connection: `null` -> `connected`**
  - Trigger: STOMP handshake succeeds (first attempt)
  - Guard: url and topics non-empty

- **WS Connection: `null` -> `disconnected`**
  - Trigger: 5-second timeout fires before any successful connect
  - Guard: hasConnected is still false at timeout

- **WS Connection: `connected` -> `disconnected`**
  - Trigger: any STOMP/WS error or server-side close
  - Guard: hasConnected is true

- **WS Connection: `disconnected` -> `connected`**
  - Trigger: STOMP auto-reconnect succeeds (3-second retry, unlimited attempts)
  - Guard: none beyond url/topics

- **wasConnected guard: `false` -> `true`**
  - Trigger: connected becomes true for the first time
  - Guard: wasConnected is currently false
  - Side effect: no validation call made

- **Reconnect validation issued**
  - Trigger: connected becomes true AND wasConnected is already true
  - Guard: none additional
  - Side effect: GET /sessionUsers in-flight; multiple can be in-flight if WS bounces rapidly

- **Validation Call: `in_flight` -> `resolved_ok`**
  - Trigger: server returns 200
  - Guard: session is active at moment of response (read is unsynchronized)
  - Side effect: no state change; player stays in game

- **Validation Call: `in_flight` -> `resolved_error`**
  - Trigger: server returns 4xx or 5xx
  - Guard: session evicted, or other error
  - Side effect: dispatch(kicked()) -> player navigates to welcome

- **Session: `active` -> `evicted`**
  - Trigger: weekly full clear cron, or 5-minute idle-eviction cron (idle > 24h)
  - Guard: idle eviction requires lastActivity older than 24h
  - Side effect: all users, votes, host entry removed atomically under session lock; no WS notification

- **User: `member` -> `not_member`**
  - Trigger: logout, kick by host, or session eviction
  - Guard for kick: caller must be host; target must not be host; target must be member
  - Side effect: burst users-list message sent to all subscribers

- **Burst Sequence: `in_flight` -> `complete`**
  - Trigger: all 6 sends complete
  - Guard: none
  - Side effect: subscribers who received at least one message have updated state

### Constraints

**Should never happen:**
- A player in the game view is left permanently in a zombie state (session gone, player not a member) without ever being redirected to welcome
- A player is redirected to welcome (kicked) while the session is active and they are a current member
- The reconnect validation fires on the initial connect (wasConnected guard must hold)
- Two players with the same name exist in the same session at the same time
- A non-host player can kick another player

**Must always be true:**
- Every active session with at least one member has exactly one host
- wasConnected transitions from false to true exactly once per PlayGame mount and never resets
- If validation resolves_ok, the player's game state is undisturbed

**Must eventually happen:**
- A disconnected client reconnects (retry every 3 seconds, indefinitely)
- After any mutation, all currently-connected subscribers receive the updated results
- Sessions idle > 24h are evicted within 5 minutes

### Concurrency
- Simultaneous actors: multiple HTTP request threads (mutations); burst async threads (deliveries); client reconnect timer; session eviction cron
- Conflict resolution: session mutations are serialized under synchronized(sessionManager); GET /sessionUsers (validation) is unsynchronized and can interleave freely with mutations and evictions
- Atomicity: each mutation is all-or-nothing under the session lock; validation reads are not coordinated with mutations

### Resource Bounds
- Sessions: max 100,000
- Burst sends: exactly 6 per mutation sequence
- WS reconnect retries: unlimited
- In-flight validation calls: unbounded (one per reconnect event; no deduplication)

### Failure Modes
- **Kicked while reconnecting**: user kicked by host while WS is mid-reconnect; burst window passes before WS reconnects; reconnect validation gets 200 OK (session active, user just not a member); player remains stranded in game view
- **Rapid reconnect storm**: WS bounces multiple times quickly; multiple GET /sessionUsers calls in-flight; if first call resolves as error after player has already successfully reconnected, kicked() dispatched while player is in a valid game
- **Zombie after idle eviction**: session evicted by cron while WS stays connected; no disconnect event fires; no reconnect validation triggered; player's next action hits a 400
- **Burst message ordering**: vote burst and reset burst overlap; client receives pre-reset results after reset has been applied
- **Unmount during reconnect**: player navigates away while WS is reconnecting; in-flight GET /sessionUsers .catch() still resolves and dispatches kicked() post-unmount

### Fairness
- **"Disconnected client eventually reconnects"**: weak
- **"All subscribers eventually receive mutation results"**: weak
- **"Idle sessions evicted within 5 minutes"**: strong

### Termination
- Terminates: no
