---
phase: 08-session-labels-csv-export
verified: 2026-04-08T22:00:00Z
status: human_needed
score: 8/8 must-haves verified
human_verification:
  - test: "Host types a label in the Vote screen TextField; open a second browser tab joined to the same session as a non-host and verify the label appears as read-only italic text in real time"
    expected: "Non-host participant sees the label text update within 1-2 seconds without refreshing"
    why_human: "Real-time WebSocket label broadcast to other participants cannot be verified by static code inspection alone"
  - test: "After voting completes, verify the Consensus Chip shows the auto-calculated mode; click the Chip as host and select a different value from the dropdown"
    expected: "Chip label updates to the overridden value; clicking Next Item saves the overridden consensus to round history"
    why_human: "UI interaction involving local React state and inline Select rendering requires browser testing"
  - test: "Complete two rounds with labels; click Export CSV"
    expected: "Browser downloads a .csv file named planning-poker-{sessionId}.csv with correct headers (Label,Consensus,Timestamp,Mode,Min,Max,Variance,Player1,...) and two data rows"
    why_human: "Blob download triggers require a browser environment to observe the downloaded file"
---

# Phase 8: Session Labels & CSV Export Verification Report

**Phase Goal:** Host can optionally label each voting round (before or after voting, visible to all players). Auto-majority consensus is inferred and can be overridden by the host. Round history accumulates in Redux. Host can download a CSV including label, consensus estimate, per-player votes, timestamp, mode, min, max, and variance.
**Verified:** 2026-04-08T22:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Host can type a label for the current round and it broadcasts to all players | ✓ VERIFIED | Vote.jsx has a debounced TextField for isAdmin; dispatches `setLabel` thunk → POST /setLabel → `burstResultsMessages` → RESULTS_MESSAGE WebSocket with `{results, label}` payload |
| 2 | Non-host players see the current round label but cannot edit it | ✓ VERIFIED | Vote.jsx: when `!isAdmin`, renders read-only italic `Typography` showing `currentLabel` if non-empty; no edit controls |
| 3 | Label is transmitted over WebSocket so all participants see it in real time | ✓ VERIFIED | MessagingUtils.sendResultsMessage builds `{results, label}` map; PlayGame.jsx onMessage extracts label and dispatches `labelUpdated(label)` which updates `state.game.currentLabel` |
| 4 | Label persists across the voting and results phases of a single round | ✓ VERIFIED | `currentLabel` lives in reducer_game.js; LABEL_UPDATED sets it; nothing clears it between voting and results transitions; Results.jsx reads `state.game.currentLabel` and displays it |
| 5 | Label clears when a new round starts (reset) | ✓ VERIFIED | reducer_game.js handles `RESET_SESSION` → `currentLabel: ''`; SessionManager.resetSession removes from sessionLabels map |
| 6 | After voting, the majority estimate is auto-calculated and displayed as consensus | ✓ VERIFIED | Results.jsx calls `calcConsensus(results)` from utils/consensus.js; renders MUI Chip with `Consensus: {value}`; 19 unit tests pass for calcConsensus and calcStats |
| 7 | Host can override the auto-calculated consensus by selecting a different value | ✓ VERIFIED | Results.jsx has `consensusOverride` local state; host clicking Chip opens inline Select; selecting a value sets override; overridden value shown in Chip |
| 8 | When the host clicks Next Item, the completed round (label, consensus, votes, timestamp, stats) is saved to Redux round history; host can download CSV of all completed rounds | ✓ VERIFIED | handleNextItem builds round object with calcStats, dispatches `roundCompleted` to reducer_rounds.js; Export CSV button calls `generateCsv` + `downloadCsv`; 19 unit tests pass |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/GameController.java` | POST /setLabel endpoint | ✓ VERIFIED | Lines 152-170: validates label ≤100 chars, strips control chars, host-only check via HostActionException, calls burstResultsMessages |
| `planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java` | Label storage per session | ✓ VERIFIED | Lines 35, 91-99, 135-138: `sessionLabels` ConcurrentHashMap, setLabel/getLabel, cleared on resetSession and clearSessions and evictIdleSessions |
| `planningpoker-web/src/reducers/reducer_game.js` | currentLabel state in Redux | ✓ VERIFIED | Lines 23, 56-59: `currentLabel: ''` in initialState, handles LABEL_UPDATED and RESET_SESSION |
| `planningpoker-web/src/containers/Vote.jsx` | Label input for host, display for others | ✓ VERIFIED | Lines 54-106: TextField with debounce for isAdmin; read-only Typography for non-host |
| `planningpoker-web/src/containers/Results.jsx` | Label display, consensus Chip, host override dropdown, CSV export | ✓ VERIFIED | Full implementation: currentLabel display, autoConsensus Chip, consensusOverride Select, handleNextItem with roundCompleted, handleExportCsv |
| `planningpoker-web/src/utils/consensus.js` | calcConsensus (mode) and calcStats | ✓ VERIFIED | Exports calcConsensus and calcStats; 11 unit tests pass |
| `planningpoker-web/src/utils/csvExport.js` | generateCsv and downloadCsv | ✓ VERIFIED | Exports generateCsv and downloadCsv; proper CSV escaping and formula injection protection; 8 unit tests pass |
| `planningpoker-web/src/reducers/reducer_rounds.js` | Round history accumulation | ✓ VERIFIED | Handles ROUND_COMPLETED (append) and LEAVE_GAME (reset); does not clear on RESET_SESSION |
| `planningpoker-web/src/reducers/index.js` | RoundsReducer wired into combineReducers | ✓ VERIFIED | Line 7, 16: imports and registers `rounds: RoundsReducer` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| Vote.jsx label TextField | POST /setLabel | dispatch(setLabel(playerName, sessionId, value)) | ✓ WIRED | Vote.jsx line 65; actions/index.js line 173-186 POSTs to /setLabel |
| GameController.setLabel | MessagingUtils | burstResultsMessages(sessionId) | ✓ WIRED | GameController.java line 169; MessagingUtils includes label in payload |
| PlayGame.jsx onMessage (RESULTS_MESSAGE) | reducer_game.js | dispatch(labelUpdated(msg.payload.label)) | ✓ WIRED | PlayGame.jsx lines 58-61; labelUpdated dispatched when label !== undefined |
| Results.jsx Next Item click | reducer_rounds.js | dispatch(roundCompleted(round)) | ✓ WIRED | Results.jsx line 46; reducer_rounds handles ROUND_COMPLETED |
| Results.jsx Export CSV button | csvExport.js | downloadCsv(rounds) | ✓ WIRED | Results.jsx lines 51-55; imports and calls generateCsv + downloadCsv |
| consensus.js calcConsensus | Results.jsx | import and call with results array | ✓ WIRED | Results.jsx lines 13, 28-29 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| Vote.jsx label TextField | currentLabel | state.game.currentLabel ← labelUpdated ← RESULTS_MESSAGE WebSocket ← MessagingUtils.getLabel(sessionId) ← SessionManager.sessionLabels | Yes — SessionManager stores and retrieves real label strings from ConcurrentHashMap | ✓ FLOWING |
| Results.jsx consensus Chip | results | state.results ← resultsUpdated ← RESULTS_MESSAGE WebSocket ← SessionManager.getResults(sessionId) | Yes — results come from live vote data in sessionEstimates | ✓ FLOWING |
| Results.jsx rounds / Export CSV | rounds | state.rounds ← roundCompleted dispatched in handleNextItem | Yes — accumulated from actual completed rounds in Redux store | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| consensus.js unit tests | `npx vitest run src/utils/consensus.test.js` | 11 tests pass in 1.44s | ✓ PASS |
| csvExport.js unit tests | `npx vitest run src/utils/csvExport.test.js` | 8 tests pass in 1.44s | ✓ PASS |
| GameControllerTest (setLabel) | `./gradlew planningpoker-api:test --tests "...GameControllerTest"` | testSetLabel, testSetLabelNonHostRejected, testSetLabelTooLongRejected, testSetLabelEmptyAllowed all PASS | ✓ PASS |
| Real-time label broadcast to non-host | Requires browser with two tabs | N/A | ? SKIP (human) |
| CSV file download | Requires browser | N/A | ? SKIP (human) |

### Requirements Coverage

| Requirement | Source Plan | Description (inferred from ROADMAP + PLAN) | Status | Evidence |
|-------------|------------|---------------------------------------------|--------|---------|
| LABEL-01 | 08-01 | Host can set a text label for the current round | ✓ SATISFIED | POST /setLabel endpoint, host-only restriction, Vote.jsx TextField |
| LABEL-02 | 08-01 | Label broadcasts to all participants via WebSocket | ✓ SATISFIED | RESULTS_MESSAGE carries `{results, label}` payload; PlayGame.jsx dispatches labelUpdated |
| LABEL-03 | 08-01 | Label displayed on both voting and results views; clears on reset | ✓ SATISFIED | Vote.jsx shows label; Results.jsx shows label; RESET_SESSION clears currentLabel |
| CONS-01 | 08-02 | Auto-majority consensus inferred from votes | ✓ SATISFIED | calcConsensus (mode) in consensus.js; displayed as Chip in Results.jsx |
| CONS-02 | 08-02 | Host can override auto-calculated consensus | ✓ SATISFIED | consensusOverride local state; inline Select dropdown in Results.jsx |
| HIST-01 | 08-02 | Round history accumulates in Redux across resets | ✓ SATISFIED | reducer_rounds.js appends ROUND_COMPLETED; does not clear on RESET_SESSION |
| CSV-01 | 08-02 | Host can download CSV with label, consensus, per-player votes, timestamp, stats | ✓ SATISFIED | generateCsv/downloadCsv; Export CSV button in Results.jsx; columns: Label,Consensus,Timestamp,Mode,Min,Max,Variance,Players |

**Note:** Requirement IDs LABEL-01 through CSV-01 are referenced in ROADMAP.md Phase 8 and in the PLAN frontmatter, but are **not formally defined in REQUIREMENTS.md** (which only covers v1.2 Host Management). The descriptions above are inferred from ROADMAP and PLAN intent. REQUIREMENTS.md should be updated to include these seven requirement definitions for completeness.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `planningpoker-web/src/containers/Vote.jsx` | 57 | `useState(currentLabel)` — initializes label input from Redux but won't sync if Redux updates from WebSocket while on voting screen (e.g. another host session scenario) | ℹ️ Info | Local input state initialized once from Redux; re-joins mid-round may not show current label in host's own input field. Not a blocker for single-host sessions |

No stub indicators found. No TODO/FIXME/placeholder comments in Phase 8 files. No empty return implementations.

### Human Verification Required

#### 1. Real-Time Label Broadcast

**Test:** Create a session with two browser tabs (host + participant). As host, type a label in the Vote screen.
**Expected:** Non-host tab sees the label appear as italic read-only text within ~2 seconds, without page refresh.
**Why human:** WebSocket real-time propagation to other participants cannot be verified by static analysis.

#### 2. Consensus Override UI

**Test:** Vote in a round with mixed estimates. On the Results screen as host, click the Consensus Chip. Select a different value from the dropdown.
**Expected:** Chip updates to the selected value. Clicking Next Item saves the overridden consensus (not the auto-calculated one) to round history.
**Why human:** Local React state interaction (consensusOverride) and inline Select rendering requires a browser.

#### 3. CSV Download

**Test:** Complete two rounds with labels. Click "Export CSV" button in Results screen.
**Expected:** Browser downloads a file named `planning-poker-{sessionId}.csv` containing two data rows with all required columns (Label, Consensus, Timestamp, Mode, Min, Max, Variance, per-player votes).
**Why human:** Blob download mechanism requires a browser environment; the file contents must be inspected manually.

### Gaps Summary

No gaps found. All 8 observable truths are verified at all four levels (exists, substantive, wired, data-flowing). All 19 frontend unit tests pass; all 4 setLabel backend tests pass.

The three items requiring human verification are behavioral spot-checks on real-time WebSocket delivery, interactive UI state, and browser file download — none of these represent missing or incomplete code. The implementation is complete and substantive.

**One documentation gap (non-blocking):** Requirement IDs LABEL-01, LABEL-02, LABEL-03, CONS-01, CONS-02, HIST-01, CSV-01 are referenced in ROADMAP.md but not defined in `.planning/REQUIREMENTS.md`. The requirements file covers only the v1.2 milestone. This should be addressed when formalising Phase 8 / v1.3 requirements.

---

_Verified: 2026-04-08T22:00:00Z_
_Verifier: Claude (gsd-verifier)_
