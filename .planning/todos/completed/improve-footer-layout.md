---
title: Improve footer layout grouping
area: ui
created: 2026-04-05
files:
  - planningpoker-web/src/components/Footer.jsx
---

### Problem
Three isolated items (version, toggle, About) spread across full viewport width with nothing connecting them. On a wide monitor they feel like unrelated footnotes.

### Solution
Group version + toggle together on the left, keep About on the right.
