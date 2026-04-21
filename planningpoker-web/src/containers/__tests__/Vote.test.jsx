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
import Vote from '../Vote'
import { renderWithStore } from '../../testUtils/renderWithStore'

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
    users: overrides.users ?? [],
    voted: overrides.voted ?? false,
    notification: overrides.notification ?? { error: null },
    rounds: overrides.rounds ?? [],
  }
}

describe('Vote container', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders one card per legal estimate with accessible labels', () => {
    renderWithStore(<Vote />, { preloadedState: baseState() })

    expect(screen.getByLabelText('Vote 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Vote 2')).toBeInTheDocument()
    expect(screen.getByLabelText('Vote 3')).toBeInTheDocument()
    expect(screen.getByLabelText('Vote 5')).toBeInTheDocument()
    expect(screen.getByLabelText('Vote 8')).toBeInTheDocument()
  })

  it('flips voted=true in state when a card is clicked', () => {
    const { store } = renderWithStore(<Vote />, { preloadedState: baseState() })

    expect(store.getState().voted).toBe(false)
    fireEvent.click(screen.getByLabelText('Vote 5'))
    expect(store.getState().voted).toBe(true)
  })

  it('POSTs to /vote when a card is clicked', async () => {
    renderWithStore(<Vote />, { preloadedState: baseState() })

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Vote 5'))
    })

    expect(axios.post).toHaveBeenCalledWith(expect.stringMatching(/\/vote$/), expect.anything())
  })

  it('ignores subsequent clicks once a selection has been made', async () => {
    renderWithStore(<Vote />, { preloadedState: baseState() })

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Vote 3'))
    })
    axios.post.mockClear()

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Vote 8'))
    })
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('reacts to Enter key on a card', async () => {
    renderWithStore(<Vote />, { preloadedState: baseState() })

    await act(async () => {
      fireEvent.keyDown(screen.getByLabelText('Vote 2'), { key: 'Enter' })
    })

    expect(axios.post).toHaveBeenCalledWith(expect.stringMatching(/\/vote$/), expect.anything())
  })

  it('shows the label input only for the host (isAdmin)', () => {
    renderWithStore(<Vote />, {
      preloadedState: baseState({ game: { isAdmin: false, currentLabel: 'Story X' } }),
    })
    expect(screen.queryByPlaceholderText('Item label (optional)')).not.toBeInTheDocument()
    expect(screen.getByText('Story X')).toBeInTheDocument()
  })

  it('renders an editable label input for the host', () => {
    renderWithStore(<Vote />, {
      preloadedState: baseState({ game: { isAdmin: true, currentLabel: '' } }),
    })
    expect(screen.getByPlaceholderText('Item label (optional)')).toBeInTheDocument()
  })

  it('debounces host label edits into a setLabel POST', async () => {
    vi.useFakeTimers()
    try {
      renderWithStore(<Vote />, {
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
})
