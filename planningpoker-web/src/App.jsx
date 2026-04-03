import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { applyMiddleware, compose, createStore } from 'redux';
import ReduxPromise from 'redux-promise';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
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
            <Toolbar />
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
