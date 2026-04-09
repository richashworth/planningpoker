---
created: 2026-04-08T22:01:53.591Z
title: Add date to copyright notice in footer
area: ui
files:
  - planningpoker-web/src/components/Footer.jsx
---

## Problem

The copyright notice in the Footer component does not include the year. It should display the current year (or a date range) alongside the copyright holder name.

## Solution

Add the current year to the copyright text in Footer.jsx. Consider whether to hardcode or use `new Date().getFullYear()` for auto-updating.
