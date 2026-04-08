import { describe, it, expect } from 'vitest'
import reducer from '../reducer_vote'
import { VOTE, VOTE_OPTIMISTIC, LEAVE_GAME, RESET_SESSION, RESULTS_UPDATED } from '../../actions'

const resultsAction = (payload, playerName = 'alice') => ({
  type: RESULTS_UPDATED,
  payload,
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
    expect(reducer(false, resultsAction([{ userName: 'alice', estimateValue: '5' }]))).toBe(true)
  })

  // --- Sticky optimistic flag: RESULTS_UPDATED preserves state ---

  it('preserves true when RESULTS_UPDATED does not contain the player', () => {
    expect(reducer(true, resultsAction([{ userName: 'bob', estimateValue: '3' }]))).toBe(true)
  })

  it('preserves true when RESULTS_UPDATED has empty payload', () => {
    expect(reducer(true, resultsAction([]))).toBe(true)
  })

  it('preserves false when RESULTS_UPDATED does not contain the player and state is false', () => {
    expect(reducer(false, resultsAction([{ userName: 'bob', estimateValue: '3' }]))).toBe(false)
  })

  it('preserves false when RESULTS_UPDATED has empty payload and state is false', () => {
    expect(reducer(false, resultsAction([]))).toBe(false)
  })

  // --- Race condition sequences (from TLA+ counterexamples) ---

  describe('stale burst from another player vote', () => {
    it('does not flash back to vote screen', () => {
      let state = false

      // Alice clicks vote → VOTE_OPTIMISTIC
      state = reducer(state, {
        type: VOTE_OPTIMISTIC,
        payload: { userName: 'alice', estimateValue: '5' },
      })
      expect(state).toBe(true)

      // Stale burst from Bob's earlier vote arrives (alice not in snapshot)
      state = reducer(state, resultsAction([{ userName: 'bob', estimateValue: '3' }]))
      expect(state).toBe(true) // must stay true — stale burst can't override

      // Fresh burst arrives with both players
      state = reducer(
        state,
        resultsAction([
          { userName: 'alice', estimateValue: '5' },
          { userName: 'bob', estimateValue: '3' },
        ]),
      )
      expect(state).toBe(true)
    })
  })

  describe('stale empty burst from prior reset', () => {
    it('does not flash back to vote screen after new round vote', () => {
      let state = false

      // Round 1: Alice votes
      state = reducer(state, {
        type: VOTE_OPTIMISTIC,
        payload: { userName: 'alice', estimateValue: '3' },
      })
      expect(state).toBe(true)

      // Round 1 results confirm
      state = reducer(state, resultsAction([{ userName: 'alice', estimateValue: '3' }]))
      expect(state).toBe(true)

      // Reset (new round)
      state = reducer(state, { type: RESET_SESSION })
      expect(state).toBe(false)

      // Round 2: Alice votes again
      state = reducer(state, {
        type: VOTE_OPTIMISTIC,
        payload: { userName: 'alice', estimateValue: '8' },
      })
      expect(state).toBe(true)

      // Stale empty burst from the reset arrives AFTER the new vote
      state = reducer(state, resultsAction([]))
      expect(state).toBe(true) // must stay true — stale reset burst can't override
    })
  })

  describe('HTTP error after optimistic vote', () => {
    it('correctly reverts on error then recovers on retry', () => {
      let state = false

      // Alice clicks vote
      state = reducer(state, {
        type: VOTE_OPTIMISTIC,
        payload: { userName: 'alice', estimateValue: '5' },
      })
      expect(state).toBe(true)

      // HTTP fails
      state = reducer(state, { type: VOTE, error: true, payload: new Error('timeout') })
      expect(state).toBe(false) // correct: error should revert

      // Alice retries
      state = reducer(state, {
        type: VOTE_OPTIMISTIC,
        payload: { userName: 'alice', estimateValue: '5' },
      })
      expect(state).toBe(true)

      // HTTP succeeds this time
      state = reducer(state, { type: VOTE, meta: { userName: 'alice' } })
      expect(state).toBe(true)
    })
  })

  describe('multiple bursts interleaved', () => {
    it('handles rapid burst sequence without flicker', () => {
      let state = false

      // Alice votes
      state = reducer(state, {
        type: VOTE_OPTIMISTIC,
        payload: { userName: 'alice', estimateValue: '5' },
      })
      expect(state).toBe(true)

      // 5 burst messages arrive: first 3 are stale (before alice), last 2 include alice
      const staleBurst = resultsAction([{ userName: 'bob', estimateValue: '3' }])
      const freshBurst = resultsAction([
        { userName: 'alice', estimateValue: '5' },
        { userName: 'bob', estimateValue: '3' },
      ])

      state = reducer(state, staleBurst)
      expect(state).toBe(true) // stale: preserve
      state = reducer(state, staleBurst)
      expect(state).toBe(true) // stale: preserve
      state = reducer(state, staleBurst)
      expect(state).toBe(true) // stale: preserve
      state = reducer(state, freshBurst)
      expect(state).toBe(true) // confirmed
      state = reducer(state, freshBurst)
      expect(state).toBe(true) // confirmed
    })
  })
})
