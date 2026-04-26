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
  }
}

function setConsensusOverride() {}

describe('Results container', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows "Next Item" button to the host', () => {
    renderWithStore(
      <Results consensusOverride={null} setConsensusOverride={setConsensusOverride} />,
      { preloadedState: baseState() },
    )
    expect(screen.getByRole('button', { name: /Next Item/ })).toBeInTheDocument()
  })

  it('hides the host-only controls for non-host players', () => {
    renderWithStore(
      <Results consensusOverride={null} setConsensusOverride={setConsensusOverride} />,
      { preloadedState: baseState({ game: { isAdmin: false } }) },
    )
    expect(screen.queryByRole('button', { name: /Next Item/ })).not.toBeInTheDocument()
  })

  it('POSTs to /reset when "Next Item" is clicked', async () => {
    renderWithStore(
      <Results consensusOverride={null} setConsensusOverride={setConsensusOverride} />,
      { preloadedState: baseState() },
    )

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Next Item/ }))
    })

    expect(axios.post).toHaveBeenCalledWith(expect.stringMatching(/\/reset$/), expect.anything())
  })
})
