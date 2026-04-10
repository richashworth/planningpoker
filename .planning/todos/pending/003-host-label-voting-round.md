---
title: "Host can label each voting round and download a CSV of results at end of session. Labels + consensus estimates accumulate in Redux state; export is client-side only (no persistence needed)."
status: pending
priority: P2
source: "promoted from /gsd-note"
created: 2026-04-08
theme: general
---

## Goal

Host can label each voting round and download a CSV of results at end of session. Labels + consensus estimates accumulate in Redux state; export is client-side only (no persistence needed).

## Context

Promoted from quick note captured on 2026-04-08 00:00.

## Acceptance Criteria

- [ ] Host can attach a label to each voting round before or after votes are revealed
- [ ] Results accumulate across rounds (label + consensus estimate) in Redux state
- [ ] Host can download a CSV of all round results at end of session
- [ ] Export is client-side only — no backend changes required
