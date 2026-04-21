import { describe, it, expect } from 'vitest'
import reducer from '../reducer_rounds'
import { CREATE_GAME, JOIN_GAME, LEAVE_GAME, ROUND_COMPLETED, ROUNDS_REPLACE } from '../../actions'

const round = (overrides = {}) => ({
  round: 1,
  label: 'Story A',
  consensus: '5',
  votes: [{ userName: 'alice', estimateValue: '5' }],
  timestamp: '2026-04-21T10:00:00.000Z',
  ...overrides,
})

describe('rounds reducer', () => {
  it('returns [] as initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual([])
  })

  it('appends a completed round', () => {
    const r = round()
    expect(reducer([], { type: ROUND_COMPLETED, payload: r })).toEqual([r])
  })

  it('dedupes ROUND_COMPLETED by (round, timestamp)', () => {
    const r = round()
    const state = [r]
    const next = reducer(state, { type: ROUND_COMPLETED, payload: r })
    expect(next).toBe(state)
  })

  it('allows two distinct rounds with different round numbers to coexist', () => {
    const r1 = round({ round: 1 })
    const r2 = round({ round: 2, timestamp: '2026-04-21T10:05:00.000Z' })
    const after1 = reducer([], { type: ROUND_COMPLETED, payload: r1 })
    const after2 = reducer(after1, { type: ROUND_COMPLETED, payload: r2 })
    expect(after2).toEqual([r1, r2])
  })

  it('replaces the whole list on ROUNDS_REPLACE', () => {
    const before = [round({ round: 1 })]
    const incoming = [round({ round: 5 }), round({ round: 6, timestamp: '2026-04-21T11:00:00Z' })]
    expect(reducer(before, { type: ROUNDS_REPLACE, payload: incoming })).toEqual(incoming)
  })

  it('hydrates from CREATE_GAME payload.completedRounds', () => {
    const completedRounds = [round({ round: 2 })]
    const action = { type: CREATE_GAME, payload: { completedRounds } }
    expect(reducer([], action)).toEqual(completedRounds)
  })

  it('hydrates from JOIN_GAME payload.completedRounds', () => {
    const completedRounds = [round({ round: 1 }), round({ round: 2, timestamp: 't2' })]
    const action = { type: JOIN_GAME, payload: { completedRounds } }
    expect(reducer([], action)).toEqual(completedRounds)
  })

  it('ignores JOIN_GAME when action.error is set', () => {
    const state = [round()]
    const action = { type: JOIN_GAME, payload: {}, error: true }
    expect(reducer(state, action)).toBe(state)
  })

  it('resets on LEAVE_GAME', () => {
    const state = [round()]
    expect(reducer(state, { type: LEAVE_GAME })).toEqual([])
  })
})
