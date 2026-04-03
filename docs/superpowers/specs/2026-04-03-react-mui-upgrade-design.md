# Planning Poker Frontend: React 18 + MUI v5 Upgrade

## Summary

Big-bang upgrade of the Planning Poker frontend from React 16 + Bootstrap 3 to React 18 + MUI v5 with a dark modern theme. All class components converted to functional components with hooks. All styling moved from CSS files + Bootstrap to MUI `sx` props. Chart library upgraded to chart.js 4.

## Dependency Changes

| Package | Current | Target | Notes |
|---------|---------|--------|-------|
| react / react-dom | 16.14 | 18.x | |
| react-router-dom | 4.3 | 6.x | Switch → Routes, withRouter → useNavigate |
| react-redux | 5.1 | 8.x | connect() → useSelector/useDispatch |
| redux | 4.2 | 4.2 | No change needed |
| redux-promise | 0.6 | 0.6 | No change needed |
| chart.js | 2.9 | 4.x | Must register components explicitly |
| react-chartjs-2 | 2.11 | 5.x | |
| axios | 1.7 | 1.7 | No change needed |
| lodash | 4.17 | 4.17 | No change needed |
| react-bootstrap | 0.33 | **remove** | Replaced by MUI |
| react-stomp | 3.3 | **remove** | Replaced by custom hook |
| @mui/material | — | 5.x | **new** |
| @emotion/react | — | 11.x | **new** (MUI peer dep) |
| @emotion/styled | — | 11.x | **new** (MUI peer dep) |
| @stomp/stompjs | — | 7.x | **new** |
| sockjs-client | keep (transitive) | 1.x | Already present via react-stomp; keep as direct dep |

Bootstrap 3 CDN link removed from `index.html`. Google Fonts `Inter` added.

## Visual Design

Dark & modern theme, inspired by Linear/Vercel.

### Color Palette

- **Background**: `#0a0a0a`
- **Surface**: `#141414` (cards, inputs)
- **Surface border**: `#262626`
- **Primary accent**: `#3b82f6` (electric blue)
- **Text primary**: `#f5f5f5`
- **Text secondary**: `#a0a0a0`
- **Text muted**: `#666666`

### Typography

Inter font family for everything. Loaded from Google Fonts CDN.

### Design Principles

- Clean flat surfaces with sharp hierarchy via text color/weight
- Generous spacing — the app has little content, let it breathe
- No gradients, noise textures, or decorative elements
- Subtle hover effects: border color transitions, slight translateY lifts
- Dark surfaces differentiated by border (`#262626`), not background shade

## Component Architecture

All 10 components converted from class → functional with hooks.

```
App                          — ThemeProvider + CssBaseline + Redux Provider + BrowserRouter
├── Header                   — MUI AppBar. Brand left, session info + logout right
├── <Routes>
│   ├── /         Welcome    — Centered card, two buttons (Join / Host)
│   ├── /host     CreateGame — Centered card, name input + submit
│   ├── /join     JoinGame   — Centered card, name + session ID + submit
│   └── /game     PlayGame   — useStomp hook + GamePane
│       └── GamePane         — Toggles Vote / Results
│           ├── Vote         — Grid of vote cards + UsersTable sidebar
│           └── Results      — ResultsChart + ResultsTable sidebar + admin button
└── Footer                   — Version left, about link right
```

### File Changes

**New files:**
- `src/hooks/useStomp.js` — Custom hook replacing react-stomp
- `src/theme.js` — MUI createTheme() with dark palette

**Removed files:**
- `src/styles/Welcome.css`
- `src/styles/Create.css`
- `src/styles/Game.css`
- `src/styles/Header.css`
- `src/styles/Footer.css`

**Unchanged files:**
- `src/actions/index.js` — No React/UI dependency
- `src/reducers/*` — No React/UI dependency
- `src/config/Constants.js` — No React/UI dependency

**Modified files (all components):**
- `src/App.jsx`
- `src/pages/Welcome.jsx`
- `src/pages/CreateGame.jsx`
- `src/pages/JoinGame.jsx`
- `src/pages/PlayGame.jsx`
- `src/containers/Header.jsx`
- `src/containers/GamePane.jsx`
- `src/containers/Vote.jsx`
- `src/containers/Results.jsx`
- `src/containers/ResultsChart.jsx`
- `src/containers/ResultsTable.jsx`
- `src/containers/UsersTable.jsx`
- `src/components/Footer.jsx`
- `src/components/NameInput.jsx`

## Component Details

### Header (AppBar)

MUI `AppBar` with `position="fixed"`, no elevation. Dark background matching page (`#0a0a0a`), bottom border `#262626`. Brand text "Planning Poker" on left (Inter, semibold). When in session: player name (Typography), session ID in a `Chip`, and "Log Out" `Button` variant="text" on the right via `Toolbar`.

### Welcome Page

Full-viewport centered layout using MUI `Box` with flexbox. Two `Button` components stacked vertically: "Join Game" (variant="contained", primary blue) and "Host New Game" (variant="outlined"). Max-width constrained. Title "Planning Poker" as `Typography` variant="h3".

### Form Pages (CreateGame, JoinGame)

Centered `Card` with dark surface. MUI `TextField` with variant="outlined" for inputs. Inputs use dark-themed styling (white text on dark background). Submit `Button` variant="contained" full-width. Form validation unchanged (HTML5 pattern attribute on name input).

### NameInput Component

Functional component rendering MUI `TextField`. Props unchanged: `playerName`, `onPlayerNameInputChange`. Adds autoFocus, required, pattern validation.

### Vote View

Heading "Cast your estimate" as `Typography`. Two-column layout: main content (grid of vote cards) and sidebar (users list). Vote cards are MUI `Box` in a CSS Grid (`repeat(auto-fill, minmax(88px, 1fr))`). Each card: dark surface, `#262626` border, centered estimate text. Hover: border → `#3b82f6`, subtle translateY(-4px). Coffee break card identical but larger emoji. Clicking fires the existing `vote()` action.

### UsersTable

Dark `Card` sidebar. Title "Players". List of user names with small green dot indicators. Uses MUI `List` + `ListItem` or simple Box elements.

### Results View

Heading "Results". Two-column layout: chart area and sidebar results table. Admin "Next Item" button below chart, centered, MUI `Button` variant="contained".

### ResultsChart

chart.js 4 `Bar` with explicit component registration (`Chart.register(CategoryScale, LinearScale, BarElement)`). Dark theme options: transparent background, `#3b82f6` bars with slight opacity, grid lines `#262626`, tick labels `#a0a0a0`. Wrapped in a dark card surface with border.

### ResultsTable

Dark `Card` sidebar. MUI-styled `<table>` or simple Box elements. Columns: Player, Vote. Voted users show estimate value; not-yet-voted users show dash in muted text.

### Footer

Simple flex row. Version text on left (muted color). "About" link on right. Thin top border `#262626`. Minimal height.

### useStomp Hook

```
useStomp({ url, topics, onMessage })
```

- Creates `@stomp/stompjs` Client with SockJS as webSocketFactory in `useEffect`
- Subscribes to all topics on connect
- Calls `onMessage(JSON.parse(body))` for each incoming message
- Cleans up: unsubscribes + deactivates on unmount
- `@stomp/stompjs` handles reconnection automatically via `reconnectDelay`

### Router Migration

- `<Switch>` → `<Routes>`
- `<Route path="/host" component={CreateGame}/>` → `<Route path="/host" element={<CreateGame/>}/>`
- `withRouter(Component)` → `useNavigate()` hook inside component
- `this.props.history.push('/game')` → `navigate('/game')`
- Action callbacks that receive `history.push` now receive `navigate` instead

### Redux Migration

- `connect(mapStateToProps, actions)(Component)` → `useSelector` + `useDispatch` inside component
- Action creators unchanged — still return `{type, payload}` with axios promises
- Reducers unchanged
- Store creation unchanged

## What Doesn't Change

- All backend API endpoints and payloads
- Redux store shape, reducers, and actions
- WebSocket message format and topics
- Validation rules (3-20 char names, legal estimates whitelist)
- Vite config and proxy setup
- Build output location (`build/`)
- Gradle packaging chain (web JAR under META-INF/resources/)
