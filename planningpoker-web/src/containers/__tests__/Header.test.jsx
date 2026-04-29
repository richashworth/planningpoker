// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, act, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'

const toggleColorMode = vi.fn()
vi.mock('../../App', () => ({
  useColorMode: () => ({ toggleColorMode, mode: 'light' }),
}))

vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))

import axios from 'axios'
import Header from '../Header'
import { renderWithStore } from '../../testUtils/renderWithStore'

function preloaded({ sessionId = 'abc12345', playerName = 'alice' } = {}) {
  return {
    game: { sessionId, playerName, host: playerName, isAdmin: true, legalEstimates: [] },
    results: [],
    users: [],
    voted: false,
    notification: { error: null },
    rounds: [],
  }
}

function renderHeader(state = preloaded()) {
  return renderWithStore(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
    { preloadedState: state },
  )
}

describe('Header container', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Writable clipboard stub
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn(() => Promise.resolve()) },
      configurable: true,
    })
  })
  afterEach(() => cleanup())

  it('calls toggleColorMode when the dark-mode button is clicked', async () => {
    renderHeader()

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Toggle dark mode'))
    })
    expect(toggleColorMode).toHaveBeenCalledTimes(1)
  })

  it('writes the session id to the clipboard when the copy icon is clicked', async () => {
    renderHeader()

    // The Chip's delete icon is the copy control — it has no accessible name but
    // sits inside a tooltip.
    const chip = screen.getByText(/Session ID:/).closest('.MuiChip-root')
    const copyButton = chip.querySelector('.MuiChip-deleteIcon')
    await act(async () => {
      fireEvent.click(copyButton)
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('abc12345')
  })

  it('shows the user menu with "Log out" when the name button is clicked', async () => {
    renderHeader()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Alice/ }))
    })
    expect(screen.getByRole('menuitem', { name: /Log out/ })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /About/ })).toBeInTheDocument()
  })

  it('dispatches leaveGame → POSTs /logout when Log out is clicked', async () => {
    renderHeader()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Alice/ }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('menuitem', { name: /Log out/ }))
    })

    expect(axios.post).toHaveBeenCalledWith(expect.stringMatching(/\/logout$/), expect.anything())
  })

  it('omits session chip and user menu when not in a session', () => {
    renderHeader(preloaded({ sessionId: null, playerName: null }))
    expect(screen.queryByText(/Session ID:/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Alice/ })).not.toBeInTheDocument()
  })
})
