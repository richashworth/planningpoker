// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, act, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))

vi.mock('react-chartjs-2', () => ({
  Bar: () => null,
}))

import axios from 'axios'
import Results from '../Results'
import { renderWithStore } from '../../testUtils/renderWithStore'

function baseState(overrides = {}) {
  return {
    game: {
      sessionId: 'abc12345',
      playerName: 'alice',
      isAdmin: true,
      currentLabel: 'Login screen',
      legalEstimates: ['1', '2', '3', '5', '8'],
      ...overrides.game,
    },
    results: overrides.results ?? [
      { userName: 'alice', estimateValue: '5' },
      { userName: 'bob', estimateValue: '5' },
      { userName: 'carol', estimateValue: '3' },
    ],
    users: overrides.users ?? ['alice', 'bob', 'carol'],
    voted: overrides.voted ?? true,
    notification: overrides.notification ?? { error: null },
    rounds: overrides.rounds ?? [],
    consensus: overrides.consensus ?? { value: null, round: 0 },
  }
}

describe('Results container', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows "Next Item" button to the host', () => {
    renderWithStore(<Results />, { preloadedState: baseState() })
    expect(screen.getByRole('button', { name: /Next Item/ })).toBeInTheDocument()
  })

  it('hides the host-only controls for non-host players', () => {
    renderWithStore(<Results />, {
      preloadedState: baseState({ game: { isAdmin: false } }),
    })
    expect(screen.queryByRole('button', { name: /Next Item/ })).not.toBeInTheDocument()
  })

  it('POSTs to /reset when "Next Item" is clicked', async () => {
    renderWithStore(<Results />, { preloadedState: baseState() })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Next Item/ }))
    })

    expect(axios.post).toHaveBeenCalledWith(expect.stringMatching(/\/reset$/), expect.anything())
  })

  it('POSTs to /setConsensus when the host clicks a card on ConsensusCardRail', async () => {
    renderWithStore(<Results />, { preloadedState: baseState() })

    // Click the "8" card (a value other than the auto-consensus '5'); rail aria-label includes
    // the vote count "(0 votes)" because nobody voted 8, so we match by partial label.
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Set consensus to 8/ }))
    })

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringMatching(/\/setConsensus$/),
      expect.anything(),
    )
    const [, params] = axios.post.mock.calls.find(([url]) => /\/setConsensus$/.test(url))
    expect(params.get('userName')).toBe('alice')
    expect(params.get('sessionId')).toBe('abc12345')
    expect(params.get('value')).toBe('8')
  })

  it('POSTs to /setConsensus with no value (clears) when the host clicks the auto-consensus card', async () => {
    renderWithStore(<Results />, { preloadedState: baseState() })

    // autoConsensus is '5' (mode of [5, 5, 3]); clicking it should clear the override.
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Set consensus to 5/ }))
    })

    const [, params] = axios.post.mock.calls.find(([url]) => /\/setConsensus$/.test(url))
    expect(params.has('value')).toBe(false)
  })
})
