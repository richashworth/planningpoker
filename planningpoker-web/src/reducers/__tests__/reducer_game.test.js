import { describe, it, expect } from 'vitest'
import reducer from '../reducer_game'
import {
  CREATE_GAME,
  GAME_CREATED,
  JOIN_GAME,
  LEAVE_GAME,
  RESET_SESSION,
  RESULTS_REPLACE,
  USER_REGISTERED,
  USERS_UPDATED,
  VOTE,
  KICKED,
} from '../../actions'

const initialState = {
  playerName: '',
  sessionId: '',
  isAdmin: false,
  isRegistered: false,
  legalEstimates: [],
  schemeType: 'fibonacci',
  includeUnsure: true,
  host: '',
  kickedMessage: '',
  currentLabel: '',
  clientRound: 0,
}

describe('game reducer', () => {
  it('returns initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState)
  })

  it('sets playerName and session fields on CREATE_GAME', () => {
    const action = {
      type: CREATE_GAME,
      payload: {
        sessionId: 'abc12345',
        values: ['1', '2', '3'],
        schemeType: 'simple',
        includeUnsure: false,
        host: 'alice',
        round: 0,
        label: '',
      },
      meta: { userName: 'alice' },
    }
    const state = reducer(initialState, action)
    expect(state.playerName).toBe('alice')
    expect(state.sessionId).toBe('abc12345')
    expect(state.legalEstimates).toEqual(['1', '2', '3'])
    expect(state.schemeType).toBe('simple')
    expect(state.includeUnsure).toBe(false)
    expect(state.host).toBe('alice')
    expect(state.clientRound).toBe(0)
  })

  it('returns current state on CREATE_GAME with error', () => {
    const action = { type: CREATE_GAME, error: true, payload: new Error('fail') }
    expect(reducer(initialState, action)).toEqual(initialState)
  })

  it('sets isAdmin and isRegistered on GAME_CREATED', () => {
    const state = reducer(initialState, { type: GAME_CREATED })
    expect(state.isAdmin).toBe(true)
    expect(state.isRegistered).toBe(true)
  })

  it('sets isRegistered on USER_REGISTERED', () => {
    const state = reducer(initialState, { type: USER_REGISTERED })
    expect(state.isRegistered).toBe(true)
  })

  it('sets playerName, round, and label on JOIN_GAME', () => {
    const action = {
      type: JOIN_GAME,
      payload: {
        values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        schemeType: 'tshirt',
        includeUnsure: true,
        host: 'HostUser',
        round: 4,
        label: 'Sprint 2',
      },
      meta: { userName: 'bob', sessionId: 'xyz98765' },
    }
    const state = reducer(initialState, action)
    expect(state.playerName).toBe('bob')
    expect(state.sessionId).toBe('xyz98765')
    expect(state.legalEstimates).toEqual(['XS', 'S', 'M', 'L', 'XL', 'XXL'])
    expect(state.schemeType).toBe('tshirt')
    expect(state.includeUnsure).toBe(true)
    expect(state.host).toBe('HostUser')
    expect(state.clientRound).toBe(4)
    expect(state.currentLabel).toBe('Sprint 2')
  })

  it('returns current state on JOIN_GAME with error', () => {
    const action = { type: JOIN_GAME, error: true, payload: new Error('fail') }
    expect(reducer(initialState, action)).toEqual(initialState)
  })

  it('updates host on USERS_UPDATED', () => {
    const action = {
      type: USERS_UPDATED,
      payload: { users: ['alice', 'bob'], host: 'bob' },
    }
    const state = reducer(initialState, action)
    expect(state.host).toBe('bob')
  })

  it('bumps clientRound on RESULTS_REPLACE', () => {
    const state = reducer(
      { ...initialState, clientRound: 1 },
      { type: RESULTS_REPLACE, payload: { round: 5, results: [] } },
    )
    expect(state.clientRound).toBe(5)
  })

  it('bumps clientRound on VOTE success', () => {
    const state = reducer(
      { ...initialState, clientRound: 2 },
      {
        type: VOTE,
        payload: { round: 3, results: [] },
        meta: { userName: 'alice', estimateValue: '5' },
      },
    )
    expect(state.clientRound).toBe(3)
  })

  it('bumps clientRound on RESET_SESSION with round payload', () => {
    const state = reducer(
      { ...initialState, clientRound: 1, currentLabel: 'Sprint 1' },
      { type: RESET_SESSION, payload: { round: 2 } },
    )
    expect(state.clientRound).toBe(2)
    expect(state.currentLabel).toBe('')
  })

  it('clientRound is monotonically non-decreasing across sequence', () => {
    let state = initialState
    state = reducer(state, { type: RESULTS_REPLACE, payload: { round: 1, results: [] } })
    expect(state.clientRound).toBe(1)
    state = reducer(state, { type: RESET_SESSION, payload: { round: 2 } })
    expect(state.clientRound).toBe(2)
    state = reducer(state, {
      type: VOTE,
      payload: { round: 2, results: [] },
      meta: { userName: 'alice', estimateValue: '5' },
    })
    expect(state.clientRound).toBe(2)
  })

  it('resets state and sets kickedMessage on KICKED', () => {
    const active = {
      ...initialState,
      playerName: 'bob',
      sessionId: 'abc12345',
      isRegistered: true,
      legalEstimates: ['1', '2', '3'],
      schemeType: 'simple',
      includeUnsure: true,
      host: 'alice',
      clientRound: 5,
    }
    const state = reducer(active, { type: KICKED })
    expect(state.isRegistered).toBe(false)
    expect(state.playerName).toBe('')
    expect(state.clientRound).toBe(0)
    expect(state.kickedMessage).toBe('You have been removed from the session by the host.')
  })

  it('resets to initial state on LEAVE_GAME', () => {
    const active = {
      ...initialState,
      playerName: 'alice',
      sessionId: 'abc12345',
      isAdmin: true,
      isRegistered: true,
      clientRound: 3,
    }
    expect(reducer(active, { type: LEAVE_GAME })).toEqual(initialState)
  })
})
