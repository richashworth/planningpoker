---
title: Fix mobile header layout
area: ui
created: 2026-04-05
files:
  - planningpoker-web/src/containers/Header.jsx
---

### Problem
On 375px, the title truncates to "P...", chip and player name are crammed together with no spacing. The header is unusable on mobile.

### Solution
Hide title text on xs breakpoint (keep logo only). Rethink chip placement — either move below toolbar or make it a collapsible detail.
