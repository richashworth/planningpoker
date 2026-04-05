---
phase: quick-260405-cid
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - planningpoker-web/src/containers/Header.jsx
  - planningpoker-web/src/components/Footer.jsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Dark/light toggle icon appears in the footer, not the header"
    - "Session label text is gone; the session ID chip stands alone"
    - "Toggle still works: clicking switches theme and persists to localStorage"
    - "Footer layout is balanced: version left, toggle center, about right"
  artifacts:
    - path: "planningpoker-web/src/containers/Header.jsx"
      provides: "Header without theme toggle and without Session label"
    - path: "planningpoker-web/src/components/Footer.jsx"
      provides: "Footer with dark/light toggle icon button"
  key_links:
    - from: "planningpoker-web/src/components/Footer.jsx"
      to: "useColorMode context"
      via: "import { useColorMode } from '../App'"
      pattern: "useColorMode"
---

<objective>
Move the dark/light mode toggle from the header to the footer, and remove the "Session" label so the session ID chip stands on its own.

Purpose: Declutter the header toolbar; the theme toggle is a secondary control better suited to the footer.
Output: Updated Header.jsx (toggle + Session label removed) and Footer.jsx (toggle added).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@planningpoker-web/src/containers/Header.jsx
@planningpoker-web/src/components/Footer.jsx
@planningpoker-web/src/App.jsx
</context>

<interfaces>
<!-- From App.jsx — the context hook Footer will need -->
```js
// planningpoker-web/src/App.jsx
export function useColorMode() {
  return useContext(ColorModeContext) // returns { toggleColorMode, mode }
}
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Remove toggle and Session label from Header</name>
  <files>planningpoker-web/src/containers/Header.jsx</files>
  <action>
In Header.jsx:
1. Remove the entire Tooltip+IconButton block for the dark/light toggle (lines 62-70).
2. Remove the "Session" Typography element (lines 73-75) — the Chip already shows the session ID and is self-explanatory.
3. Remove unused imports: `DarkModeOutlinedIcon`, `LightModeOutlinedIcon`, `Tooltip` (only if not used elsewhere in the file — Tooltip IS used on the copy icon, so keep it).
4. Remove the `useColorMode` import since the toggle is gone.
5. Remove the `const { toggleColorMode, mode } = useColorMode()` destructure.
6. Keep everything else (logo, title, session chip with copy, player name dropdown, logout menu) unchanged.
  </action>
  <verify>
    <automated>cd /Users/richard/Projects/planningpoker/planningpoker-web && npx vite build 2>&1 | tail -5</automated>
  </verify>
  <done>Header renders without theme toggle and without "Session" label. No build errors.</done>
</task>

<task type="auto">
  <name>Task 2: Add dark/light toggle to Footer</name>
  <files>planningpoker-web/src/components/Footer.jsx</files>
  <action>
In Footer.jsx:
1. Add imports: `IconButton` from `@mui/material/IconButton`, `Tooltip` from `@mui/material/Tooltip`, `DarkModeOutlinedIcon` from `@mui/icons-material/DarkModeOutlined`, `LightModeOutlinedIcon` from `@mui/icons-material/LightModeOutlined`, and `{ useColorMode }` from `'../App'`.
2. Inside the component, destructure: `const { toggleColorMode, mode } = useColorMode()`
3. Add the toggle between the version text and the About link so the footer has three items: version (left), toggle (center), about (right). Use this JSX:
```jsx
<Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} arrow>
  <IconButton
    onClick={toggleColorMode}
    aria-label="Toggle dark mode"
    size="small"
    sx={{ color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}
  >
    {mode === 'dark' ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
  </IconButton>
</Tooltip>
```
4. The footer already uses `justifyContent: 'space-between'` which will evenly space the three items.
  </action>
  <verify>
    <automated>cd /Users/richard/Projects/planningpoker/planningpoker-web && npx vite build 2>&1 | tail -5</automated>
  </verify>
  <done>Footer shows dark/light toggle icon between version and About link. Clicking it toggles theme. Build succeeds.</done>
</task>

</tasks>

<verification>
1. `cd planningpoker-web && npx vite build` completes without errors
2. `cd planningpoker-web && npx playwright test` — all e2e tests pass (dark mode toggle test may reference header; if so, update locator)
</verification>

<success_criteria>
- Theme toggle is in the footer, not the header
- "Session" label is removed; chip stands alone next to player name
- Toggle persists theme choice via localStorage (existing useColorMode behavior, unchanged)
- All existing e2e tests pass
</success_criteria>

<output>
After completion, create `.planning/quick/260405-cid-move-dark-light-toggle-from-header-to-fo/260405-cid-SUMMARY.md`
</output>
