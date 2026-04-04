import React, { useState, useMemo, createContext, useContext, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { applyMiddleware, compose, createStore } from 'redux';
import ReduxPromise from 'redux-promise';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import reducer from './reducers';
import { darkTheme, lightTheme } from './theme';

import Header from './containers/Header';
import Footer from './components/Footer';

const Welcome = lazy(() => import('./pages/Welcome'));
const JoinGame = lazy(() => import('./pages/JoinGame'));
const CreateGame = lazy(() => import('./pages/CreateGame'));
const PlayGame = lazy(() => import('./pages/PlayGame'));

const middleware = [ReduxPromise];

// eslint-disable-next-line no-underscore-dangle
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  reducer,
  composeEnhancers(applyMiddleware(...middleware)),
);

const SettingsContext = createContext({
  mode: 'dark',
  cardStyle: 'rounded',
  toggleColorMode: () => {},
  setCardStyle: () => {},
});

export function useSettings() {
  return useContext(SettingsContext);
}

export default function App() {
  const [mode, setMode] = useState(() => localStorage.getItem('pp-theme') || 'dark');
  const [cardStyle, setCardStyleState] = useState(() => localStorage.getItem('pp-card-style') || 'rounded');

  const toggleColorMode = useCallback(() => {
    setMode(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('pp-theme', next);
      return next;
    });
  }, []);

  const setCardStyle = useCallback((style) => {
    setCardStyleState(style);
    localStorage.setItem('pp-card-style', style);
  }, []);

  const theme = useMemo(() => mode === 'dark' ? darkTheme : lightTheme, [mode]);

  return (
    <Provider store={store}>
      <SettingsContext.Provider value={{ mode, cardStyle, toggleColorMode, setCardStyle }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Header />
              <Toolbar />
              <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Suspense fallback={null}>
                <Routes>
                  <Route path="/host" element={<CreateGame />} />
                  <Route path="/join" element={<JoinGame />} />
                  <Route path="/game" element={<PlayGame />} />
                  <Route path="/" element={<Welcome />} />
                </Routes>
              </Suspense>
              </Box>
              <Footer />
            </Box>
          </BrowserRouter>
        </ThemeProvider>
      </SettingsContext.Provider>
    </Provider>
  );
}
