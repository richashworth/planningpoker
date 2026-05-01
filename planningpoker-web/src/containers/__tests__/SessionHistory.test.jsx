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
      legalEstimates: ['1', '2', '3', '5', '8', '13'],
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

const secondCompletedRound = {
  label: 'Story 2',
  consensus: '3',
  votes: [
    { userName: 'alice', estimateValue: '3' },
    { userName: 'bob', estimateValue: '3' },
  ],
  timestamp: '2026-04-21T10:30:00.000Z',
}

describe('SessionHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  describe('visibility', () => {
    it('renders nothing on a fresh session before any vote or completed round', () => {
      const { container } = renderWithStore(<SessionHistory />, { preloadedState: baseState() })
      expect(container.firstChild).toBeNull()
    })

    it('stays hidden on the voting screen during round 1 even after the user has voted', () => {
      // Default includeInflight=false on the voting screen — current-round votes must not
      // make the strip appear, otherwise Export CSV would leak them before reveal.
      const { container } = renderWithStore(<SessionHistory />, {
        preloadedState: baseState({
          voted: true,
          results: [{ userName: 'alice', estimateValue: '3' }],
        }),
      })
      expect(container.firstChild).toBeNull()
    })

    it('stays hidden on the voting screen even when peer votes are visible in state', () => {
      const { container } = renderWithStore(<SessionHistory />, {
        preloadedState: baseState({
          voted: true,
          results: [
            { userName: 'alice', estimateValue: '3' },
            { userName: 'bob', estimateValue: '5' },
          ],
        }),
      })
      expect(container.firstChild).toBeNull()
    })

    it('renders on the results screen for round 1 once includeInflight is enabled', () => {
      renderWithStore(<SessionHistory includeInflight />, {
        preloadedState: baseState({
          voted: true,
          results: [
            { userName: 'alice', estimateValue: '3' },
            { userName: 'bob', estimateValue: '5' },
          ],
        }),
      })
      expect(screen.getByText(/Session history · 1 round/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Export CSV/ })).toBeInTheDocument()
    })

    it('renders on the voting screen once at least one round has completed', () => {
      renderWithStore(<SessionHistory />, {
        preloadedState: baseState({ rounds: [completedRound] }),
      })
      expect(screen.getByRole('button', { name: /Show session history/ })).toBeInTheDocument()
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
  })

  describe('count display', () => {
    it('shows the completed-round count on the voting screen, ignoring in-flight votes', () => {
      renderWithStore(<SessionHistory />, {
        preloadedState: baseState({
          rounds: [completedRound],
          voted: true,
          results: [{ userName: 'alice', estimateValue: '8' }],
        }),
      })
      expect(screen.getByText(/1 completed round\b/)).toBeInTheDocument()
      expect(screen.queryByText(/2 completed/)).not.toBeInTheDocument()
    })

    it('does not include the in-flight round in the button count on the results screen either', () => {
      // Even with includeInflight, the button label reflects only completed rounds —
      // in-flight is exposed via the export, not the count, so the user sees a stable label.
      renderWithStore(<SessionHistory includeInflight />, {
        preloadedState: baseState({
          rounds: [completedRound],
          voted: true,
          results: [{ userName: 'alice', estimateValue: '8' }],
        }),
      })
      expect(screen.getByText(/1 completed round\b/)).toBeInTheDocument()
    })

    it('pluralises completed rounds correctly', () => {
      renderWithStore(<SessionHistory />, {
        preloadedState: baseState({ rounds: [completedRound, secondCompletedRound] }),
      })
      expect(screen.getByText(/2 completed rounds/)).toBeInTheDocument()
    })

    it('uses the singular caption when only an in-flight round exists on the results screen', () => {
      renderWithStore(<SessionHistory includeInflight />, {
        preloadedState: baseState({
          voted: true,
          results: [{ userName: 'alice', estimateValue: '3' }],
        }),
      })
      expect(screen.getByText(/Session history · 1 round\b/i)).toBeInTheDocument()
    })
  })

  describe('expand panel', () => {
    it('toggles open and closed when the header button is clicked', () => {
      renderWithStore(<SessionHistory />, {
        preloadedState: baseState({ rounds: [completedRound] }),
      })
      const button = screen.getByRole('button', { name: /Show session history/ })
      expect(screen.queryByText('Story 1')).not.toBeInTheDocument()
      fireEvent.click(button)
      expect(screen.getByText('Story 1')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Hide session history/ })).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: /Hide session history/ }))
      expect(screen.queryByText('Story 1')).not.toBeInTheDocument()
    })

    it('renders all completed rounds in order with label and consensus', () => {
      renderWithStore(<SessionHistory />, {
        preloadedState: baseState({ rounds: [completedRound, secondCompletedRound] }),
      })
      fireEvent.click(screen.getByRole('button', { name: /Show session history/ }))
      expect(screen.getByText('Story 1')).toBeInTheDocument()
      expect(screen.getByText('Story 2')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument() // round 1 consensus
      expect(screen.getByText('3')).toBeInTheDocument() // round 2 consensus
    })

    it('renders "No label" for rounds without a label', () => {
      const unlabelled = { ...completedRound, label: '' }
      renderWithStore(<SessionHistory />, {
        preloadedState: baseState({ rounds: [unlabelled] }),
      })
      fireEvent.click(screen.getByRole('button', { name: /Show session history/ }))
      expect(screen.getByText('No label')).toBeInTheDocument()
    })

    it('does not render the in-flight round in the expand panel even on the results screen', () => {
      renderWithStore(<SessionHistory includeInflight />, {
        preloadedState: baseState({
          rounds: [completedRound],
          voted: true,
          results: [{ userName: 'alice', estimateValue: '13' }],
          game: { currentLabel: 'Story 2 inflight' },
        }),
      })
      fireEvent.click(screen.getByRole('button', { name: /Show session history/ }))
      expect(screen.getByText('Story 1')).toBeInTheDocument()
      expect(screen.queryByText('Story 2 inflight')).not.toBeInTheDocument()
    })
  })

  describe('CSV export — voting screen (includeInflight=false)', () => {
    it('exports only completed rounds, never the in-flight round', async () => {
      renderWithStore(<SessionHistory />, {
        preloadedState: baseState({
          rounds: [completedRound],
          voted: true,
          results: [
            { userName: 'alice', estimateValue: '13' },
            { userName: 'bob', estimateValue: '13' },
          ],
        }),
      })
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Export CSV/ }))
      })
      expect(generateCsv).toHaveBeenCalledTimes(1)
      const [roundsArg] = generateCsv.mock.calls[0]
      expect(roundsArg).toEqual([completedRound])
      expect(roundsArg).toHaveLength(1)
      // The in-flight vote value '13' must not appear in any exported round.
      const allValues = roundsArg.flatMap((r) => r.votes.map((v) => v.estimateValue))
      expect(allValues).not.toContain('13')
    })

    it('ignores consensusOverride because in-flight is excluded', async () => {
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
      expect(roundsArg).toEqual([completedRound])
      expect(roundsArg).toHaveLength(1)
    })

    it('writes the CSV to a sessionId-scoped filename', async () => {
      renderWithStore(<SessionHistory />, {
        preloadedState: baseState({
          rounds: [completedRound],
          game: { sessionId: 'xyz98765' },
        }),
      })
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Export CSV/ }))
      })
      expect(downloadCsv).toHaveBeenCalledWith('csv-content', 'planning-poker-xyz98765.csv')
    })
  })

  describe('CSV export — results screen (includeInflight=true)', () => {
    it('exports completed rounds plus the in-flight round', async () => {
      renderWithStore(<SessionHistory consensusOverride={null} includeInflight />, {
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
      renderWithStore(<SessionHistory consensusOverride="13" includeInflight />, {
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

    it('exports an in-flight-only round when no rounds are completed yet (round 1 reveal)', async () => {
      renderWithStore(<SessionHistory includeInflight />, {
        preloadedState: baseState({
          voted: true,
          results: [
            { userName: 'alice', estimateValue: '5' },
            { userName: 'bob', estimateValue: '8' },
          ],
          game: { currentLabel: 'Story 1' },
        }),
      })
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Export CSV/ }))
      })
      const [roundsArg] = generateCsv.mock.calls[0]
      expect(roundsArg).toHaveLength(1)
      expect(roundsArg[0]).toMatchObject({
        label: 'Story 1',
        votes: [
          { userName: 'alice', estimateValue: '5' },
          { userName: 'bob', estimateValue: '8' },
        ],
      })
    })

    it('does not include an in-flight round when the user has not voted', async () => {
      renderWithStore(<SessionHistory includeInflight />, {
        preloadedState: baseState({
          rounds: [completedRound],
          voted: false,
          results: [{ userName: 'bob', estimateValue: '8' }],
        }),
      })
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Export CSV/ }))
      })
      const [roundsArg] = generateCsv.mock.calls[0]
      expect(roundsArg).toEqual([completedRound])
    })
  })

  describe('CSV export — players list', () => {
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

    it('deduplicates users who appear in both the current session and round history', async () => {
      renderWithStore(<SessionHistory />, {
        preloadedState: baseState({
          rounds: [completedRound], // votes from alice + bob
          users: ['alice', 'bob'],
        }),
      })
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Export CSV/ }))
      })
      const [, playersArg] = generateCsv.mock.calls[0]
      expect(playersArg).toEqual(['alice', 'bob'])
    })
  })
})
