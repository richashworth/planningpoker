// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, act, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { configureStore } from '@reduxjs/toolkit'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))

import axios from 'axios'
import Vote from '../Vote'
import { renderWithStore } from '../../testUtils/renderWithStore'
import gameReducer from '../../reducers/reducer_game'
import resultsReducer from '../../reducers/reducer_results'
import usersReducer from '../../reducers/reducer_users'
import voteReducer from '../../reducers/reducer_vote'
import notificationReducer from '../../reducers/reducer_notification'
import roundsReducer from '../../reducers/reducer_rounds'
import consensusReducer from '../../reducers/reducer_consensus'

function buildStore(preloadedState) {
  return configureStore({
    reducer: {
      game: gameReducer,
      results: resultsReducer,
      users: usersReducer,
      voted: voteReducer,
      notification: notificationReducer,
      rounds: roundsReducer,
      consensus: consensusReducer,
    },
    preloadedState,
  })
}

function baseState(overrides = {}) {
  return {
    game: {
      sessionId: 'abc12345',
      playerName: 'alice',
      isAdmin: false,
      currentLabel: '',
      legalEstimates: ['1', '2', '3', '5', '8'],
      ...overrides.game,
    },
    results: overrides.results ?? [],
    users: overrides.users ?? [],
    voted: overrides.voted ?? false,
    notification: overrides.notification ?? { error: null },
    rounds: overrides.rounds ?? [],
  }
}

describe('Vote container', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders one card per legal estimate with accessible labels', () => {
    renderWithStore(<Vote />, { preloadedState: baseState() })

    expect(screen.getByLabelText('Vote 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Vote 2')).toBeInTheDocument()
    expect(screen.getByLabelText('Vote 3')).toBeInTheDocument()
    expect(screen.getByLabelText('Vote 5')).toBeInTheDocument()
    expect(screen.getByLabelText('Vote 8')).toBeInTheDocument()
  })

  it('flips voted=true in state when a card is clicked', () => {
    const { store } = renderWithStore(<Vote />, { preloadedState: baseState() })

    expect(store.getState().voted).toBe(false)
    fireEvent.click(screen.getByLabelText('Vote 5'))
    expect(store.getState().voted).toBe(true)
  })

  it('POSTs to /vote when a card is clicked', async () => {
    renderWithStore(<Vote />, { preloadedState: baseState() })

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Vote 5'))
    })

    expect(axios.post).toHaveBeenCalledWith(expect.stringMatching(/\/vote$/), expect.anything())
  })

  it('ignores subsequent clicks once a selection has been made', async () => {
    renderWithStore(<Vote />, { preloadedState: baseState() })

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Vote 3'))
    })
    axios.post.mockClear()

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Vote 8'))
    })
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('reacts to Enter key on a card', async () => {
    renderWithStore(<Vote />, { preloadedState: baseState() })

    await act(async () => {
      fireEvent.keyDown(screen.getByLabelText('Vote 2'), { key: 'Enter' })
    })

    expect(axios.post).toHaveBeenCalledWith(expect.stringMatching(/\/vote$/), expect.anything())
  })

  it('dispatches voteOptimistic synchronously before the vote thunk', async () => {
    // Pre-spy on dispatch so Vote's first render captures the spy via
    // useDispatch (which reads store.dispatch each render, and the component
    // holds the captured reference for subsequent event handlers).
    const store = buildStore(baseState())
    const dispatchSpy = vi.spyOn(store, 'dispatch')
    renderWithStore(<Vote />, { store })

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Vote 5'))
    })

    // doVote fires `voteOptimistic` (plain action) and then `vote` (thunk fn)
    // through the same dispatch. The spy records both top-level calls;
    // confirm the optimistic action lands before the thunk.
    const calls = dispatchSpy.mock.calls.map(([arg]) => arg)
    const optimisticIdx = calls.findIndex(
      (a) => a && typeof a === 'object' && a.type === 'vote-optimistic',
    )
    const thunkIdx = calls.findIndex((a) => typeof a === 'function')

    expect(optimisticIdx).toBeGreaterThanOrEqual(0)
    expect(thunkIdx).toBeGreaterThan(optimisticIdx)
    expect(calls[optimisticIdx].payload).toEqual({ userName: 'alice', estimateValue: '5' })

    dispatchSpy.mockRestore()
  })
})
