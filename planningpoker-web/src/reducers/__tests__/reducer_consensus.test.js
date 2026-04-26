import { describe, it, expect } from 'vitest'
import reducer from '../reducer_consensus'
import {
  CONSENSUS_OVERRIDE_UPDATED,
  LEAVE_GAME,
  RESET_SESSION,
  consensusOverrideUpdated,
} from '../../actions'

describe('consensus reducer', () => {
  it('returns { value: null, round: 0 } as initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({ value: null, round: 0 })
  })

  it('updates value and round when incoming round is strictly larger', () => {
    const before = { value: null, round: 5 }
    const next = reducer(before, consensusOverrideUpdated({ value: '8', round: 6 }))
    expect(next).toEqual({ value: '8', round: 6 })
  })

  it('preserves state when incoming round is older', () => {
    const before = { value: '8', round: 5 }
    const next = reducer(before, consensusOverrideUpdated({ value: '3', round: 3 }))
    expect(next).toBe(before)
  })

  it('preserves state when incoming round equals current (idempotent)', () => {
    const before = { value: '8', round: 5 }
    const next = reducer(before, consensusOverrideUpdated({ value: '13', round: 5 }))
    expect(next).toBe(before)
  })

  it('accepts a null value when round is newer (clears the highlight)', () => {
    const before = { value: '8', round: 5 }
    const next = reducer(before, consensusOverrideUpdated({ value: null, round: 6 }))
    expect(next).toEqual({ value: null, round: 6 })
  })

  it('coerces undefined value to null on the payload', () => {
    const next = reducer(
      { value: null, round: 0 },
      { type: CONSENSUS_OVERRIDE_UPDATED, payload: { value: undefined, round: 1 } },
    )
    expect(next).toEqual({ value: null, round: 1 })
  })

  it('ignores payloads with no round (defensive)', () => {
    const before = { value: '5', round: 2 }
    const next = reducer(before, { type: CONSENSUS_OVERRIDE_UPDATED, payload: { value: '8' } })
    expect(next).toBe(before)
  })

  it('clears the value on RESET_SESSION but leaves round untouched', () => {
    const before = { value: '8', round: 5 }
    const next = reducer(before, { type: RESET_SESSION, payload: { round: 6 } })
    expect(next).toEqual({ value: null, round: 5 })
  })

  it('does not clear on RESET_SESSION when action.error is set', () => {
    const before = { value: '8', round: 5 }
    const next = reducer(before, { type: RESET_SESSION, error: true })
    expect(next).toBe(before)
  })

  it('resets fully on LEAVE_GAME', () => {
    const before = { value: '8', round: 9 }
    expect(reducer(before, { type: LEAVE_GAME })).toEqual({ value: null, round: 0 })
  })
})
