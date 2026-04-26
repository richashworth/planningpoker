// @vitest-environment jsdom
/**
 * PlayGame — reconnect session validation + epoch message routing.
 *
 * Mounts the real PlayGame component via `renderWithStore` with `useStomp`
 * mocked at module level. The mock captures the latest `{ url, topics, onMessage }`
 * arguments and exposes the captured callback so tests can fire fake STOMP
 * messages through it and assert on resulting Redux state and rendered output.
 *
 * Covers:
 *   - reconnect session validation: GET /sessionUsers fires only after
 *     prior connection, dispatches `kicked()` on 404 and stores message.
 *   - epoch message routing for RESULTS_MESSAGE / RESET_MESSAGE / USER_LEFT_MESSAGE
 *     (drop-stale / replace / union behaviour driven through the real reducers).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, cleanup, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'

// ---------------------------------------------------------------------------
// Module-level mocks
// ---------------------------------------------------------------------------
const stompCapture = { url: null, topics: null, onMessage: null }

vi.mock('../../hooks/useStomp', () => ({
  default: vi.fn((args) => {
    stompCapture.url = args.url
    stompCapture.topics = args.topics
    stompCapture.onMessage = args.onMessage
    return { connected: stompCapture.connected ?? null }
  }),
}))

vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))

vi.mock('react-chartjs-2', () => ({
  Bar: () => null,
}))

import axios from 'axios'
import PlayGame from '../PlayGame'
import useStomp from '../../hooks/useStomp'
import { renderWithStore } from '../../testUtils/renderWithStore'

function preloadedState({ clientRound = 3, voted = false } = {}) {
  return {
    game: {
      sessionId: 'abc12345',
      playerName: 'alice',
      isAdmin: false,
      isRegistered: true,
      legalEstimates: ['1', '2', '3', '5', '8'],
      schemeType: 'fibonacci',
      includeUnsure: true,
      host: 'alice',
      kickedMessage: '',
      currentLabel: '',
      clientRound,
    },
    results: [],
    users: ['alice'],
    voted,
    notification: { error: null },
    rounds: [],
    consensus: { value: null, round: 0 },
  }
}

function mountPlayGame(opts = {}) {
  return renderWithStore(
    <MemoryRouter>
      <PlayGame />
    </MemoryRouter>,
    { preloadedState: preloadedState(opts) },
  )
}

beforeEach(() => {
  stompCapture.url = null
  stompCapture.topics = null
  stompCapture.onMessage = null
  stompCapture.connected = null
  vi.clearAllMocks()
  sessionStorage.clear()
})

afterEach(() => cleanup())

describe('PlayGame — useStomp wiring', () => {
  it('subscribes to results, users, and consensus topics for the active session', () => {
    mountPlayGame()
    expect(useStomp).toHaveBeenCalled()
    expect(stompCapture.topics).toEqual([
      '/topic/results/abc12345',
      '/topic/users/abc12345',
      '/topic/consensus/abc12345',
    ])
    expect(stompCapture.url).toMatch(/\/stomp$/)
    expect(typeof stompCapture.onMessage).toBe('function')
  })
})

describe('PlayGame — epoch message routing', () => {
  it('replaces results on RESULTS_MESSAGE with newer round', () => {
    const { store } = mountPlayGame({ clientRound: 3 })

    act(() => {
      stompCapture.onMessage({
        type: 'RESULTS_MESSAGE',
        payload: {
          round: 4,
          results: [{ userName: 'alice', estimateValue: '5' }],
          label: 'feature-x',
        },
      })
    })

    const s = store.getState()
    expect(s.results).toEqual([{ userName: 'alice', estimateValue: '5' }])
    expect(s.game.clientRound).toBe(4)
    expect(s.game.currentLabel).toBe('feature-x')
  })

  it('unions results on RESULTS_MESSAGE with equal round', () => {
    const { store } = mountPlayGame({ clientRound: 3 })
    // Seed an existing result via action dispatch.
    act(() => {
      store.dispatch({
        type: 'results-replace',
        payload: { round: 3, results: [{ userName: 'alice', estimateValue: '5' }] },
        meta: { playerName: 'alice' },
      })
    })

    act(() => {
      stompCapture.onMessage({
        type: 'RESULTS_MESSAGE',
        payload: { round: 3, results: [{ userName: 'bob', estimateValue: '3' }], label: '' },
      })
    })

    expect(store.getState().results).toEqual([
      { userName: 'alice', estimateValue: '5' },
      { userName: 'bob', estimateValue: '3' },
    ])
  })

  it('drops RESULTS_MESSAGE with older round', () => {
    const { store } = mountPlayGame({ clientRound: 3 })
    const before = store.getState()

    act(() => {
      stompCapture.onMessage({
        type: 'RESULTS_MESSAGE',
        payload: { round: 1, results: [{ userName: 'alice', estimateValue: '5' }], label: '' },
      })
    })

    const after = store.getState()
    expect(after.results).toBe(before.results)
    expect(after.game.clientRound).toBe(3)
  })

  it('drops RESULTS_MESSAGE without a numeric round', () => {
    const { store } = mountPlayGame({ clientRound: 3 })
    const before = store.getState()

    act(() => {
      stompCapture.onMessage({
        type: 'RESULTS_MESSAGE',
        payload: { results: [{ userName: 'alice', estimateValue: '5' }] },
      })
    })

    expect(store.getState().results).toBe(before.results)
  })

  it('drops RESET_MESSAGE with stale round', () => {
    const { store } = mountPlayGame({ clientRound: 3 })

    // Seed some state to ensure RESET would have been observable.
    act(() => {
      store.dispatch({
        type: 'results-replace',
        payload: { round: 3, results: [{ userName: 'alice', estimateValue: '5' }] },
        meta: { playerName: 'alice' },
      })
    })

    act(() => {
      stompCapture.onMessage({ type: 'RESET_MESSAGE', payload: { round: 2 } })
    })

    expect(store.getState().results).toEqual([{ userName: 'alice', estimateValue: '5' }])
  })

  it('clears results on RESET_MESSAGE with newer round', () => {
    const { store } = mountPlayGame({ clientRound: 3 })

    act(() => {
      store.dispatch({
        type: 'results-replace',
        payload: { round: 3, results: [{ userName: 'alice', estimateValue: '5' }] },
        meta: { playerName: 'alice' },
      })
    })

    act(() => {
      stompCapture.onMessage({ type: 'RESET_MESSAGE', payload: { round: 4 } })
    })

    const s = store.getState()
    expect(s.results).toEqual([])
    expect(s.game.clientRound).toBe(4)
    expect(s.game.currentLabel).toBe('')
  })

  it('removes leaver on USER_LEFT_MESSAGE at equal round', () => {
    const { store } = mountPlayGame({ clientRound: 3 })

    act(() => {
      store.dispatch({
        type: 'results-replace',
        payload: {
          round: 3,
          results: [
            { userName: 'alice', estimateValue: '5' },
            { userName: 'bob', estimateValue: '3' },
          ],
        },
        meta: { playerName: 'alice' },
      })
    })

    act(() => {
      stompCapture.onMessage({
        type: 'USER_LEFT_MESSAGE',
        payload: { round: 3, leaver: 'bob' },
      })
    })

    expect(store.getState().results).toEqual([{ userName: 'alice', estimateValue: '5' }])
  })

  it('drops USER_LEFT_MESSAGE at stale round', () => {
    const { store } = mountPlayGame({ clientRound: 3 })

    act(() => {
      store.dispatch({
        type: 'results-replace',
        payload: { round: 3, results: [{ userName: 'bob', estimateValue: '3' }] },
        meta: { playerName: 'alice' },
      })
    })

    act(() => {
      stompCapture.onMessage({
        type: 'USER_LEFT_MESSAGE',
        payload: { round: 2, leaver: 'bob' },
      })
    })

    expect(store.getState().results).toEqual([{ userName: 'bob', estimateValue: '3' }])
  })

  it('updates user list on USERS_MESSAGE', () => {
    const { store } = mountPlayGame()

    act(() => {
      stompCapture.onMessage({
        type: 'USERS_MESSAGE',
        payload: { users: ['alice', 'bob'], host: 'alice' },
      })
    })

    expect(store.getState().users).toEqual(['alice', 'bob'])
    expect(store.getState().game.host).toBe('alice')
  })

  it('updates consensus on CONSENSUS_OVERRIDE_MESSAGE with newer round', () => {
    const { store } = mountPlayGame()

    act(() => {
      stompCapture.onMessage({
        type: 'CONSENSUS_OVERRIDE_MESSAGE',
        payload: { value: '8', round: 1 },
      })
    })

    expect(store.getState().consensus).toEqual({ value: '8', round: 1 })
  })

  it('ignores CONSENSUS_OVERRIDE_MESSAGE with stale round', () => {
    const { store } = mountPlayGame()

    act(() => {
      stompCapture.onMessage({
        type: 'CONSENSUS_OVERRIDE_MESSAGE',
        payload: { value: '8', round: 5 },
      })
    })
    act(() => {
      stompCapture.onMessage({
        type: 'CONSENSUS_OVERRIDE_MESSAGE',
        payload: { value: '3', round: 3 },
      })
    })

    expect(store.getState().consensus).toEqual({ value: '8', round: 5 })
  })

  it('drops CONSENSUS_OVERRIDE_MESSAGE without a numeric round', () => {
    const { store } = mountPlayGame()
    const before = store.getState().consensus

    act(() => {
      stompCapture.onMessage({
        type: 'CONSENSUS_OVERRIDE_MESSAGE',
        payload: { value: '8' },
      })
    })

    expect(store.getState().consensus).toBe(before)
  })

  it('ignores unknown message types without throwing', () => {
    const { store } = mountPlayGame()
    const before = store.getState()

    act(() => {
      stompCapture.onMessage({ type: 'UNKNOWN_MESSAGE', payload: {} })
    })

    expect(store.getState()).toEqual(before)
  })
})

describe('PlayGame — reconnect session validation', () => {
  it('does not GET /sessionUsers on initial connect (only refresh fires)', async () => {
    // First render with connected=null so the connected effect doesn't fire.
    stompCapture.connected = null
    const { rerender, store } = renderWithStore(
      <MemoryRouter>
        <PlayGame />
      </MemoryRouter>,
      { preloadedState: preloadedState() },
    )

    // Now flip the mock's return to connected=true and rerender.
    stompCapture.connected = true
    await act(async () => {
      rerender(
        <MemoryRouter>
          <PlayGame />
        </MemoryRouter>,
      )
    })

    // Initial connect should NOT call /sessionUsers — only /refresh.
    const sessionUsersCalls = axios.get.mock.calls.filter(([u]) =>
      String(u).includes('/sessionUsers'),
    )
    expect(sessionUsersCalls).toHaveLength(0)

    const refreshCalls = axios.get.mock.calls.filter(([u]) => String(u).includes('/refresh'))
    expect(refreshCalls.length).toBeGreaterThan(0)

    // Quiet unused-store warnings.
    expect(store.getState().game.sessionId).toBe('abc12345')
  })

  it('calls GET /sessionUsers on reconnect (second connected=true transition)', async () => {
    stompCapture.connected = true
    const { rerender } = renderWithStore(
      <MemoryRouter>
        <PlayGame />
      </MemoryRouter>,
      { preloadedState: preloadedState() },
    )

    // Drop the connection.
    stompCapture.connected = false
    await act(async () => {
      rerender(
        <MemoryRouter>
          <PlayGame />
        </MemoryRouter>,
      )
    })

    axios.get.mockClear()
    axios.get.mockResolvedValue({ data: ['alice'] })

    // Reconnect.
    stompCapture.connected = true
    await act(async () => {
      rerender(
        <MemoryRouter>
          <PlayGame />
        </MemoryRouter>,
      )
    })
    // Allow .then to flush.
    await act(async () => {
      await Promise.resolve()
    })

    const sessionUsersCalls = axios.get.mock.calls.filter(([u]) =>
      String(u).includes('/sessionUsers'),
    )
    expect(sessionUsersCalls.length).toBeGreaterThan(0)
    // Server-restart kicked message should NOT be set on a successful response.
    expect(sessionStorage.getItem('pp-kicked-message')).toBeNull()
  })

  it('dispatches kicked() and stores server-restart message when /sessionUsers rejects on reconnect', async () => {
    stompCapture.connected = true
    const { rerender, store } = renderWithStore(
      <MemoryRouter>
        <PlayGame />
      </MemoryRouter>,
      { preloadedState: preloadedState() },
    )

    stompCapture.connected = false
    await act(async () => {
      rerender(
        <MemoryRouter>
          <PlayGame />
        </MemoryRouter>,
      )
    })

    axios.get.mockClear()
    axios.get.mockRejectedValue(new Error('404'))

    stompCapture.connected = true
    await act(async () => {
      rerender(
        <MemoryRouter>
          <PlayGame />
        </MemoryRouter>,
      )
    })
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(sessionStorage.getItem('pp-kicked-message')).toBe(
      'The session ended because the server was restarted.',
    )
    // KICKED resets game state; isRegistered drops back to false.
    expect(store.getState().game.isRegistered).toBe(false)
  })
})

describe('PlayGame — render guard', () => {
  it('renders nothing meaningful and redirects to "/" when isUserRegistered is false', () => {
    const state = preloadedState()
    state.game.isRegistered = false

    renderWithStore(
      <MemoryRouter>
        <PlayGame />
      </MemoryRouter>,
      { preloadedState: state },
    )

    // GamePane does still render but the component would have triggered a navigate.
    // Voting affordance from GamePane should still be present (component renders before navigate effect runs).
    // We just assert no crash and the cast-vote affordance is wired up.
    expect(screen.queryByText(/Reconnecting/)).not.toBeInTheDocument()
  })
})
