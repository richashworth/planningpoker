import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios')

import {
  voteOptimistic,
  createGame,
  joinGame,
  vote,
  resetSession,
  refresh,
  setConsensusOverride,
  consensusOverrideUpdated,
  CREATE_GAME,
  JOIN_GAME,
  VOTE,
  VOTE_OPTIMISTIC,
  RESET_SESSION,
  RESULTS_REPLACE,
  LABEL_UPDATED,
  USERS_UPDATED,
  ROUNDS_REPLACE,
  SET_CONSENSUS_OVERRIDE,
  CONSENSUS_OVERRIDE_UPDATED,
  CONSENSUS_OVERRIDE_LOCAL,
} from '../index'

async function runThunkAsync(thunk, state = {}) {
  const dispatched = []
  const dispatch = (action) => {
    dispatched.push(action)
  }
  const getState = () => state
  await thunk(dispatch, getState)
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
    axios.post = vi.fn().mockResolvedValue({ data: { sessionId: 'abc12345', round: 0 } })
    const onSuccess = vi.fn()

    const dispatched = await runThunkAsync(
      createGame(
        'Alice',
        { schemeType: 'fibonacci', customValues: null, includeUnsure: true },
        onSuccess,
      ),
    )

    expect(dispatched).toHaveLength(1)
    expect(dispatched[0].type).toBe(CREATE_GAME)
    expect(dispatched[0].payload).toEqual({ sessionId: 'abc12345', round: 0 })
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
        { schemeType: 'fibonacci', customValues: null, includeUnsure: true },
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
    axios.post = vi
      .fn()
      .mockResolvedValue({ data: { sessionId: 'abc12345', round: 3, results: [], label: '' } })
    const onSuccess = vi.fn()

    const dispatched = await runThunkAsync(joinGame('Bob', 'abc12345', onSuccess))

    expect(dispatched).toHaveLength(1)
    expect(dispatched[0].type).toBe(JOIN_GAME)
    expect(dispatched[0].payload.round).toBe(3)
    expect(dispatched[0].meta.userName).toBe('Bob')
    expect(dispatched[0].meta.sessionId).toBe('abc12345')
    expect(onSuccess).toHaveBeenCalledOnce()
  })
})

describe('vote', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('dispatches VOTE action with round and results on success', async () => {
    axios.post = vi.fn().mockResolvedValue({
      data: { round: 2, results: [{ userName: 'alice', estimateValue: '5' }] },
    })

    const dispatched = await runThunkAsync(vote('alice', 'abc12345', '5'))

    expect(dispatched).toHaveLength(1)
    expect(dispatched[0].type).toBe(VOTE)
    expect(dispatched[0].error).toBeFalsy()
    expect(dispatched[0].payload.round).toBe(2)
    expect(dispatched[0].payload.results).toEqual([{ userName: 'alice', estimateValue: '5' }])
    expect(dispatched[0].meta.userName).toBe('alice')
    expect(dispatched[0].meta.estimateValue).toBe('5')
  })
})

describe('resetSession', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('dispatches RESET_SESSION with round on success', async () => {
    axios.post = vi.fn().mockResolvedValue({ data: { round: 7 } })

    const dispatched = await runThunkAsync(resetSession('alice', 'abc12345'))

    expect(dispatched).toHaveLength(1)
    expect(dispatched[0].type).toBe(RESET_SESSION)
    expect(dispatched[0].payload).toEqual({ round: 7 })
  })

  it('omits the consensus param when none is supplied', async () => {
    axios.post = vi.fn().mockResolvedValue({ data: { round: 1 } })

    await runThunkAsync(resetSession('alice', 'abc12345'))

    const [, params] = axios.post.mock.calls[0]
    expect(params.get('userName')).toBe('alice')
    expect(params.get('sessionId')).toBe('abc12345')
    expect(params.has('consensus')).toBe(false)
  })

  it('includes the consensus param when supplied', async () => {
    axios.post = vi.fn().mockResolvedValue({ data: { round: 2 } })

    await runThunkAsync(resetSession('alice', 'abc12345', '8'))

    const [, params] = axios.post.mock.calls[0]
    expect(params.get('consensus')).toBe('8')
  })
})

describe('refresh', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('dispatches RESULTS_REPLACE, LABEL_UPDATED, USERS_UPDATED, and ROUNDS_REPLACE from /refresh response', async () => {
    const completedRounds = [
      {
        round: 1,
        label: 'Story A',
        consensus: '3',
        votes: [{ userName: 'alice', estimateValue: '3' }],
        timestamp: '2026-04-21T10:00:00Z',
      },
    ]
    axios.get = vi.fn().mockResolvedValue({
      data: {
        round: 5,
        results: [{ userName: 'alice', estimateValue: '5' }],
        label: 'Sprint 1',
        users: ['alice', 'bob'],
        host: 'alice',
        completedRounds,
      },
    })

    const dispatched = await runThunkAsync(refresh('abc12345', 'alice'))

    const replaceAction = dispatched.find((a) => a.type === RESULTS_REPLACE)
    expect(replaceAction).toBeDefined()
    expect(replaceAction.payload.round).toBe(5)
    expect(replaceAction.payload.results).toEqual([{ userName: 'alice', estimateValue: '5' }])

    const labelAction = dispatched.find((a) => a.type === LABEL_UPDATED)
    expect(labelAction).toBeDefined()
    expect(labelAction.payload).toBe('Sprint 1')

    const usersAction = dispatched.find((a) => a.type === USERS_UPDATED)
    expect(usersAction).toBeDefined()
    expect(usersAction.payload).toEqual({ users: ['alice', 'bob'], host: 'alice' })

    const roundsAction = dispatched.find((a) => a.type === ROUNDS_REPLACE)
    expect(roundsAction).toBeDefined()
    expect(roundsAction.payload).toEqual(completedRounds)
  })

  it('skips ROUNDS_REPLACE when the refresh response omits completedRounds', async () => {
    axios.get = vi.fn().mockResolvedValue({
      data: {
        round: 1,
        results: [],
        label: '',
        users: ['alice'],
        host: 'alice',
      },
    })

    const dispatched = await runThunkAsync(refresh('abc12345', 'alice'))

    expect(dispatched.find((a) => a.type === ROUNDS_REPLACE)).toBeUndefined()
  })
})

describe('consensusOverrideUpdated', () => {
  it('returns a CONSENSUS_OVERRIDE_UPDATED action with value and round', () => {
    const action = consensusOverrideUpdated({ value: '8', round: 4 })
    expect(action.type).toBe(CONSENSUS_OVERRIDE_UPDATED)
    expect(action.payload).toEqual({ value: '8', round: 4 })
  })

  it('coerces undefined value to null', () => {
    const action = consensusOverrideUpdated({ value: undefined, round: 1 })
    expect(action.payload.value).toBeNull()
  })
})

describe('setConsensusOverride', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('dispatches an optimistic local update before POSTing to /setConsensus', async () => {
    axios.post = vi.fn().mockResolvedValue({ data: {} })

    const dispatched = await runThunkAsync(setConsensusOverride('alice', 'abc12345', '8'), {
      consensus: { value: null, round: 2 },
    })

    // First dispatch is the optimistic local update
    expect(dispatched[0].type).toBe(CONSENSUS_OVERRIDE_LOCAL)
    expect(dispatched[0].payload.value).toBe('8')

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringMatching(/\/setConsensus$/),
      expect.anything(),
    )
    const [, params] = axios.post.mock.calls[0]
    expect(params.get('userName')).toBe('alice')
    expect(params.get('sessionId')).toBe('abc12345')
    expect(params.get('value')).toBe('8')

    // Final dispatch is the success marker
    const success = dispatched.find((a) => a.type === SET_CONSENSUS_OVERRIDE)
    expect(success.error).toBeFalsy()
  })

  it('omits the value param when null/empty (clears the override)', async () => {
    axios.post = vi.fn().mockResolvedValue({ data: {} })

    await runThunkAsync(setConsensusOverride('alice', 'abc12345', null), {
      consensus: { value: '8', round: 2 },
    })
    const [, params] = axios.post.mock.calls[0]
    expect(params.has('value')).toBe(false)
  })

  it('reverts to the prior value and dispatches error on failure', async () => {
    axios.post = vi.fn().mockRejectedValue({
      response: { data: { error: 'only the host can perform this action' } },
    })

    const dispatched = await runThunkAsync(setConsensusOverride('mallory', 'abc12345', '8'), {
      consensus: { value: '5', round: 4 },
    })

    // Optimistic dispatch first
    expect(dispatched[0].type).toBe(CONSENSUS_OVERRIDE_LOCAL)
    expect(dispatched[0].payload.value).toBe('8')

    // Revert dispatch to the prior value
    const reverts = dispatched.filter((a) => a.type === CONSENSUS_OVERRIDE_LOCAL)
    expect(reverts).toHaveLength(2)
    expect(reverts[1].payload.value).toBe('5')

    const action = dispatched.find((a) => a.type === SET_CONSENSUS_OVERRIDE)
    expect(action.error).toBe(true)
    const errorAction = dispatched.find((a) => a.type === 'show-error')
    expect(errorAction.payload).toBe('only the host can perform this action')
  })
})
