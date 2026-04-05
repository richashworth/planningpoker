---
title: Make footer theme toggle more discoverable
area: ui
created: 2026-04-05
files:
  - planningpoker-web/src/components/Footer.jsx
---

### Problem
Theme toggle uses `text.disabled` colour — looks like a decorative watermark. A first-time user would never find it.

### Solution
Bump colour to `text.secondary`. Consider adding a small text label ("Dark" / "Light") next to the icon.
