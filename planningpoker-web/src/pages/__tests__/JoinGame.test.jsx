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

  it('disables the submit button while the POST is in flight and re-enables on success', async () => {
    let resolvePost
    axios.post.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePost = () => resolve({ data: { sessionId: 'abc12345' } })
        }),
    )

    renderPage()
    fireEvent.change(screen.getByLabelText(/Your Name/i), { target: { value: 'alice' } })
    fireEvent.change(screen.getByLabelText(/Session ID/), { target: { value: 'abc12345' } })

    const button = screen.getByRole('button', { name: /Join Game/ })
    expect(button).not.toBeDisabled()

    const form = button.closest('form')
    await act(async () => {
      fireEvent.submit(form)
    })

    // While the in-flight POST is unresolved, the button must stay disabled
    // so a second click can't fire another /joinSession.
    expect(button).toBeDisabled()

    await act(async () => {
      resolvePost()
    })

    expect(button).not.toBeDisabled()
    expect(axios.post).toHaveBeenCalledTimes(1)
  })

  it('re-enables the submit button after a failed POST', async () => {
    let rejectPost
    axios.post.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectPost = () => reject(new Error('boom'))
        }),
    )

    renderPage()
    fireEvent.change(screen.getByLabelText(/Your Name/i), { target: { value: 'alice' } })
    fireEvent.change(screen.getByLabelText(/Session ID/), { target: { value: 'abc12345' } })

    const button = screen.getByRole('button', { name: /Join Game/ })
    const form = button.closest('form')
    await act(async () => {
      fireEvent.submit(form)
    })
    expect(button).toBeDisabled()

    await act(async () => {
      rejectPost()
    })

    expect(button).not.toBeDisabled()
  })

  it('does not issue a second POST when the form is re-submitted while submitting', async () => {
    let resolvePost
    axios.post.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePost = () => resolve({ data: { sessionId: 'abc12345' } })
        }),
    )

    renderPage()
    fireEvent.change(screen.getByLabelText(/Your Name/i), { target: { value: 'alice' } })
    fireEvent.change(screen.getByLabelText(/Session ID/), { target: { value: 'abc12345' } })

    const form = screen.getByRole('button', { name: /Join Game/ }).closest('form')
    await act(async () => {
      fireEvent.submit(form)
    })

    // Simulate a rapid second submission while the first is still pending.
    await act(async () => {
      fireEvent.submit(form)
    })

    expect(axios.post).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolvePost()
    })
  })
})
