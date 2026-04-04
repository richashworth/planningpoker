# Phase 3: Frontend UI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 03-frontend-ui
**Areas discussed:** Scheme selector layout, Custom values input, Meta-card toggles, Card grid adaptation
**Mode:** Auto (all recommended defaults selected)

---

## Scheme Selector Layout

| Option | Description | Selected |
|--------|-------------|----------|
| ToggleButtonGroup | Horizontal row of preset buttons below name input | ✓ |
| Dropdown/Select | MUI Select with preset options | |
| Radio buttons | Vertical list of radio options | |

**User's choice:** [auto] ToggleButtonGroup (recommended default)
**Notes:** Consistent with MUI patterns. Horizontal layout works well for 4 options.

---

## Custom Values Input

| Option | Description | Selected |
|--------|-------------|----------|
| Comma-separated TextField | Single text input with inline validation | ✓ |
| Chip input | Add values one at a time as chips | |
| Multi-line textarea | One value per line | |

**User's choice:** [auto] Comma-separated TextField (recommended default)
**Notes:** Simplest approach. Matches existing form patterns. Placeholder "S, M, L, XL" hints at format.

---

## Meta-Card Toggles

| Option | Description | Selected |
|--------|-------------|----------|
| Switch components | Two MUI Switches with FormControlLabel | ✓ |
| Checkboxes | MUI Checkboxes with labels | |
| Toggle within scheme selector | Integrated into the ToggleButtonGroup | |

**User's choice:** [auto] Switch components (recommended default)
**Notes:** Switches are more appropriate for on/off toggles. Visible for all scheme types.

---

## Card Grid Adaptation

| Option | Description | Selected |
|--------|-------------|----------|
| Keep auto-fill grid | Existing responsive grid handles variable counts | ✓ |
| Fixed columns per scheme | Different column counts based on card count | |

**User's choice:** [auto] Keep auto-fill grid (recommended default)
**Notes:** Existing minmax(80px, 1fr) auto-fill already adapts well to 5-20 cards.

---

## Claude's Discretion

- Spacing/sizing of scheme selector
- Whether to preview selected scheme values
- Custom values validation error styling

## Deferred Ideas

None
