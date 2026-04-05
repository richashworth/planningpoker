---
title: Shorten session chip label
area: ui
created: 2026-04-05
files:
  - planningpoker-web/src/containers/Header.jsx
---

### Problem
`Session ID: 22c60020` uses 12 characters of prefix for 8 characters of value. Especially wasteful on mobile.

### Solution
Use `#22c60020` or a tag/link icon prefix instead of the words "Session ID:".
