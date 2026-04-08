// @vitest-environment jsdom
/**
 * PlayGame — reconnect session validation logic.
 *
 * Tests the wasConnected / reconnect guard introduced to handle server restarts
 * gracefully. The logic lives in a useEffect watching `connected` from useStomp:
 *
 *   - Initial connect (wasConnected=false → true): no validation call
 *   - Reconnect (wasConnected=true, connected becomes true): calls GET /sessionUsers
 *     - Success: user stays in game (no dispatch, no sessionStorage)
 *     - Failure: sets sessionStorage message and dispatches kicked()
 *   - connected=false or null: no action
 *
 * Mirrors the direct-logic testing approach used in useStomp.test.js.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { kicked } from '../../actions'

// ---------------------------------------------------------------------------
// Mirror of the useEffect body in PlayGame.jsx
// ---------------------------------------------------------------------------
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
    return true // new wasConnected value
  }
  return wasConnected
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
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

  it('sets wasConnected=true after initial connect', () => {
    const result = simulateConnectedEffect({
      connected: true,
      wasConnected: false,
      sessionId: 'abc123',
      axiosGet,
      dispatch,
    })

    expect(result).toBe(true)
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

    await Promise.resolve() // flush microtask queue

    expect(sessionStorage.getItem('pp-kicked-message')).toBe(
      'The session ended because the server was restarted.',
    )
    expect(dispatch).toHaveBeenCalledWith(kicked())
  })

  it('does not dispatch kicked() when session is still valid on reconnect', async () => {
    axiosGet.mockReturnValue(Promise.resolve({ data: ['alice', 'bob'] }))

    simulateConnectedEffect({
      connected: true,
      wasConnected: true,
      sessionId: 'abc123',
      axiosGet,
      dispatch,
    })

    await Promise.resolve()

    expect(dispatch).not.toHaveBeenCalled()
    expect(sessionStorage.getItem('pp-kicked-message')).toBeNull()
  })

  it('takes no action when connected is false', () => {
    const result = simulateConnectedEffect({
      connected: false,
      wasConnected: true,
      sessionId: 'abc123',
      axiosGet,
      dispatch,
    })

    expect(axiosGet).not.toHaveBeenCalled()
    expect(result).toBe(true) // wasConnected unchanged
  })

  it('takes no action when connected is null (not yet attempted)', () => {
    const result = simulateConnectedEffect({
      connected: null,
      wasConnected: false,
      sessionId: 'abc123',
      axiosGet,
      dispatch,
    })

    expect(axiosGet).not.toHaveBeenCalled()
    expect(result).toBe(false) // wasConnected unchanged
  })
})
