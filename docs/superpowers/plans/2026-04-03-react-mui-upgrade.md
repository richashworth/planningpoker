# React 18 + MUI v5 Frontend Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Planning Poker frontend from React 16 + Bootstrap 3 to React 18 + MUI v5 with a dark modern theme, converting all class components to functional components with hooks.

**Architecture:** Big-bang upgrade of all dependencies and components in a coordinated pass. All styling moves from CSS files + Bootstrap CDN to MUI `sx` props and a custom dark theme. WebSocket handling moves from react-stomp to a custom hook using @stomp/stompjs.

**Tech Stack:** React 18, MUI v5, react-router-dom v6, react-redux 8, chart.js 4, @stomp/stompjs 7, Vite 5

**Spec:** `docs/superpowers/specs/2026-04-03-react-mui-upgrade-design.md`

---

## File Map

**New files:**
- `src/theme.js` — MUI dark theme configuration
- `src/hooks/useStomp.js` — Custom WebSocket hook replacing react-stomp

**Modified files:**
- `package.json` — Dependency upgrades
- `index.html` — Remove Bootstrap CDN, add Inter font
- `src/index.jsx` — React 18 createRoot API
- `src/App.jsx` — ThemeProvider, CssBaseline, Routes (v6)
- `src/containers/Header.jsx` — MUI AppBar, functional component
- `src/components/Footer.jsx` — MUI Box, functional component
- `src/components/NameInput.jsx` — MUI TextField
- `src/pages/Welcome.jsx` — MUI Box/Button, functional component
- `src/pages/CreateGame.jsx` — MUI Card/TextField/Button, useNavigate
- `src/pages/JoinGame.jsx` — MUI Card/TextField/Button, useNavigate
- `src/pages/PlayGame.jsx` — useStomp hook, useNavigate
- `src/containers/GamePane.jsx` — useSelector hook
- `src/containers/Vote.jsx` — MUI Box grid, useSelector/useDispatch
- `src/containers/Results.jsx` — MUI layout, useSelector/useDispatch
- `src/containers/ResultsChart.jsx` — chart.js 4 registered components
- `src/containers/ResultsTable.jsx` — MUI table elements
- `src/containers/UsersTable.jsx` — MUI list elements

**Removed files:**
- `src/styles/Welcome.css`
- `src/styles/Create.css`
- `src/styles/Game.css`
- `src/styles/Header.css`
- `src/styles/Footer.css`

**Unchanged files:**
- `src/actions/index.js`
- `src/reducers/index.js`
- `src/reducers/reducer_game.js`
- `src/reducers/reducer_vote.js`
- `src/reducers/reducer_results.js`
- `src/reducers/reducer_users.js`
- `src/config/Constants.js`
- `vite.config.js`

---

### Task 1: Upgrade Dependencies

**Files:**
- Modify: `planningpoker-web/package.json`
- Modify: `planningpoker-web/index.html`

- [ ] **Step 1: Update package.json with new dependencies**

Replace the entire `planningpoker-web/package.json` with:

```json
{
  "name": "planningpoker-web",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "@mui/material": "^5.15.0",
    "@stomp/stompjs": "^7.0.0",
    "axios": "^1.7.0",
    "chart.js": "^4.4.0",
    "lodash": "^4.17.21",
    "react": "^18.2.0",
    "react-chartjs-2": "^5.2.0",
    "react-dom": "^18.2.0",
    "react-redux": "^8.1.0",
    "react-router-dom": "^6.20.0",
    "redux": "^4.2.1",
    "redux-promise": "^0.6.0",
    "sockjs-client": "^1.6.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.4.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

- [ ] **Step 2: Update index.html**

Replace `planningpoker-web/index.html` with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta content="width=device-width, initial-scale=1, shrink-to-fit=no" name="viewport">
    <meta content="#0a0a0a" name="theme-color">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="/manifest.json" rel="manifest">
    <link rel="icon" href="/favicon.ico">
    <title>Planning Poker</title>
</head>
<body>
<noscript>
    You need to enable JavaScript to run this app.
</noscript>
<div id="root"></div>
<script type="module" src="/src/index.jsx"></script>
</body>
</html>
```

- [ ] **Step 3: Install dependencies**

Run: `cd planningpoker-web && rm -rf node_modules && npm install`

Expected: Clean install completes without errors. There may be peer dependency warnings — those are OK.

- [ ] **Step 4: Commit**

```bash
git add planningpoker-web/package.json planningpoker-web/package-lock.json planningpoker-web/index.html
git commit -m "chore: upgrade deps — React 18, MUI v5, chart.js 4, react-router 6"
```

---

### Task 2: Create MUI Dark Theme

**Files:**
- Create: `src/theme.js`

- [ ] **Step 1: Create the theme file**

Create `planningpoker-web/src/theme.js`:

```js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6',
    },
    background: {
      default: '#0a0a0a',
      paper: '#141414',
    },
    text: {
      primary: '#f5f5f5',
      secondary: '#a0a0a0',
      disabled: '#666666',
    },
    divider: '#262626',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    h3: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0a0a0a',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #262626',
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'medium',
      },
    },
  },
});

export default theme;
```

- [ ] **Step 2: Commit**

```bash
git add planningpoker-web/src/theme.js
git commit -m "feat: add MUI dark theme configuration"
```

---

### Task 3: Create useStomp Hook

**Files:**
- Create: `src/hooks/useStomp.js`

- [ ] **Step 1: Create the hooks directory and useStomp file**

Create `planningpoker-web/src/hooks/useStomp.js`:

```js
import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function useStomp({ url, topics, onMessage }) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!url || !topics || topics.length === 0) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(url),
      reconnectDelay: 5000,
      onConnect: () => {
        topics.forEach(topic => {
          client.subscribe(topic, (message) => {
            const body = JSON.parse(message.body);
            onMessageRef.current(body);
          });
        });
      },
    });

    client.activate();

    return () => {
      if (client.active) {
        client.deactivate();
      }
    };
  }, [url, JSON.stringify(topics)]);
}
```

- [ ] **Step 2: Commit**

```bash
git add planningpoker-web/src/hooks/useStomp.js
git commit -m "feat: add useStomp custom hook replacing react-stomp"
```

---

### Task 4: Update App Shell — index.jsx and App.jsx

**Files:**
- Modify: `src/index.jsx`
- Modify: `src/App.jsx`
- Delete: `src/styles/Welcome.css`, `src/styles/Create.css`, `src/styles/Game.css`, `src/styles/Header.css`, `src/styles/Footer.css`

- [ ] **Step 1: Update index.jsx to React 18 createRoot**

Replace `planningpoker-web/src/index.jsx` with:

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

- [ ] **Step 2: Rewrite App.jsx with MUI ThemeProvider and react-router v6**

Replace `planningpoker-web/src/App.jsx` with:

```jsx
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { applyMiddleware, compose, createStore } from 'redux';
import ReduxPromise from 'redux-promise';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import reducer from './reducers';
import theme from './theme';

import Header from './containers/Header';
import Welcome from './pages/Welcome';
import JoinGame from './pages/JoinGame';
import CreateGame from './pages/CreateGame';
import PlayGame from './pages/PlayGame';
import Footer from './components/Footer';

const middleware = [ReduxPromise];

// eslint-disable-next-line no-underscore-dangle
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  reducer,
  composeEnhancers(applyMiddleware(...middleware)),
);

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Routes>
                <Route path="/host" element={<CreateGame />} />
                <Route path="/join" element={<JoinGame />} />
                <Route path="/game" element={<PlayGame />} />
                <Route path="/" element={<Welcome />} />
              </Routes>
            </Box>
            <Footer />
          </Box>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}
```

- [ ] **Step 3: Delete old CSS files**

```bash
rm planningpoker-web/src/styles/Welcome.css
rm planningpoker-web/src/styles/Create.css
rm planningpoker-web/src/styles/Game.css
rm planningpoker-web/src/styles/Header.css
rm planningpoker-web/src/styles/Footer.css
rmdir planningpoker-web/src/styles
```

- [ ] **Step 4: Commit**

```bash
git add -A planningpoker-web/src/index.jsx planningpoker-web/src/App.jsx planningpoker-web/src/styles/
git commit -m "feat: update app shell — React 18 createRoot, MUI ThemeProvider, react-router v6"
```

---

### Task 5: Rewrite Header

**Files:**
- Modify: `src/containers/Header.jsx`

- [ ] **Step 1: Rewrite Header as functional component with MUI AppBar**

Replace `planningpoker-web/src/containers/Header.jsx` with:

```jsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import _ from 'lodash';
import { leaveGame } from '../actions';

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sessionId = useSelector(state => state.game.sessionId);
  const playerName = useSelector(state => state.game.playerName);

  const handleLogout = () => {
    dispatch(leaveGame(playerName, sessionId, () => navigate('/')));
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: '#0a0a0a',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Planning Poker
        </Typography>
        {sessionId && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {_.startCase(playerName)}
            </Typography>
            <Chip
              label={sessionId}
              size="small"
              sx={{
                bgcolor: '#1a1a1a',
                border: '1px solid',
                borderColor: 'divider',
                color: 'text.secondary',
                fontFamily: 'monospace',
              }}
            />
            <Button
              variant="text"
              size="small"
              onClick={handleLogout}
              sx={{ color: 'text.secondary', '&:hover': { color: '#ef4444' } }}
            >
              Log Out
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add planningpoker-web/src/containers/Header.jsx
git commit -m "feat: rewrite Header — MUI AppBar, functional component"
```

---

### Task 6: Rewrite Footer

**Files:**
- Modify: `src/components/Footer.jsx`

- [ ] **Step 1: Rewrite Footer as functional component with MUI**

Replace `planningpoker-web/src/components/Footer.jsx` with:

```jsx
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import axios from 'axios';
import { API_ROOT_URL } from '../config/Constants';

export default function Footer() {
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    axios.get(`${API_ROOT_URL}/version`)
      .then(res => setAppVersion(res.data));
  }, []);

  return (
    <Box
      component="footer"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
        py: 1.5,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        {appVersion ? `v${appVersion}` : ''}
      </Typography>
      <Link
        href="https://richashworth.com/blog/agile-estimation-for-distributed-teams/"
        target="_blank"
        rel="noopener noreferrer"
        sx={{ color: 'text.secondary', fontSize: '0.75rem', '&:hover': { color: 'primary.main' } }}
      >
        About
      </Link>
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add planningpoker-web/src/components/Footer.jsx
git commit -m "feat: rewrite Footer — MUI Box, functional component"
```

---

### Task 7: Rewrite NameInput

**Files:**
- Modify: `src/components/NameInput.jsx`

- [ ] **Step 1: Rewrite NameInput with MUI TextField**

Replace `planningpoker-web/src/components/NameInput.jsx` with:

```jsx
import React from 'react';
import TextField from '@mui/material/TextField';

export default function NameInput({ playerName, onPlayerNameInputChange }) {
  return (
    <TextField
      label="Name"
      value={playerName}
      onChange={onPlayerNameInputChange}
      autoFocus
      required
      fullWidth
      inputProps={{
        pattern: '.{0}|.{3,20}',
        title: 'Please enter a name between 3 and 20 characters',
      }}
      sx={{ mb: 2.5 }}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add planningpoker-web/src/components/NameInput.jsx
git commit -m "feat: rewrite NameInput — MUI TextField"
```

---

### Task 8: Rewrite Welcome Page

**Files:**
- Modify: `src/pages/Welcome.jsx`

- [ ] **Step 1: Rewrite Welcome as functional component with MUI**

Replace `planningpoker-web/src/pages/Welcome.jsx` with:

```jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

export default function Welcome() {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box sx={{ textAlign: 'center', maxWidth: 400, width: '100%', px: 2 }}>
        <Typography variant="h3" sx={{ mb: 1 }}>
          Planning Poker
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 5 }}>
          Agile estimation for distributed teams
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            component={Link}
            to="/join"
            variant="contained"
            size="large"
            fullWidth
            sx={{ py: 1.5 }}
          >
            Join Game
          </Button>
          <Button
            component={Link}
            to="/host"
            variant="outlined"
            size="large"
            fullWidth
            sx={{ py: 1.5 }}
          >
            Host New Game
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add planningpoker-web/src/pages/Welcome.jsx
git commit -m "feat: rewrite Welcome — MUI dark theme, functional component"
```

---

### Task 9: Rewrite CreateGame Page

**Files:**
- Modify: `src/pages/CreateGame.jsx`

- [ ] **Step 1: Rewrite CreateGame with MUI Card, useNavigate, useDispatch**

Replace `planningpoker-web/src/pages/CreateGame.jsx` with:

```jsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { createGame, gameCreated } from '../actions';
import NameInput from '../components/NameInput';

export default function CreateGame() {
  const [playerName, setPlayerName] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createGame(playerName, () => {
      dispatch(gameCreated());
      navigate('/game');
    }));
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
      <Card sx={{ maxWidth: 420, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, textAlign: 'center', fontWeight: 600 }}>
            Host a Game
          </Typography>
          <form onSubmit={handleSubmit}>
            <NameInput
              playerName={playerName}
              onPlayerNameInputChange={(e) => setPlayerName(e.target.value)}
            />
            <Button type="submit" variant="contained" fullWidth size="large" sx={{ py: 1.2 }}>
              Start Game
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add planningpoker-web/src/pages/CreateGame.jsx
git commit -m "feat: rewrite CreateGame — MUI Card, useNavigate, useDispatch"
```

---

### Task 10: Rewrite JoinGame Page

**Files:**
- Modify: `src/pages/JoinGame.jsx`

- [ ] **Step 1: Rewrite JoinGame with MUI Card, useNavigate, useDispatch**

Replace `planningpoker-web/src/pages/JoinGame.jsx` with:

```jsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { joinGame, userRegistered } from '../actions';
import NameInput from '../components/NameInput';

export default function JoinGame() {
  const [playerName, setPlayerName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(joinGame(playerName, sessionId, () => {
      dispatch(userRegistered());
      navigate('/game');
    }));
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
      <Card sx={{ maxWidth: 420, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, textAlign: 'center', fontWeight: 600 }}>
            Join a Game
          </Typography>
          <form onSubmit={handleSubmit}>
            <NameInput
              playerName={playerName}
              onPlayerNameInputChange={(e) => setPlayerName(e.target.value)}
            />
            <TextField
              label="Session ID"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              required
              fullWidth
              sx={{ mb: 2.5 }}
            />
            <Button type="submit" variant="contained" fullWidth size="large" sx={{ py: 1.2 }}>
              Join Game
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add planningpoker-web/src/pages/JoinGame.jsx
git commit -m "feat: rewrite JoinGame — MUI Card, useNavigate, useDispatch"
```

---

### Task 11: Rewrite PlayGame and GamePane

**Files:**
- Modify: `src/pages/PlayGame.jsx`
- Modify: `src/containers/GamePane.jsx`

- [ ] **Step 1: Rewrite PlayGame with useStomp hook and useNavigate**

Replace `planningpoker-web/src/pages/PlayGame.jsx` with:

```jsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import GamePane from '../containers/GamePane';
import useStomp from '../hooks/useStomp';
import { resultsUpdated, usersUpdated } from '../actions';
import { API_ROOT_URL } from '../config/Constants';

export default function PlayGame() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const playerName = useSelector(state => state.game.playerName);
  const sessionId = useSelector(state => state.game.sessionId);
  const isUserRegistered = useSelector(state => state.game.isRegistered);

  useEffect(() => {
    if (!isUserRegistered) {
      navigate('/');
    }
  }, [isUserRegistered, navigate]);

  useStomp({
    url: `${API_ROOT_URL}/stomp`,
    topics: [
      `/topic/items/${sessionId}`,
      `/topic/results/${sessionId}`,
      `/topic/users/${sessionId}`,
    ],
    onMessage: (msg) => {
      switch (msg.type) {
        case 'RESULTS_MESSAGE':
          return dispatch(resultsUpdated(msg.payload, playerName));
        case 'USERS_MESSAGE':
          return dispatch(usersUpdated(msg.payload));
        default:
          return;
      }
    },
  });

  return (
    <Box sx={{ maxWidth: 1100, width: '100%', mx: 'auto', p: 3, pt: 4 }}>
      <GamePane />
    </Box>
  );
}
```

- [ ] **Step 2: Rewrite GamePane as functional component**

Replace `planningpoker-web/src/containers/GamePane.jsx` with:

```jsx
import React from 'react';
import { useSelector } from 'react-redux';
import Vote from './Vote';
import Results from './Results';

export default function GamePane() {
  const voted = useSelector(state => state.voted);
  return voted ? <Results /> : <Vote />;
}
```

- [ ] **Step 3: Commit**

```bash
git add planningpoker-web/src/pages/PlayGame.jsx planningpoker-web/src/containers/GamePane.jsx
git commit -m "feat: rewrite PlayGame + GamePane — useStomp hook, useNavigate, useSelector"
```

---

### Task 12: Rewrite UsersTable

**Files:**
- Modify: `src/containers/UsersTable.jsx`

- [ ] **Step 1: Rewrite UsersTable with MUI**

Replace `planningpoker-web/src/containers/UsersTable.jsx` with:

```jsx
import React from 'react';
import { useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import _ from 'lodash';

export default function UsersTable({ heading }) {
  const users = useSelector(state => state.users);
  const currentUser = useSelector(state => state.game.playerName);

  const allUsers = _.union([currentUser], users).map(_.startCase).sort();

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2.5,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{ color: 'text.secondary', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}
      >
        {heading}
      </Typography>
      {allUsers.map(name => (
        <Box key={name} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.6 }}>
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              bgcolor: '#22c55e',
              boxShadow: '0 0 6px rgba(34,197,94,0.4)',
              flexShrink: 0,
            }}
          />
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {name}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add planningpoker-web/src/containers/UsersTable.jsx
git commit -m "feat: rewrite UsersTable — MUI Box, useSelector"
```

---

### Task 13: Rewrite Vote View

**Files:**
- Modify: `src/containers/Vote.jsx`

- [ ] **Step 1: Rewrite Vote with MUI grid of vote cards**

Replace `planningpoker-web/src/containers/Vote.jsx` with:

```jsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { vote } from '../actions';
import UsersTable from './UsersTable';
import { COFFEE_SYMBOL, LEGAL_ESTIMATES } from '../config/Constants';

const voteCardSx = {
  aspectRatio: '3 / 4',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.3rem',
  fontWeight: 700,
  color: 'text.primary',
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
  cursor: 'pointer',
  userSelect: 'none',
  transition: 'all 0.15s ease-out',
  '&:hover': {
    borderColor: 'primary.main',
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(59,130,246,0.15)',
  },
  '&:active': {
    transform: 'translateY(-1px)',
  },
};

export default function Vote() {
  const dispatch = useDispatch();
  const sessionId = useSelector(state => state.game.sessionId);
  const playerName = useSelector(state => state.game.playerName);

  const doVote = (val) => dispatch(vote(playerName, sessionId, val));

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2.5 }}>
        Cast your estimate
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 3, alignItems: 'start' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
            gap: 1,
          }}
        >
          {LEGAL_ESTIMATES.map(val => (
            <Box key={val} sx={voteCardSx} onClick={() => doVote(val)}>
              {val}
            </Box>
          ))}
          <Box sx={{ ...voteCardSx, fontSize: '1.7rem' }} onClick={() => doVote(COFFEE_SYMBOL)}>
            {COFFEE_SYMBOL}
          </Box>
        </Box>
        <UsersTable heading="Players" />
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add planningpoker-web/src/containers/Vote.jsx
git commit -m "feat: rewrite Vote — MUI grid of vote cards, useSelector/useDispatch"
```

---

### Task 14: Rewrite ResultsChart

**Files:**
- Modify: `src/containers/ResultsChart.jsx`

- [ ] **Step 1: Rewrite ResultsChart with chart.js 4 registered components**

Replace `planningpoker-web/src/containers/ResultsChart.jsx` with:

```jsx
import React from 'react';
import { useSelector } from 'react-redux';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { LEGAL_ESTIMATES } from '../config/Constants';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function ResultsChart() {
  const results = useSelector(state => state.results);

  const estimates = results.map(x => x.estimateValue);
  const aggregateData = LEGAL_ESTIMATES.map(x => estimates.filter(y => y === x).length);

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: Math.max(...aggregateData) < 8 ? 1 : undefined,
          color: '#a0a0a0',
        },
        grid: {
          color: '#262626',
        },
        border: {
          color: '#262626',
        },
      },
      x: {
        ticks: {
          color: '#a0a0a0',
        },
        grid: {
          color: 'transparent',
        },
        border: {
          color: '#262626',
        },
      },
    },
  };

  const data = {
    labels: LEGAL_ESTIMATES,
    datasets: [{
      data: aggregateData,
      backgroundColor: 'rgba(59, 130, 246, 0.35)',
      borderColor: 'rgba(59, 130, 246, 0.7)',
      borderWidth: 1,
      borderRadius: 4,
      hoverBackgroundColor: 'rgba(59, 130, 246, 0.55)',
    }],
  };

  return <Bar options={options} data={data} />;
}
```

- [ ] **Step 2: Commit**

```bash
git add planningpoker-web/src/containers/ResultsChart.jsx
git commit -m "feat: rewrite ResultsChart — chart.js 4 with registered components"
```

---

### Task 15: Rewrite ResultsTable

**Files:**
- Modify: `src/containers/ResultsTable.jsx`

- [ ] **Step 1: Rewrite ResultsTable with MUI**

Replace `planningpoker-web/src/containers/ResultsTable.jsx` with:

```jsx
import React from 'react';
import { useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import _ from 'lodash';

export default function ResultsTable() {
  const results = useSelector(state => state.results);
  const users = useSelector(state => state.users);

  const notVoted = _.difference(users, results.map(x => x.userName));

  const voteFreqs = _.countBy(results, x => x.estimateValue);
  const countedResults = results.map(x => ({ ...x, count: voteFreqs[parseInt(x.estimateValue, 10)] }));
  const sortedResults = _.orderBy(countedResults, ['count', 'estimateValue', 'userName'], ['asc', 'asc', 'asc']);

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2.5,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{ color: 'text.secondary', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}
      >
        Votes
      </Typography>
      <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <Box component="th" sx={{ textAlign: 'left', pb: 1, fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600, borderBottom: '1px solid', borderColor: 'divider' }}>
              Player
            </Box>
            <Box component="th" sx={{ textAlign: 'right', pb: 1, fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600, borderBottom: '1px solid', borderColor: 'divider' }}>
              Vote
            </Box>
          </tr>
        </thead>
        <tbody>
          {sortedResults.map(x => (
            <tr key={x.userName}>
              <Box component="td" sx={{ py: 0.6, fontSize: '0.88rem', color: 'text.primary' }}>
                {_.startCase(x.userName)}
              </Box>
              <Box component="td" sx={{ py: 0.6, fontSize: '0.88rem', color: 'text.primary', textAlign: 'right', fontWeight: 700 }}>
                {x.estimateValue}
              </Box>
            </tr>
          ))}
          {notVoted.map(x => (
            <tr key={x}>
              <Box component="td" sx={{ py: 0.6, fontSize: '0.88rem', color: 'text.disabled', fontStyle: 'italic' }}>
                {_.startCase(x)}
              </Box>
              <Box component="td" sx={{ py: 0.6, fontSize: '0.88rem', color: 'text.disabled', textAlign: 'right' }}>
                —
              </Box>
            </tr>
          ))}
        </tbody>
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add planningpoker-web/src/containers/ResultsTable.jsx
git commit -m "feat: rewrite ResultsTable — MUI styled table, useSelector"
```

---

### Task 16: Rewrite Results View

**Files:**
- Modify: `src/containers/Results.jsx`

- [ ] **Step 1: Rewrite Results with MUI layout**

Replace `planningpoker-web/src/containers/Results.jsx` with:

```jsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ResultsTable from './ResultsTable';
import ResultsChart from './ResultsChart';
import { resetSession } from '../actions';

export default function Results() {
  const dispatch = useDispatch();
  const isAdmin = useSelector(state => state.game.isAdmin);
  const sessionId = useSelector(state => state.game.sessionId);
  const playerName = useSelector(state => state.game.playerName);

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2.5 }}>
        Results
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 3, alignItems: 'start' }}>
        <Box>
          <Box
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              p: 2.5,
              mb: 3,
            }}
          >
            <ResultsChart />
          </Box>
          {isAdmin && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => dispatch(resetSession(playerName, sessionId))}
                sx={{ px: 4, py: 1.2 }}
              >
                Next Item
              </Button>
            </Box>
          )}
        </Box>
        <ResultsTable />
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add planningpoker-web/src/containers/Results.jsx
git commit -m "feat: rewrite Results — MUI layout, useSelector/useDispatch"
```

---

### Task 17: Build Verification

- [ ] **Step 1: Run the Vite build**

Run: `cd planningpoker-web && npm run build`

Expected: Build completes without errors.

- [ ] **Step 2: Run the full Gradle build (frontend + backend + tests)**

Run: `cd .. && ./gradlew clean build`

Expected: BUILD SUCCESSFUL. All backend tests pass. The boot jar is created at `planningpoker-api/build/libs/planningpoker-api-*.jar`.

- [ ] **Step 3: Fix any issues found**

If the build fails, fix the issue in the relevant file and re-run. Common issues:
- Import paths that changed
- chart.js 4 API differences (legend/tooltip options moved under `plugins`)
- SockJS import path

- [ ] **Step 4: Commit any fixes**

```bash
git add -A planningpoker-web/src/
git commit -m "fix: resolve build issues from upgrade"
```

---

### Task 18: Responsive Layout Fix

After build verification, check that the game layout doesn't break on narrow viewports.

- [ ] **Step 1: Add responsive breakpoints to Vote and Results grid layouts**

In `planningpoker-web/src/containers/Vote.jsx`, update the outer grid Box sx:

```jsx
sx={{
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: '1fr 260px' },
  gap: 3,
  alignItems: 'start',
}}
```

In `planningpoker-web/src/containers/Results.jsx`, apply the same responsive change to the outer grid Box sx:

```jsx
sx={{
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: '1fr 260px' },
  gap: 3,
  alignItems: 'start',
}}
```

- [ ] **Step 2: Add toolbar offset to main content**

The fixed AppBar overlaps content. In `planningpoker-web/src/App.jsx`, add a Toolbar spacer after `<Header />`:

```jsx
import Toolbar from '@mui/material/Toolbar';
```

Then inside the JSX, after `<Header />`:

```jsx
<Header />
<Toolbar /> {/* spacer for fixed AppBar */}
```

- [ ] **Step 3: Run build to verify**

Run: `cd planningpoker-web && npm run build`

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add planningpoker-web/src/containers/Vote.jsx planningpoker-web/src/containers/Results.jsx planningpoker-web/src/App.jsx
git commit -m "fix: responsive grid layouts and AppBar offset"
```

---

### Task 19: Final Cleanup

- [ ] **Step 1: Verify no old imports remain**

Run: `grep -r "react-bootstrap\|react-stomp\|\.css'" planningpoker-web/src/`

Expected: No matches. If any remain, remove the import and update the component.

- [ ] **Step 2: Verify no unused dependencies in node_modules**

Run: `cd planningpoker-web && npx depcheck --ignores="@vitejs/plugin-react,vite"`

Expected: No unused dependencies listed (or only false positives from vite config).

- [ ] **Step 3: Run final full build**

Run: `cd .. && ./gradlew clean build`

Expected: BUILD SUCCESSFUL.

- [ ] **Step 4: Commit any cleanup**

```bash
git add -A planningpoker-web/
git commit -m "chore: final cleanup — remove stale imports and dependencies"
```
