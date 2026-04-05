---
title: Remove duplicate title on Welcome page
area: ui
created: 2026-04-05
files:
  - planningpoker-web/src/pages/Welcome.jsx
---

### Problem
"Planning Poker" appears in both the header (Lobster) and the Welcome page body (Inter, h3). Same words, different fonts, stacked on the same page.

### Solution
Drop the body h3 title since the header already establishes the brand. Use the tagline as the hero text, or make the Welcome page CTA-focused.
