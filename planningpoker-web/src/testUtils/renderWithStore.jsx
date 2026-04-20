import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { render } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'

import gameReducer from '../reducers/reducer_game'
import resultsReducer from '../reducers/reducer_results'
import usersReducer from '../reducers/reducer_users'
import voteReducer from '../reducers/reducer_vote'
import notificationReducer from '../reducers/reducer_notification'
import roundsReducer from '../reducers/reducer_rounds'

const theme = createTheme()

export function renderWithStore(ui, { preloadedState = {}, store, ...options } = {}) {
  const realStore =
    store ??
    configureStore({
      reducer: {
        game: gameReducer,
        results: resultsReducer,
        users: usersReducer,
        voted: voteReducer,
        notification: notificationReducer,
        rounds: roundsReducer,
      },
      preloadedState,
    })

  function Wrapper({ children }) {
    return (
      <Provider store={realStore}>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </Provider>
    )
  }

  return { store: realStore, ...render(ui, { wrapper: Wrapper, ...options }) }
}
