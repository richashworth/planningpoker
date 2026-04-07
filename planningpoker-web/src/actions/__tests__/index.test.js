import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios')

import {
  voteOptimistic,
  createGame,
  joinGame,
  vote,
  CREATE_GAME,
  JOIN_GAME,
  VOTE,
  VOTE_OPTIMISTIC,
} from '../index'

async function runThunkAsync(thunk) {
  const dispatched = []
  const dispatch = (action) => {
    dispatched.push(action)
  }
  await thunk(dispatch)
  return dispatched
}

describe('voteOptimistic', () => {
  it('returns an action with the correct type and payload', () => {
    const action = voteOptimistic('alice', '5')
    expect(action.type).toBe(VOTE_OPTIMISTIC)
    expect(action.payload.userName).toBe('alice')
    expect(action.payload.estimateValue).toBe('5')
  })
})

describe('createGame', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('dispatches CREATE_GAME with payload and meta on success', async () => {
    axios.post = vi.fn().mockResolvedValue({ data: { sessionId: 'abc12345' } })
    const onSuccess = vi.fn()

    const dispatched = await runThunkAsync(
      createGame(
        'Alice',
        { schemeType: 'fibonacci', customValues: null, includeUnsure: true, includeCoffee: true },
        onSuccess,
      ),
    )

    expect(dispatched).toHaveLength(1)
    expect(dispatched[0].type).toBe(CREATE_GAME)
    expect(dispatched[0].payload).toEqual({ sessionId: 'abc12345' })
    expect(dispatched[0].meta.userName).toBe('Alice')
    expect(dispatched[0].error).toBeFalsy()
    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('dispatches CREATE_GAME with error:true and show-error on failure', async () => {
    axios.post = vi.fn().mockRejectedValue({
      response: { data: { error: 'Too many sessions' } },
    })

    const dispatched = await runThunkAsync(
      createGame(
        'Alice',
        { schemeType: 'fibonacci', customValues: null, includeUnsure: true, includeCoffee: true },
        null,
      ),
    )

    expect(dispatched).toHaveLength(2)
    const createAction = dispatched.find((a) => a.type === CREATE_GAME)
    expect(createAction).toBeDefined()
    expect(createAction.error).toBe(true)

    const errorAction = dispatched.find((a) => a.type === 'show-error')
    expect(errorAction).toBeDefined()
    expect(errorAction.payload).toBe('Too many sessions')
  })
})

describe('joinGame', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('dispatches JOIN_GAME with payload and meta on success', async () => {
    axios.post = vi.fn().mockResolvedValue({ data: { sessionId: 'abc12345' } })
    const onSuccess = vi.fn()

    const dispatched = await runThunkAsync(joinGame('Bob', 'abc12345', onSuccess))

    expect(dispatched).toHaveLength(1)
    expect(dispatched[0].type).toBe(JOIN_GAME)
    expect(dispatched[0].payload).toEqual({ sessionId: 'abc12345' })
    expect(dispatched[0].meta.userName).toBe('Bob')
    expect(dispatched[0].meta.sessionId).toBe('abc12345')
    expect(onSuccess).toHaveBeenCalledOnce()
  })
})

describe('vote', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('dispatches VOTE action on success', async () => {
    axios.post = vi.fn().mockResolvedValue({ data: {} })

    const dispatched = await runThunkAsync(vote('alice', 'abc12345', '5'))

    expect(dispatched).toHaveLength(1)
    expect(dispatched[0].type).toBe(VOTE)
    expect(dispatched[0].error).toBeFalsy()
    expect(dispatched[0].meta.userName).toBe('alice')
    expect(dispatched[0].meta.estimateValue).toBe('5')
  })
})
