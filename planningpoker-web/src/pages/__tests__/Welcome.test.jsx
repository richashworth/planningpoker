// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'

import Welcome from '../Welcome'
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

function renderWelcome() {
  return renderWithStore(
    <MemoryRouter>
      <Welcome />
    </MemoryRouter>,
    { preloadedState: emptyState() },
  )
}

describe('Welcome page', () => {
  beforeEach(() => sessionStorage.clear())
  afterEach(() => cleanup())

  it('renders CTAs for Join and Host', () => {
    renderWelcome()
    expect(screen.getByRole('link', { name: /Join Game/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Host New Game/ })).toBeInTheDocument()
  })

  it('drains sessionStorage["pp-kicked-message"] into a toast on mount', () => {
    sessionStorage.setItem('pp-kicked-message', 'You were removed by the host.')
    renderWelcome()
    expect(screen.getByText(/You were removed by the host/)).toBeInTheDocument()
    expect(sessionStorage.getItem('pp-kicked-message')).toBeNull()
  })
})
