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

import axios from 'axios'
import SessionHeader from '../SessionHeader'
import { renderWithStore } from '../../testUtils/renderWithStore'

function baseState(overrides = {}) {
  return {
    game: {
      sessionId: 'abc12345',
      playerName: 'alice',
      isAdmin: false,
      currentLabel: '',
      legalEstimates: ['1', '2', '3'],
      ...overrides.game,
    },
    results: overrides.results ?? [],
    users: overrides.users ?? ['alice'],
    voted: overrides.voted ?? false,
    notification: overrides.notification ?? { error: null },
    rounds: overrides.rounds ?? [],
  }
}

describe('SessionHeader container', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows "Round 1" eyebrow on a fresh session before any votes', () => {
    renderWithStore(<SessionHeader />, { preloadedState: baseState() })
    expect(screen.getByText(/Round 1/)).toBeInTheDocument()
    expect(screen.queryByText(/Revealed/)).not.toBeInTheDocument()
  })

  it('appends "· Revealed" once votes are revealed', () => {
    renderWithStore(<SessionHeader />, {
      preloadedState: baseState({
        voted: true,
        results: [{ userName: 'alice', estimateValue: '3' }],
      }),
    })
    expect(screen.getByText(/Round 1/)).toBeInTheDocument()
    expect(screen.getByText(/Revealed/)).toBeInTheDocument()
  })

  it('reflects completed rounds in the round number', () => {
    renderWithStore(<SessionHeader />, {
      preloadedState: baseState({
        rounds: [
          { round: 1, results: [], timestamp: 't1' },
          { round: 2, results: [], timestamp: 't2' },
        ],
      }),
    })
    expect(screen.getByText(/Round 3/)).toBeInTheDocument()
  })

  it('shows the label as italic body text for non-host viewers', () => {
    renderWithStore(<SessionHeader />, {
      preloadedState: baseState({ game: { isAdmin: false, currentLabel: 'Story X' } }),
    })
    expect(screen.queryByPlaceholderText('Item label (optional)')).not.toBeInTheDocument()
    expect(screen.getByText('Story X')).toBeInTheDocument()
  })

  it('renders an editable label input for the host', () => {
    renderWithStore(<SessionHeader />, {
      preloadedState: baseState({ game: { isAdmin: true, currentLabel: '' } }),
    })
    expect(screen.getByPlaceholderText('Item label (optional)')).toBeInTheDocument()
  })

  it('debounces host label edits into a single setLabel POST', async () => {
    vi.useFakeTimers()
    try {
      renderWithStore(<SessionHeader />, {
        preloadedState: baseState({ game: { isAdmin: true, currentLabel: '' } }),
      })
      const input = screen.getByPlaceholderText('Item label (optional)')

      await act(async () => {
        fireEvent.change(input, { target: { value: 'New story' } })
      })
      expect(axios.post).not.toHaveBeenCalled()

      await act(async () => {
        vi.advanceTimersByTime(1000)
      })

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringMatching(/\/setLabel$/),
        expect.anything(),
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it('still allows the host to edit the label after voting (post-reveal)', async () => {
    vi.useFakeTimers()
    try {
      renderWithStore(<SessionHeader />, {
        preloadedState: baseState({
          game: { isAdmin: true, currentLabel: 'Original' },
          voted: true,
          results: [{ userName: 'alice', estimateValue: '3' }],
        }),
      })
      const input = screen.getByPlaceholderText('Item label (optional)')
      expect(input).not.toBeDisabled()

      await act(async () => {
        fireEvent.change(input, { target: { value: 'Edited mid-round' } })
      })
      await act(async () => {
        vi.advanceTimersByTime(1000)
      })

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringMatching(/\/setLabel$/),
        expect.anything(),
      )
    } finally {
      vi.useRealTimers()
    }
  })
})
