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
import CreateGame from '../CreateGame'
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
      <CreateGame />
    </MemoryRouter>,
    { preloadedState: emptyState() },
  )
}

describe('CreateGame page', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => cleanup())

  it('renders the four standard scheme tiles + custom', () => {
    renderPage()
    expect(screen.getByText('Fibonacci')).toBeInTheDocument()
    expect(screen.getByText('T-shirt')).toBeInTheDocument()
    expect(screen.getByText('Simple')).toBeInTheDocument()
    expect(screen.getByText('Time')).toBeInTheDocument()
    expect(screen.getByText('Custom')).toBeInTheDocument()
  })

  it('does not POST when the name is invalid (empty)', async () => {
    renderPage()
    const form = screen.getByRole('button', { name: /Start Game/ }).closest('form')
    await act(async () => {
      fireEvent.submit(form)
    })
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('POSTs to /createSession when the form is submitted with a valid name', async () => {
    renderPage()
    fireEvent.change(screen.getByLabelText(/Your Name/i), { target: { value: 'alice' } })

    const form = screen.getByRole('button', { name: /Start Game/ }).closest('form')
    await act(async () => {
      fireEvent.submit(form)
    })

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringMatching(/\/createSession$/),
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

    const button = screen.getByRole('button', { name: /Start Game/ })
    expect(button).not.toBeDisabled()

    const form = button.closest('form')
    await act(async () => {
      fireEvent.submit(form)
    })

    // While the in-flight POST is unresolved, the button must stay disabled
    // so a second click can't fire another /createSession.
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

    const button = screen.getByRole('button', { name: /Start Game/ })
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

    const form = screen.getByRole('button', { name: /Start Game/ }).closest('form')
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
