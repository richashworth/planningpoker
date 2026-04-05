---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: Estimation Schemes
status: completed
stopped_at: Milestone v1.0 shipped
last_updated: "2026-04-04"
last_activity: 2026-04-04
progress:
  total_phases: 3
  completed_phases: 3
  total_plans: 5
  completed_plans: 5
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-04)

**Core value:** Hosts can pick an estimation scheme when creating a game, and all participants see the correct cards for that session.
**Current focus:** Planning next milestone

## Current Position

Phase: v1.0 complete
Plan: N/A
Status: Milestone shipped
Last activity: 2026-04-05 - Completed quick task 260405-dhh: Change app title font from Sora to Lobster

Progress: [██████████] 100%

## Accumulated Context

### Decisions

See PROJECT.md Key Decisions table for full log.

### Pending Todos

1. [ ] **Fix mobile header (critical):** On 375px, title truncates to "P...", chip + player name crammed together. Hide title on xs, rethink chip placement on small screens.
2. [ ] **Shorten session chip label:** `Session ID: 22c60020` is too wordy (12-char prefix for 8-char value). Consider `#22c60020` or icon prefix instead.
3. [ ] **Add spacing between chip and player button:** No visual separation on desktop — they look like one compound widget. Add gap or subtle divider.
4. [ ] **Reconsider Lobster font:** Strong personality clash with Inter. Either lean into it elsewhere (Welcome heading?) or switch header to Inter/Sora.
5. [ ] **Remove duplicate title on Welcome page:** "Planning Poker" appears in both header and body h3. Drop body title or rephrase.
6. [ ] **Increase logo opacity:** SVG strokes at 0.2/0.5 are nearly invisible. Bump to 0.4/0.7 minimum.
7. [ ] **Tone down header shadow in dark mode:** Fixed `boxShadow` lightens the dark background beneath. Reduce or remove in dark mode.
8. [ ] **Make footer theme toggle more discoverable:** Uses `text.disabled` colour — looks like a watermark. Bump to `text.secondary`, consider adding "Dark"/"Light" label.
9. [ ] **Improve footer layout:** Three isolated items spread across full width. Group version + toggle on left, About on right.
10. [ ] **Simplify player menu or add items:** Single-item dropdown (just "Log out") is overengineered. Either add settings/profile items or replace with a direct logout icon button.

### Blockers/Concerns

None — all v1.0 blockers resolved.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260404-qgg | Fix dark/light mode: system default, icon-only toggle, consistent position | 2026-04-04 | 117c50e | [260404-qgg-fix-dark-light-mode-system-default-icon-](./quick/260404-qgg-fix-dark-light-mode-system-default-icon-/) |
| 260404-rsd | v1.0 cleanup: remove dead exports, add error guards, add scheme e2e tests | 2026-04-04 | 6e83736 | [260404-rsd-v1-0-cleanup-remove-dead-exports-add-err](./quick/260404-rsd-v1-0-cleanup-remove-dead-exports-add-err/) |
| 260405-0ko | Add logo, favicon, and header styling to match Fidra design language | 2026-04-05 | f4b6574 | [260405-0ko-add-logo-favicon-and-header-styling-to-m](./quick/260405-0ko-add-logo-favicon-and-header-styling-to-m/) |
| 260405-0y1 | Rename Fibonacci estimation scheme to Story Points | 2026-04-05 | 9c6cff3 | [260405-0y1-rename-fibonacci-estimation-scheme-to-st](./quick/260405-0y1-rename-fibonacci-estimation-scheme-to-st/) |
| 260405-13o | Rename STORY_POINTS back to FIBONACCI and cap at 13 | 2026-04-05 | 1e639be | [260405-13o-rename-story-points-back-to-fibonacci-an](./quick/260405-13o-rename-story-points-back-to-fibonacci-an/) |
| 260405-cid | Move dark/light toggle from header to footer, merge Session label into chip | 2026-04-05 | 44ed94e | [260405-cid-move-dark-light-toggle-from-header-to-fo](./quick/260405-cid-move-dark-light-toggle-from-header-to-fo/) |
| 260405-dhh | Change app title font from Sora to Lobster | 2026-04-05 | ed4dc7c | [260405-dhh-change-app-title-font-in-header-jsx-from](./quick/260405-dhh-change-app-title-font-in-header-jsx-from/) |

## Session Continuity

Last session: 2026-04-04
Stopped at: Completed quick task 260404-rsd
Resume file: N/A
