---
title: Tone down header shadow in dark mode
area: ui
created: 2026-04-05
files:
  - planningpoker-web/src/containers/Header.jsx
---

### Problem
Fixed `boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'` lightens the dark background beneath the header. Looks odd in dark mode.

### Solution
Reduce or remove the shadow when in dark mode. Could use theme-aware sx or conditionally apply based on mode.
