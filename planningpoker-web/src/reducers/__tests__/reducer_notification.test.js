import { describe, it, expect } from 'vitest'
import reducer from '../reducer_notification'
import { SHOW_ERROR, CLEAR_ERROR } from '../reducer_notification'

describe('notification reducer', () => {
  it('returns null as initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toBeNull()
  })

  it('sets message on SHOW_ERROR', () => {
    expect(reducer(null, { type: SHOW_ERROR, payload: 'Something went wrong' })).toBe(
      'Something went wrong',
    )
  })

  it('resets to null on CLEAR_ERROR', () => {
    expect(reducer('Some error', { type: CLEAR_ERROR })).toBeNull()
  })

  it('leaves state unchanged on unknown action', () => {
    expect(reducer('existing error', { type: 'UNKNOWN_ACTION' })).toBe('existing error')
  })
})
