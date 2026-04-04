# Settings Popover with Card Styles

## Summary

Add a settings cog icon in the header that opens a popover with two per-user settings: dark/light theme toggle and card style picker (square, rounded, playing card). Both settings persist in localStorage.

## UI

**Header**: Replace the inline dark/light switch with a cog icon (`SettingsIcon` from `@mui/icons-material`). Clicking opens a MUI `Popover` anchored to the cog.

**Popover contents:**
1. **Theme** row: Label "Theme" on the left, `Switch` on the right with "Light"/"Dark" label. Same toggle behavior as current.
2. **Card style** row: Label "Card Style" above three clickable mini-previews:
   - **Square**: Small rectangle with `borderRadius: 2` (4px), label "Square" below
   - **Rounded**: Small rectangle with `borderRadius: 3` (12px), label "Rounded" below
   - **Playing card**: Small rectangle with `borderRadius: 3`, tiny corner pips, label "Cards" below
   - Selected option gets a `primary.main` border, others get `divider` border

## Card Style Rendering

Applies only to vote cards in `Vote.jsx`.

**Square** (`borderRadius: 2`):
- `aspectRatio: '3 / 4'`
- Sharp corners, clean edges
- No decorative elements

**Rounded** (`borderRadius: 3`):
- `aspectRatio: '3 / 4'`
- Current default appearance
- No decorative elements

**Playing card** (`borderRadius: 3`):
- `aspectRatio: '2.5 / 4'` (slightly taller)
- Corner pips: value displayed in top-left and bottom-right (rotated 180deg) using `::before`/`::after` pseudo-elements or additional Box elements
- Pips are small (`0.55rem`), muted color (`text.disabled`)

All styles share the same hover behavior (translateY lift, primary border glow).

## State Management

Expand `ColorModeContext` in `App.jsx` into `SettingsContext`:

```
SettingsContext = {
  mode: 'dark' | 'light',
  cardStyle: 'square' | 'rounded' | 'cards',
  toggleColorMode: () => void,
  setCardStyle: (style) => void,
}
```

Rename `useColorMode()` to `useSettings()`. Update `Header.jsx` and `Vote.jsx` imports accordingly.

**localStorage keys:**
- `pp-theme` — existing, unchanged
- `pp-card-style` — new, defaults to `'rounded'`

## File Changes

**Modified:**
- `src/App.jsx` — Rename context, add `cardStyle` state + setter, rename hook export
- `src/containers/Header.jsx` — Replace inline switch with cog icon + Popover with both settings
- `src/containers/Vote.jsx` — Read `cardStyle` from context, apply style-specific `sx` to vote cards

**Unchanged:**
- `src/theme.js` — Card style is component-level, not MUI theme-level
- All other components — They use `useColorMode` only in Header; Vote reads card style only
- Actions, reducers, constants, backend — No changes
