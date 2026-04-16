import { describe, it, expect } from 'vitest'
import reducer from '../reducer_results'
import { LEAVE_GAME, RESET_SESSION, RESULTS_UPDATED, VOTE_OPTIMISTIC } from '../../actions'

describe('results reducer', () => {
  it('returns [] as initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual([])
  })

  it('replaces state on RESULTS_UPDATED', () => {
    const results = [{ userName: 'alice', estimateValue: '5' }]
    expect(reducer([], { type: RESULTS_UPDATED, payload: results })).toEqual(results)
  })

  it('overwrites existing results on RESULTS_UPDATED', () => {
    const old = [{ userName: 'alice', estimateValue: '3' }]
    const updated = [
      { userName: 'alice', estimateValue: '3' },
      { userName: 'bob', estimateValue: '8' },
    ]
    expect(reducer(old, { type: RESULTS_UPDATED, payload: updated })).toEqual(updated)
  })

  it('pre-populates own vote on VOTE_OPTIMISTIC', () => {
    const action = { type: VOTE_OPTIMISTIC, payload: { userName: 'alice', estimateValue: '5' } }
    expect(reducer([], action)).toEqual([{ userName: 'alice', estimateValue: '5' }])
  })

  it('replaces own entry idempotently on RESULTS_UPDATED after VOTE_OPTIMISTIC', () => {
    const optimistic = [{ userName: 'alice', estimateValue: '5' }]
    const ws = [
      { userName: 'alice', estimateValue: '5' },
      { userName: 'bob', estimateValue: '3' },
    ]
    expect(reducer(optimistic, { type: RESULTS_UPDATED, payload: ws })).toEqual(ws)
  })

  it('clears on RESET_SESSION (optimistic)', () => {
    const existing = [{ userName: 'alice', estimateValue: '5' }]
    expect(reducer(existing, { type: RESET_SESSION })).toEqual([])
  })

  it('clears on LEAVE_GAME', () => {
    const existing = [{ userName: 'alice', estimateValue: '5' }]
    expect(reducer(existing, { type: LEAVE_GAME })).toEqual([])
  })

  it('preserves reference when RESULTS_UPDATED payload is content-equal', () => {
    const existing = [
      { userName: 'alice', estimateValue: '5' },
      { userName: 'bob', estimateValue: '3' },
    ]
    const dup = [
      { userName: 'bob', estimateValue: '3' },
      { userName: 'alice', estimateValue: '5' },
    ]
    expect(reducer(existing, { type: RESULTS_UPDATED, payload: dup })).toBe(existing)
  })

  it('returns new reference when content differs', () => {
    const existing = [{ userName: 'alice', estimateValue: '5' }]
    const updated = [{ userName: 'alice', estimateValue: '8' }]
    expect(reducer(existing, { type: RESULTS_UPDATED, payload: updated })).toBe(updated)
  })
})
