---
status: testing
phase: 04-creategame-tile-grid-redesign
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md]
started: 2026-04-05T21:00:00Z
updated: 2026-04-05T21:00:00Z
---

## Current Test

number: 1
name: Scheme tiles with metadata
expected: |
  Open /host page. Five scheme tiles visible: Fibonacci, T-shirt, Simple, Time, Custom.
  Each tile shows an emoji icon, scheme name, description text, and sample value chips.
awaiting: user response

## Tests

### 1. Scheme tiles with metadata
expected: Open /host page. Five scheme tiles visible (Fibonacci, T-shirt, Simple, Time, Custom). Each tile shows an emoji icon, scheme name, description text, and sample value chips.
result: [pending]

### 2. Default selection is Fibonacci
expected: On page load, Fibonacci tile has a highlighted border and checkmark icon. No other tile is highlighted.
result: [pending]

### 3. Tile selection toggles
expected: Click the T-shirt tile. It gets highlighted border and checkmark. Fibonacci loses its highlight and checkmark. T-shirt chips show: XS, S, M, L, XL, XXL.
result: [pending]

### 4. Custom tile inline input
expected: Click the Custom tile. It highlights and an inline text input appears inside the tile with helper text "Enter 2-20 comma-separated values". Type "A, B, C" — input accepts it.
result: [pending]

### 5. Custom tile spans full width
expected: The Custom tile stretches across both columns (full width of the grid), not confined to a single column.
result: [pending]

### 6. Card Preview removed
expected: Scroll the entire CreateGame form. There is no "Card Preview" section anywhere on the page.
result: [pending]

### 7. Toggle switches default ON
expected: "Include ? (unsure)" and "Include ☕ (break)" switches are visible below the tiles. Both are ON by default (switch track filled/colored).
result: [pending]

### 8. Responsive layout at mobile width
expected: Resize browser to ~400px width. Tiles switch to a 3-column layout. Description text and value chips are hidden — only emoji icon and scheme name visible in each tile.
result: [pending]

### 9. Game creation with defaults
expected: Enter a name, leave Fibonacci selected and both toggles ON, click "Start Game". Redirects to /game with Fibonacci cards (1, 2, 3, 5, 8, 13, ?, ☕).
result: [pending]

## Summary

total: 9
passed: 0
issues: 0
pending: 9
skipped: 0
blocked: 0

## Gaps

[none yet]
