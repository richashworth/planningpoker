// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, act, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: { sessionId: 'abc12345' } })),
  },
}))

import axios from 'axios'
import JoinGame from '../JoinGame'
import { renderWithStore } from '../../testUtils/renderWithStore'

function emptyState() {
  return {
    game: { sessionId: null, playerName: null, host: null, legalEstimates: [] },
    results: [],
    users: [],
    voted: false,
    notification: { error: null },
    rounds: [],
  }
}

function renderPage() {
  return renderWithStore(
    <MemoryRouter>
      <JoinGame />
    </MemoryRouter>,
    { preloadedState: emptyState() },
  )
}

describe('JoinGame page', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => cleanup())

  it('renders name + session id inputs and a join button', () => {
    renderPage()
    expect(screen.getByLabelText(/Session ID/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Join Game/ })).toBeInTheDocument()
  })

  it('skips submission and does not POST when the name is too short', async () => {
    renderPage()
    const form = screen.getByRole('button', { name: /Join Game/ }).closest('form')
    await act(async () => {
      fireEvent.submit(form)
    })
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('POSTs to /joinSession with a valid name + session id', async () => {
    renderPage()
    const nameInput = screen.getByLabelText(/Your Name/i)
    const sessionInput = screen.getByLabelText(/Session ID/)
    const form = screen.getByRole('button', { name: /Join Game/ }).closest('form')

    fireEvent.change(nameInput, { target: { value: 'alice' } })
    fireEvent.change(sessionInput, { target: { value: 'abc12345' } })
    await act(async () => {
      fireEvent.submit(form)
    })

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringMatching(/\/joinSession$/),
      expect.anything(),
    )
  })
})
