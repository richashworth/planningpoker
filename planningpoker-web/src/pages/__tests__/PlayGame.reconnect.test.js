// @vitest-environment jsdom
/**
 * PlayGame — reconnect session validation + epoch message routing.
 *
 * Mirrors the key branches of the useStomp onMessage handler so we can
 * exercise them without mounting the full component.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  kicked,
  RESET_SESSION,
  RESULTS_REPLACE,
  RESULTS_UNION,
  USER_LEFT_RECEIVED,
} from '../../actions'

function simulateConnectedEffect({ connected, wasConnected, sessionId, axiosGet, dispatch }) {
  if (connected === true) {
    if (wasConnected) {
      axiosGet(`/sessionUsers?sessionId=${sessionId}`).catch(() => {
        sessionStorage.setItem(
          'pp-kicked-message',
          'The session ended because the server was restarted.',
        )
        dispatch(kicked())
      })
    }
    return true
  }
  return wasConnected
}

// Mirrors onMessage epoch routing in PlayGame.jsx.
function routeMessage({ msg, clientRound, playerName, dispatch, labelUpdated }) {
  switch (msg.type) {
    case 'RESULTS_MESSAGE': {
      const { round, results, label } = msg.payload ?? {}
      if (typeof round !== 'number') return
      if (round > clientRound) {
        dispatch({
          type: RESULTS_REPLACE,
          payload: { round, results: results ?? [] },
          meta: { playerName },
        })
        if (label !== undefined) dispatch(labelUpdated(label))
      } else if (round === clientRound) {
        dispatch({
          type: RESULTS_UNION,
          payload: { round, results: results ?? [] },
          meta: { playerName },
        })
        if (label !== undefined) dispatch(labelUpdated(label))
      }
      return
    }
    case 'RESET_MESSAGE': {
      const round = msg.payload?.round
      if (typeof round === 'number' && round > clientRound) {
        dispatch({ type: RESET_SESSION, payload: { round } })
      }
      return
    }
    case 'USER_LEFT_MESSAGE': {
      const { round, leaver } = msg.payload ?? {}
      if (typeof round === 'number' && round === clientRound && leaver) {
        dispatch({ type: USER_LEFT_RECEIVED, payload: { leaver } })
      }
      return
    }
    default:
      return
  }
}

describe('PlayGame — reconnect session validation', () => {
  let dispatch
  let axiosGet

  beforeEach(() => {
    dispatch = vi.fn()
    axiosGet = vi.fn()
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('does not call sessionUsers on initial connect', () => {
    simulateConnectedEffect({
      connected: true,
      wasConnected: false,
      sessionId: 'abc123',
      axiosGet,
      dispatch,
    })

    expect(axiosGet).not.toHaveBeenCalled()
  })

  it('calls GET /sessionUsers on reconnect', () => {
    axiosGet.mockReturnValue(Promise.resolve({ data: ['alice'] }))

    simulateConnectedEffect({
      connected: true,
      wasConnected: true,
      sessionId: 'abc123',
      axiosGet,
      dispatch,
    })

    expect(axiosGet).toHaveBeenCalledWith('/sessionUsers?sessionId=abc123')
  })

  it('dispatches kicked() and sets sessionStorage when session is gone on reconnect', async () => {
    axiosGet.mockReturnValue(Promise.reject(new Error('404')))

    simulateConnectedEffect({
      connected: true,
      wasConnected: true,
      sessionId: 'abc123',
      axiosGet,
      dispatch,
    })

    await Promise.resolve()

    expect(sessionStorage.getItem('pp-kicked-message')).toBe(
      'The session ended because the server was restarted.',
    )
    expect(dispatch).toHaveBeenCalledWith(kicked())
  })
})

describe('PlayGame — epoch message routing', () => {
  let dispatch
  const labelUpdated = (label) => ({ type: 'label-updated', payload: label })

  beforeEach(() => {
    dispatch = vi.fn()
  })

  it('drops RESULTS_MESSAGE with older round', () => {
    routeMessage({
      msg: {
        type: 'RESULTS_MESSAGE',
        payload: { round: 1, results: [{ userName: 'alice', estimateValue: '5' }], label: '' },
      },
      clientRound: 3,
      playerName: 'alice',
      dispatch,
      labelUpdated,
    })
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('replaces on RESULTS_MESSAGE with newer round', () => {
    routeMessage({
      msg: {
        type: 'RESULTS_MESSAGE',
        payload: { round: 4, results: [{ userName: 'alice', estimateValue: '5' }], label: 'x' },
      },
      clientRound: 3,
      playerName: 'alice',
      dispatch,
      labelUpdated,
    })
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: RESULTS_REPLACE,
        payload: { round: 4, results: [{ userName: 'alice', estimateValue: '5' }] },
      }),
    )
  })

  it('unions on RESULTS_MESSAGE with equal round', () => {
    routeMessage({
      msg: {
        type: 'RESULTS_MESSAGE',
        payload: { round: 3, results: [{ userName: 'bob', estimateValue: '3' }], label: '' },
      },
      clientRound: 3,
      playerName: 'alice',
      dispatch,
      labelUpdated,
    })
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: RESULTS_UNION,
        payload: { round: 3, results: [{ userName: 'bob', estimateValue: '3' }] },
      }),
    )
  })

  it('drops RESET_MESSAGE with stale round', () => {
    routeMessage({
      msg: { type: 'RESET_MESSAGE', payload: { round: 2 } },
      clientRound: 3,
      playerName: 'alice',
      dispatch,
      labelUpdated,
    })
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('dispatches RESET_SESSION on RESET_MESSAGE with newer round', () => {
    routeMessage({
      msg: { type: 'RESET_MESSAGE', payload: { round: 4 } },
      clientRound: 3,
      playerName: 'alice',
      dispatch,
      labelUpdated,
    })
    expect(dispatch).toHaveBeenCalledWith({ type: RESET_SESSION, payload: { round: 4 } })
  })

  it('applies USER_LEFT_MESSAGE at equal round', () => {
    routeMessage({
      msg: { type: 'USER_LEFT_MESSAGE', payload: { round: 3, leaver: 'bob' } },
      clientRound: 3,
      playerName: 'alice',
      dispatch,
      labelUpdated,
    })
    expect(dispatch).toHaveBeenCalledWith({
      type: USER_LEFT_RECEIVED,
      payload: { leaver: 'bob' },
    })
  })

  it('drops USER_LEFT_MESSAGE at stale round', () => {
    routeMessage({
      msg: { type: 'USER_LEFT_MESSAGE', payload: { round: 2, leaver: 'bob' } },
      clientRound: 3,
      playerName: 'alice',
      dispatch,
      labelUpdated,
    })
    expect(dispatch).not.toHaveBeenCalled()
  })
})
