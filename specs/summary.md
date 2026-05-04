## System: PlanningPoker

### Entities
- **Session**: A planning poker estimation session identified by 12-char URL-safe Base64 token
  - Type: resource
  - Count: unbounded
  - States: active, cleared
  - Initial state: active

- **User**: A named participant in a session (no auth, identified by username)
  - Type: actor
  - Count: unbounded per session
  - States: joined, voted, left
  - Initial state: joined

- **Estimate**: A vote cast by a user — (userName, estimateValue) pair
  - Type: resource
  - Count: at most 1 per user per session
  - States: exists, cleared
  - Initial state: does not exist

- **ClearSessionsTask**: Scheduled job that wipes all sessions weekly
  - Type: timer
  - Count: 1
  - States: idle, firing
  - Initial state: idle

### Transitions
- **Session: (new) -> active**
  - Trigger: createSession API call
  - Guard: valid username (2-20 chars, alphanumeric + spaces/hyphens/underscores)

- **Session: active -> cleared**
  - Trigger: ClearSessionsTask fires
  - Guard: none — clears all sessions unconditionally

- **User: (new) -> joined**
  - Trigger: joinSession or createSession API call
  - Guard: session is active AND username not already in session (case-insensitive) AND valid username

- **User: joined -> voted**
  - Trigger: vote API call
  - Guard: session is active AND user is member AND estimate value in LEGAL_ESTIMATES AND user has not already voted

- **User: joined/voted -> left**
  - Trigger: logout API call
  - Guard: session is active AND user is member
  - Side effect: user's estimate also removed

- **Session estimates: has-votes -> empty**
  - Trigger: reset API call
  - Guard: caller is session member
  - Side effect: all user states revert from voted to joined; users remain

### Constraints
**Should never happen:**
- A user has two estimates in the same session round
- Two users with the same name (case-insensitive) in the same session
- A non-member votes, resets, or logs out
- A vote with an invalid estimate value is accepted

**Must always be true:**
- After reset, estimates are empty but all users remain
- After a user leaves, both their membership and estimate are removed
- Session IDs are unique across active sessions

**Must eventually happen:**
- Stale sessions are cleaned up (weekly cron)

### Concurrency
- Simultaneous actors: multiple HTTP request threads + async burst threads (up to 4) + 1 cron thread
- Conflict resolution: per-operation synchronization via synchronized collection wrappers; compound operations (check-then-act) are NOT atomic except for reset()
- Atomicity: reset + broadcast is atomic (synchronized block); vote, join, logout are NOT atomic at the compound level

### Implementation Detail
- No database — all state in-memory on a single JVM
- `Collections.synchronizedSet` for activeSessions, `Multimaps.synchronizedListMultimap` for sessionUsers and sessionEstimates
- `synchronized(sessionManager)` block only in `GameController.reset()`
- `@Async` burst messaging: 6 sends at 10ms, 50ms, 150ms, 500ms, 2000ms, 5000ms delays
- ThreadPoolTaskExecutor: core=2, max=4, queue=100

### Resource Bounds
- Async thread pool: max 4 threads, queue 100 — 105th concurrent burst rejected
- Sessions: no maximum, accumulate until weekly wipe
- Users per session: no maximum
- Estimates per session: at most 1 per user per session (soft enforcement via check-then-act)

### Failure Modes
- **Double vote (TOCTOU):** Two concurrent votes from same user both pass containsUserEstimate check, both register — user has two estimates
- **Double join (TOCTOU):** Two concurrent joins with same username both pass duplicate check, both register
- **Ghost data on session clear:** Operation in flight when cron clears sessions — estimate/user written to cleared session
- **Thread pool saturation:** Burst messaging thread pool exhausted under moderate concurrent load
- **Stale refresh:** GET /refresh returns snapshot that's immediately stale due to concurrent vote
- **WebSocket gap:** Messages lost during client disconnect/reconnect window

### Fairness
- **Sessions eventually cleared:** weak (guaranteed if continuously possible) — weekly cron, no per-session TTL
- **Burst messages eventually delivered:** weak (guaranteed if continuously possible) — assumes thread pool not saturated and WebSocket connected

### Termination
- **Terminates:** no — long-running server, sessions have no terminal state
