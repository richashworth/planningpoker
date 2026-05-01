// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, act, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

vi.mock('../../utils/csvExport', () => ({
  generateCsv: vi.fn(() => 'csv-content'),
  downloadCsv: vi.fn(),
}))

import SessionHistory from '../SessionHistory'
import { renderWithStore } from '../../testUtils/renderWithStore'
import { generateCsv, downloadCsv } from '../../utils/csvExport'

function baseState(overrides = {}) {
  return {
    game: {
      sessionId: 'abc12345',
      playerName: 'alice',
      isAdmin: false,
      currentLabel: '',
      legalEstimates: ['1', '2', '3', '5', '8'],
      ...overrides.game,
    },
    results: overrides.results ?? [],
    users: overrides.users ?? ['alice', 'bob'],
    voted: overrides.voted ?? false,
    notification: overrides.notification ?? { error: null },
    rounds: overrides.rounds ?? [],
  }
}

const completedRound = {
  label: 'Story 1',
  consensus: '5',
  votes: [
    { userName: 'alice', estimateValue: '5' },
    { userName: 'bob', estimateValue: '5' },
  ],
  timestamp: '2026-04-21T10:00:00.000Z',
}

describe('SessionHistory container', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders nothing on a fresh session before the first reveal', () => {
    const { container } = renderWithStore(<SessionHistory />, { preloadedState: baseState() })
    expect(container.firstChild).toBeNull()
  })

  it('renders on the voting screen after at least one completed round', () => {
    renderWithStore(<SessionHistory />, {
      preloadedState: baseState({ rounds: [completedRound] }),
    })
    expect(screen.getByRole('button', { name: /Show session history/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Export CSV/ })).toBeInTheDocument()
  })

  it('renders nothing during round 1 while votes are in-flight (no completed rounds yet)', () => {
    const { container } = renderWithStore(<SessionHistory />, {
      preloadedState: baseState({
        voted: true,
        results: [{ userName: 'alice', estimateValue: '3' }],
      }),
    })
    expect(container.firstChild).toBeNull()
  })

  it('is visible to non-host players with history', () => {
    renderWithStore(<SessionHistory />, {
      preloadedState: baseState({
        game: { isAdmin: false },
        rounds: [completedRound],
      }),
    })
    expect(screen.getByRole('button', { name: /Export CSV/ })).toBeInTheDocument()
  })

  it('exports only completed rounds when called from the voting screen', async () => {
    renderWithStore(<SessionHistory />, {
      preloadedState: baseState({ rounds: [completedRound] }),
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Export CSV/ }))
    })

    expect(generateCsv).toHaveBeenCalledTimes(1)
    const [roundsArg, playersArg] = generateCsv.mock.calls[0]
    expect(roundsArg).toEqual([completedRound])
    expect(playersArg).toEqual(['alice', 'bob'])
    expect(downloadCsv).toHaveBeenCalledWith('csv-content', 'planning-poker-abc12345.csv')
  })

  it('exports completed rounds plus the in-flight round when called from the results screen', async () => {
    renderWithStore(<SessionHistory consensusOverride={null} />, {
      preloadedState: baseState({
        voted: true,
        rounds: [completedRound],
        results: [
          { userName: 'alice', estimateValue: '8' },
          { userName: 'bob', estimateValue: '8' },
        ],
        game: { currentLabel: 'Story 2' },
      }),
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Export CSV/ }))
    })

    const [roundsArg] = generateCsv.mock.calls[0]
    expect(roundsArg).toHaveLength(2)
    expect(roundsArg[0]).toEqual(completedRound)
    expect(roundsArg[1]).toMatchObject({
      label: 'Story 2',
      consensus: '8',
      votes: [
        { userName: 'alice', estimateValue: '8' },
        { userName: 'bob', estimateValue: '8' },
      ],
    })
  })

  it('honours consensusOverride when building the in-flight round', async () => {
    renderWithStore(<SessionHistory consensusOverride="13" />, {
      preloadedState: baseState({
        voted: true,
        rounds: [completedRound],
        results: [
          { userName: 'alice', estimateValue: '5' },
          { userName: 'bob', estimateValue: '8' },
        ],
      }),
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Export CSV/ }))
    })

    const [roundsArg] = generateCsv.mock.calls[0]
    expect(roundsArg).toHaveLength(2)
    expect(roundsArg[1].consensus).toBe('13')
  })

  it('includes historical voters who have since left the session', async () => {
    const roundWithLeaver = {
      ...completedRound,
      votes: [
        { userName: 'alice', estimateValue: '5' },
        { userName: 'carol', estimateValue: '3' },
      ],
    }
    renderWithStore(<SessionHistory />, {
      preloadedState: baseState({
        rounds: [roundWithLeaver],
        users: ['alice', 'bob'],
      }),
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Export CSV/ }))
    })

    const [, playersArg] = generateCsv.mock.calls[0]
    expect(playersArg).toEqual(['alice', 'bob', 'carol'])
  })
})
