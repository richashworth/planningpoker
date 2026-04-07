import { describe, it, expect } from 'vitest'
import reducer from '../reducer_vote'
import { VOTE, VOTE_OPTIMISTIC, LEAVE_GAME, RESET_SESSION, RESULTS_UPDATED } from '../../actions'

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

  it('preserves state on successful VOTE resolution', () => {
    expect(reducer(true, { type: VOTE, meta: { userName: 'alice' } })).toBe(true)
  })

  it('resets to false on LEAVE_GAME', () => {
    expect(reducer(true, { type: LEAVE_GAME })).toBe(false)
  })

  it('resets to false on RESET_SESSION (optimistic)', () => {
    expect(reducer(true, { type: RESET_SESSION })).toBe(false)
  })

  it('sets true when RESULTS_UPDATED contains the player', () => {
    const action = {
      type: RESULTS_UPDATED,
      payload: [{ userName: 'alice', estimateValue: '5' }],
      meta: { playerName: 'alice' },
    }
    expect(reducer(false, action)).toBe(true)
  })

  it('sets false when RESULTS_UPDATED does not contain the player', () => {
    const action = {
      type: RESULTS_UPDATED,
      payload: [{ userName: 'bob', estimateValue: '3' }],
      meta: { playerName: 'alice' },
    }
    expect(reducer(true, action)).toBe(false)
  })

  it('sets false when RESULTS_UPDATED has empty payload', () => {
    const action = {
      type: RESULTS_UPDATED,
      payload: [],
      meta: { playerName: 'alice' },
    }
    expect(reducer(true, action)).toBe(false)
  })
})
