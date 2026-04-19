import { describe, it, expect } from 'vitest'
import reducer from '../reducer_results'
import {
  LEAVE_GAME,
  RESET_SESSION,
  RESULTS_REPLACE,
  RESULTS_UNION,
  USER_LEFT_RECEIVED,
  VOTE,
  VOTE_OPTIMISTIC,
} from '../../actions'

const replace = (round, results) => ({
  type: RESULTS_REPLACE,
  payload: { round, results },
  meta: { playerName: 'alice' },
})

const union = (round, results) => ({
  type: RESULTS_UNION,
  payload: { round, results },
  meta: { playerName: 'alice' },
})

describe('results reducer', () => {
  it('returns [] as initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual([])
  })

  it('replaces state on RESULTS_REPLACE', () => {
    const results = [{ userName: 'alice', estimateValue: '5' }]
    expect(reducer([], replace(1, results))).toEqual(results)
  })

  it('unions with existing state on RESULTS_UNION', () => {
    const existing = [{ userName: 'alice', estimateValue: '5' }]
    const incoming = [{ userName: 'bob', estimateValue: '3' }]
    const merged = reducer(existing, union(1, incoming))
    expect(merged).toEqual([
      { userName: 'alice', estimateValue: '5' },
      { userName: 'bob', estimateValue: '3' },
    ])
  })

  it('overwrites conflicting entry on RESULTS_UNION', () => {
    const existing = [{ userName: 'alice', estimateValue: '5' }]
    const incoming = [{ userName: 'alice', estimateValue: '8' }]
    expect(reducer(existing, union(1, incoming))).toEqual(incoming)
  })

  it('pre-populates own vote on VOTE_OPTIMISTIC', () => {
    const action = { type: VOTE_OPTIMISTIC, payload: { userName: 'alice', estimateValue: '5' } }
    expect(reducer([], action)).toEqual([{ userName: 'alice', estimateValue: '5' }])
  })

  it('syncs from VOTE success payload', () => {
    const optimistic = [{ userName: 'alice', estimateValue: '5' }]
    const serverState = [
      { userName: 'alice', estimateValue: '5' },
      { userName: 'bob', estimateValue: '3' },
    ]
    const action = {
      type: VOTE,
      payload: { round: 2, results: serverState },
      meta: { userName: 'alice', estimateValue: '5' },
    }
    expect(reducer(optimistic, action)).toEqual(serverState)
  })

  it('removes leaver on USER_LEFT_RECEIVED', () => {
    const existing = [
      { userName: 'alice', estimateValue: '5' },
      { userName: 'bob', estimateValue: '3' },
    ]
    expect(reducer(existing, { type: USER_LEFT_RECEIVED, payload: { leaver: 'bob' } })).toEqual([
      { userName: 'alice', estimateValue: '5' },
    ])
  })

  it('clears on RESET_SESSION', () => {
    const existing = [{ userName: 'alice', estimateValue: '5' }]
    expect(reducer(existing, { type: RESET_SESSION })).toEqual([])
  })

  it('clears on LEAVE_GAME', () => {
    const existing = [{ userName: 'alice', estimateValue: '5' }]
    expect(reducer(existing, { type: LEAVE_GAME })).toEqual([])
  })
})
