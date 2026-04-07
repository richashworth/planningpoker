import React, {
  useState,
  useMemo,
  createContext,
  useContext,
  useCallback,
  lazy,
  Suspense,
} from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Provider } from 'react-redux'
import { useSelector, useDispatch } from 'react-redux'
import { applyMiddleware, compose, createStore } from 'redux'
import thunk from 'redux-thunk'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import reducer from './reducers'
import { darkTheme, lightTheme } from './theme'
import { clearError } from './actions'

import Header from './containers/Header'
import Footer from './components/Footer'

const Welcome = lazy(() => import('./pages/Welcome'))
const JoinGame = lazy(() => import('./pages/JoinGame'))
const CreateGame = lazy(() => import('./pages/CreateGame'))
const PlayGame = lazy(() => import('./pages/PlayGame'))

const middleware = [thunk]

// eslint-disable-next-line no-underscore-dangle
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

const store = createStore(reducer, composeEnhancers(applyMiddleware(...middleware)))

const ColorModeContext = createContext({ toggleColorMode: () => {}, mode: 'light' })

export function useColorMode() {
  return useContext(ColorModeContext)
}

function AppInner({ theme, toggleColorMode, mode }) {
  const errorMessage = useSelector((state) => state.notification)
  const dispatch = useDispatch()

  return (
    <ColorModeContext.Provider value={{ toggleColorMode, mode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            <Toolbar />
            <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Suspense
                fallback={
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                    <CircularProgress />
                  </Box>
                }
              >
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
        <Snackbar
          open={Boolean(errorMessage)}
          autoHideDuration={4000}
          onClose={() => dispatch(clearError())}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error" onClose={() => dispatch(clearError())}>
            {errorMessage}
          </Alert>
        </Snackbar>
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

export default function App() {
  const [mode, setMode] = useState(() => {
    const stored = localStorage.getItem('pp-theme')
    if (stored) return stored
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      return 'dark'
    return 'light'
  })

  const toggleColorMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('pp-theme', next)
      return next
    })
  }, [])

  const theme = useMemo(() => (mode === 'dark' ? darkTheme : lightTheme), [mode])

  return (
    <Provider store={store}>
      <AppInner theme={theme} toggleColorMode={toggleColorMode} mode={mode} />
    </Provider>
  )
}
