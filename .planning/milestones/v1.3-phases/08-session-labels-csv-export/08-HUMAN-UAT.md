---
status: partial
phase: 08-session-labels-csv-export
source: [08-VERIFICATION.md]
started: 2026-04-08T22:00:00.000Z
updated: 2026-04-08T22:00:00.000Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Real-time label broadcast
expected: Host types a label in Vote screen; non-host participant sees the label update in real time via WebSocket without needing to refresh the page.
result: [pending]

### 2. Consensus override UI
expected: After voting, clicking the auto-consensus Chip opens a Select dropdown; host selects a different value; that override value is recorded in round history when Next Item is clicked.
result: [pending]

### 3. CSV download
expected: After completing at least one round, clicking Export CSV triggers a file download with correct filename (e.g. session-YYYYMMDD.csv) and columns: label, consensus, per-player votes, timestamp, mode, min, max, variance.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
