import { describe, it, expect } from 'vitest'
import reducer from '../reducer_vote'
import {
  VOTE,
  VOTE_OPTIMISTIC,
  LEAVE_GAME,
  RESET_SESSION,
  RESULTS_REPLACE,
  RESULTS_UNION,
} from '../../actions'

const replaceAction = (round, results, playerName = 'alice') => ({
  type: RESULTS_REPLACE,
  payload: { round, results },
  meta: { playerName },
})

const unionAction = (round, results, playerName = 'alice') => ({
  type: RESULTS_UNION,
  payload: { round, results },
  meta: { playerName },
})

describe('vote reducer', () => {
  it('returns false as initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toBe(false)
  })

  it('sets true on VOTE_OPTIMISTIC', () => {
    expect(
      reducer(false, { type: VOTE_OPTIMISTIC, payload: { userName: 'alice', estimateValue: '5' } }),
    ).toBe(true)
  })

  it('reverts to false on VOTE error', () => {
    expect(reducer(true, { type: VOTE, error: true, payload: new Error('fail') })).toBe(false)
  })

  it('preserves state on successful VOTE resolution not containing player', () => {
    expect(
      reducer(true, {
        type: VOTE,
        payload: { round: 1, results: [{ userName: 'bob', estimateValue: '3' }] },
        meta: { userName: 'alice' },
      }),
    ).toBe(true)
  })

  it('sets true when VOTE response contains the player', () => {
    expect(
      reducer(false, {
        type: VOTE,
        payload: { round: 1, results: [{ userName: 'alice', estimateValue: '5' }] },
        meta: { userName: 'alice' },
      }),
    ).toBe(true)
  })

  it('resets to false on LEAVE_GAME', () => {
    expect(reducer(true, { type: LEAVE_GAME })).toBe(false)
  })

  it('resets to false on RESET_SESSION', () => {
    expect(reducer(true, { type: RESET_SESSION })).toBe(false)
  })

  it('sets true when RESULTS_REPLACE contains the player', () => {
    expect(reducer(false, replaceAction(1, [{ userName: 'alice', estimateValue: '5' }]))).toBe(true)
  })

  it('sets true when RESULTS_UNION contains the player', () => {
    expect(reducer(false, unionAction(1, [{ userName: 'alice', estimateValue: '5' }]))).toBe(true)
  })

  it('preserves true when RESULTS_REPLACE does not contain the player', () => {
    expect(reducer(true, replaceAction(1, [{ userName: 'bob', estimateValue: '3' }]))).toBe(true)
  })

  describe('epoch round flow', () => {
    it('handles vote → reset → new vote across rounds', () => {
      let state = false
      state = reducer(state, {
        type: VOTE_OPTIMISTIC,
        payload: { userName: 'alice', estimateValue: '5' },
      })
      expect(state).toBe(true)

      state = reducer(state, replaceAction(1, [{ userName: 'alice', estimateValue: '5' }]))
      expect(state).toBe(true)

      state = reducer(state, { type: RESET_SESSION, payload: { round: 2 } })
      expect(state).toBe(false)

      state = reducer(state, {
        type: VOTE_OPTIMISTIC,
        payload: { userName: 'alice', estimateValue: '8' },
      })
      expect(state).toBe(true)
    })
  })
})
