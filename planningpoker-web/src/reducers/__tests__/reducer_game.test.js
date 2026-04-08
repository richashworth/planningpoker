import { describe, it, expect } from 'vitest'
import reducer from '../reducer_game'
import {
  CREATE_GAME,
  GAME_CREATED,
  JOIN_GAME,
  LEAVE_GAME,
  USER_REGISTERED,
  USERS_UPDATED,
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

  it('sets playerName and session fields on JOIN_GAME', () => {
    const action = {
      type: JOIN_GAME,
      payload: {
        values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        schemeType: 'tshirt',
        includeUnsure: true,
        host: 'HostUser',
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

  it('resets state and sets kickedMessage on KICKED', () => {
    const active = {
      playerName: 'bob',
      sessionId: 'abc12345',
      isAdmin: false,
      isRegistered: true,
      legalEstimates: ['1', '2', '3'],
      schemeType: 'simple',
      includeUnsure: true,
      host: 'alice',
      kickedMessage: '',
    }
    const state = reducer(active, { type: KICKED })
    expect(state.isRegistered).toBe(false)
    expect(state.playerName).toBe('')
    expect(state.kickedMessage).toBe('You have been removed from the session by the host.')
  })

  it('resets to initial state on LEAVE_GAME', () => {
    const active = {
      playerName: 'alice',
      sessionId: 'abc12345',
      isAdmin: true,
      isRegistered: true,
      legalEstimates: ['1', '2', '3'],
      schemeType: 'simple',
      includeUnsure: false,
      host: 'alice',
    }
    expect(reducer(active, { type: LEAVE_GAME })).toEqual(initialState)
  })
})
