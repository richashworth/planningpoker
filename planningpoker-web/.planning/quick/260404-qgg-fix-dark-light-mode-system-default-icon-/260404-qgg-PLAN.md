---
phase: quick
plan: 260404-qgg
type: execute
wave: 1
depends_on: []
files_modified:
  - planningpoker-web/src/App.jsx
  - planningpoker-web/src/containers/Header.jsx
  - planningpoker-web/tests/planning-poker.spec.js
autonomous: true
must_haves:
  truths:
    - "Theme defaults to OS preference when no localStorage value exists"
    - "Theme toggle is always visible in the toolbar, not hidden in a dropdown menu"
    - "Toggle uses a Switch with sun/moon icons instead of a text button"
    - "Toggle works identically whether in a game session or on the welcome page"
  artifacts:
    - path: "planningpoker-web/src/App.jsx"
      provides: "System-preference-aware theme initialization"
      contains: "matchMedia"
    - path: "planningpoker-web/src/containers/Header.jsx"
      provides: "Always-visible icon Switch in toolbar"
      contains: "Switch"
    - path: "planningpoker-web/tests/planning-poker.spec.js"
      provides: "Updated e2e test for new Switch toggle"
  key_links:
    - from: "planningpoker-web/src/App.jsx"
      to: "window.matchMedia"
      via: "useState initializer"
      pattern: "matchMedia.*prefers-color-scheme"
    - from: "planningpoker-web/src/containers/Header.jsx"
      to: "planningpoker-web/src/App.jsx"
      via: "useColorMode hook"
      pattern: "useColorMode"
---

<objective>
Fix the dark/light mode toggle: detect system preference as default, replace text button with an icon Switch, and ensure the toggle is always visible in the header toolbar regardless of game state.

Purpose: Improve UX — users get their OS theme by default, the toggle is discoverable at all times, and the UI is cleaner with icons instead of text.
Output: Updated App.jsx, Header.jsx, and e2e test.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@planningpoker-web/src/App.jsx
@planningpoker-web/src/containers/Header.jsx
@planningpoker-web/tests/planning-poker.spec.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: System default theme + icon Switch toggle always in toolbar</name>
  <files>planningpoker-web/src/App.jsx, planningpoker-web/src/containers/Header.jsx</files>
  <action>
**App.jsx (line 38):** Change the useState initializer from:
```js
localStorage.getItem('pp-theme') || 'dark'
```
to a function that checks: (1) localStorage `pp-theme`, (2) `window.matchMedia('(prefers-color-scheme: dark)').matches` — if true return `'dark'`, else `'light'`, (3) fallback `'light'`. Also update the ColorModeContext default on line 31 from `'dark'` to `'light'` (it's just the context default, not functionally critical, but keeps it consistent with the fallback).

**Header.jsx:** Make these changes:

1. Add imports: `Switch` from `@mui/material/Switch`, remove `Menu`, `MenuItem`, `ListItemIcon`, `ListItemText`, `ArrowDropDownIcon` imports (no longer needed for theme — but keep them because the Menu is still used for logout).

2. Remove the theme toggle `MenuItem` (lines 114-122) from the dropdown Menu. Keep the logout MenuItem.

3. Remove the standalone theme toggle Button in the else branch (lines 132-145).

4. Add a single MUI Switch component in the Toolbar, placed BEFORE the session-conditional block (before line 64's `{sessionId ? (`). This ensures it's always visible regardless of game state.

The Switch should:
- Use `checked={mode === 'dark'}` and `onChange={toggleColorMode}`
- Have an `aria-label="Toggle dark mode"` for accessibility
- Be styled with `sx` to show sun/moon icons. Use this approach: style the thumb to show the icon via `&::before` pseudo-element with the MUI icon SVG data URI, and style the track colors. Specifically:
  - Track: semi-transparent white (`rgba(255,255,255,0.3)`) for both states since it's on a gradient AppBar
  - Thumb background: white
  - Thumb `&::before`: use `content: '""'` with background-image of sun SVG when unchecked (light mode), moon SVG when checked (dark mode). Use Material Icons SVG paths:
    - Sun (LightMode): `M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 000-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z`
    - Moon (DarkMode): `M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z`

  Actually, SIMPLER approach: Instead of SVG data URIs (complex), just place the actual MUI icon components next to the Switch as visual indicators:

  ```jsx
  <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
    <LightModeOutlinedIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', mr: 0.5 }} />
    <Switch
      checked={mode === 'dark'}
      onChange={toggleColorMode}
      size="small"
      aria-label="Toggle dark mode"
      sx={{
        '& .MuiSwitch-switchBase.Mui-checked': {
          color: 'rgba(255,255,255,0.9)',
        },
        '& .MuiSwitch-switchBase': {
          color: 'rgba(255,255,255,0.9)',
        },
        '& .MuiSwitch-track': {
          bgcolor: 'rgba(255,255,255,0.3) !important',
        },
      }}
    />
    <DarkModeOutlinedIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', ml: 0.5 }} />
  </Box>
  ```

  Place this Box right before `{sessionId ? (` in the Toolbar, after the `<Box sx={{ flexGrow: 1 }} />` spacer.

5. Since the theme MenuItem is removed from the Menu, the `handleThemeToggle` function (lines 45-48) can be removed — the Switch calls `toggleColorMode` directly.

6. Keep all Menu/MenuItem/ListItemIcon/ListItemText/ArrowDropDownIcon imports — they are still needed for the player dropdown with logout.
  </action>
  <verify>
    <automated>cd /Users/richard/Projects/planningpoker/planningpoker-web && npx vite build 2>&1 | tail -5</automated>
  </verify>
  <done>Theme initializes from OS preference when no localStorage exists. A sun/moon icon Switch is always visible in the header toolbar. The player dropdown menu no longer contains the theme toggle (only logout). Build succeeds with no errors.</done>
</task>

<task type="auto">
  <name>Task 2: Update e2e test for new Switch toggle</name>
  <files>planningpoker-web/tests/planning-poker.spec.js</files>
  <action>
Update the "Dark/Light Mode" test (lines 97-126) in `planning-poker.spec.js`:

The toggle is now a Switch with `aria-label="Toggle dark mode"`, not a button with text "Light mode" / "Dark mode".

Replace the test body:
1. Remove `localStorage` so system default applies. Since Playwright doesn't have a real OS preference and localStorage is empty, the fallback will be `'light'` (matchMedia in headless Chromium defaults to light). So the initial state will be LIGHT mode.
2. Use `page.emulateMedia({ colorScheme: 'dark' })` BEFORE `page.goto('/')` to simulate OS dark preference. This way initial state is dark mode (consistent with original test flow).
3. Find the switch via `page.getByRole('checkbox', { name: 'Toggle dark mode' })` (MUI Switch renders as a checkbox input).
4. Verify initial dark mode background (`rgb(18, 18, 18)`).
5. Click the switch to toggle to light mode, verify light background (`rgb(248, 250, 252)`).
6. Click again to toggle back to dark, verify dark background.

Updated test:
```js
test('toggle switches between dark and light mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');

  const DARK_BG = 'rgb(18, 18, 18)';
  const LIGHT_BG = 'rgb(248, 250, 252)';
  const toggle = page.getByRole('checkbox', { name: 'Toggle dark mode' });

  // Default with dark OS preference is dark mode
  await page.waitForFunction(
    (expected) => getComputedStyle(document.body).backgroundColor === expected,
    DARK_BG,
  );
  await expect(toggle).toBeVisible();
  await expect(toggle).toBeChecked();

  // Toggle to light mode
  await toggle.click();
  await page.waitForFunction(
    (expected) => getComputedStyle(document.body).backgroundColor === expected,
    LIGHT_BG,
  );
  await expect(toggle).not.toBeChecked();

  // Toggle back to dark mode
  await toggle.click();
  await page.waitForFunction(
    (expected) => getComputedStyle(document.body).backgroundColor === expected,
    DARK_BG,
  );
});
```
  </action>
  <verify>
    <automated>cd /Users/richard/Projects/planningpoker/planningpoker-web && npx vite build 2>&1 | tail -3</automated>
  </verify>
  <done>E2e test updated to use the new Switch selector and system preference emulation. Build still passes. (Full e2e test requires backend running — manual verification with `npx playwright test` when backend is available.)</done>
</task>

</tasks>

<verification>
1. `cd planningpoker-web && npx vite build` — no errors
2. Manual: open http://localhost:3000 with no localStorage `pp-theme` — theme should match OS preference
3. Manual: icon Switch visible in toolbar on welcome page AND during a game session
4. Manual: clicking the Switch toggles between dark and light themes
5. E2e: `cd planningpoker-web && npx playwright test` (requires backend on port 9000)
</verification>

<success_criteria>
- App detects OS color scheme preference when no localStorage value exists
- Sun/moon Switch is always visible in the header toolbar
- Theme toggle is NOT in the player dropdown menu during a game
- Toggle works correctly in both pre-game and in-game states
- Existing e2e tests updated and pass
</success_criteria>

<output>
After completion, create `.planning/quick/260404-qgg-fix-dark-light-mode-system-default-icon-/260404-qgg-SUMMARY.md`
</output>
