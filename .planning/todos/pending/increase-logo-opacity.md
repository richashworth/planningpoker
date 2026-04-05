---
title: Increase logo opacity
area: ui
created: 2026-04-05
files:
  - planningpoker-web/src/components/Logo.jsx
---

### Problem
SVG logo strokes at 0.2/0.5 are nearly invisible against the gradient, especially on smaller screens. The "PP" text and spiral are hard to make out.

### Solution
Bump stroke opacity to at least 0.4/0.7.
