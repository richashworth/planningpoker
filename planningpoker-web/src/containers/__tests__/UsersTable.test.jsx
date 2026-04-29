// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, act, cleanup, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))

import axios from 'axios'
import UsersTable from '../UsersTable'
import { renderWithStore } from '../../testUtils/renderWithStore'

function state({ playerName = 'alice', host = 'alice', users = ['alice', 'bob'] } = {}) {
  return {
    game: {
      sessionId: 'abc12345',
      playerName,
      host,
      isAdmin: playerName === host,
      currentLabel: '',
      legalEstimates: [],
    },
    results: [],
    users,
    voted: false,
    notification: { error: null },
    rounds: [],
  }
}

describe('UsersTable container', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => cleanup())

  it('renders all users including the current user', () => {
    renderWithStore(<UsersTable heading="Players" />, {
      preloadedState: state({ users: ['bob', 'carol'] }),
    })
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Carol')).toBeInTheDocument()
  })

  it('hides host-only transfer/kick controls for a non-host viewer', () => {
    renderWithStore(<UsersTable heading="Players" />, {
      preloadedState: state({ playerName: 'bob', host: 'alice' }),
    })
    expect(screen.queryByLabelText(/transfer host/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/remove from session/i)).not.toBeInTheDocument()
  })

  it('shows transfer + kick buttons for the host next to every other user', () => {
    renderWithStore(<UsersTable heading="Players" />, {
      preloadedState: state({ playerName: 'alice', host: 'alice', users: ['alice', 'bob'] }),
    })
    // One transfer button and one kick button — for bob
    const transferButtons = screen
      .getAllByRole('button')
      .filter((b) => b.querySelector('[data-testid="SwapHorizRoundedIcon"]'))
    const kickButtons = screen
      .getAllByRole('button')
      .filter((b) => b.querySelector('[data-testid="PersonRemoveRoundedIcon"]'))
    expect(transferButtons).toHaveLength(1)
    expect(kickButtons).toHaveLength(1)
  })

  it('POSTs to /promote when the host clicks transfer', async () => {
    renderWithStore(<UsersTable heading="Players" />, {
      preloadedState: state({ playerName: 'alice', host: 'alice', users: ['alice', 'bob'] }),
    })

    const transferBtn = screen
      .getAllByRole('button')
      .find((b) => b.querySelector('[data-testid="SwapHorizRoundedIcon"]'))
    await act(async () => {
      fireEvent.click(transferBtn)
    })

    expect(axios.post).toHaveBeenCalledWith(expect.stringMatching(/\/promote$/), expect.anything())
  })

  it('opens a confirmation dialog before kicking, and cancels cleanly', async () => {
    renderWithStore(<UsersTable heading="Players" />, {
      preloadedState: state({ playerName: 'alice', host: 'alice', users: ['alice', 'bob'] }),
    })

    const kickBtn = screen
      .getAllByRole('button')
      .find((b) => b.querySelector('[data-testid="PersonRemoveRoundedIcon"]'))
    await act(async () => {
      fireEvent.click(kickBtn)
    })

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/Remove participant/)).toBeInTheDocument()
    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: /Cancel/ }))
    })
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('POSTs to /kick only after confirmation', async () => {
    renderWithStore(<UsersTable heading="Players" />, {
      preloadedState: state({ playerName: 'alice', host: 'alice', users: ['alice', 'bob'] }),
    })

    const kickBtn = screen
      .getAllByRole('button')
      .find((b) => b.querySelector('[data-testid="PersonRemoveRoundedIcon"]'))
    await act(async () => {
      fireEvent.click(kickBtn)
    })
    const dialog = screen.getByRole('dialog')
    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: /^Remove$/ }))
    })

    expect(axios.post).toHaveBeenCalledWith(expect.stringMatching(/\/kick$/), expect.anything())
  })
})
