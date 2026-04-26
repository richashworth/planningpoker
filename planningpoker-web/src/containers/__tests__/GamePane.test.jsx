// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, cleanup } from '@testing-library/react'
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

import GamePane from '../GamePane'
import { renderWithStore } from '../../testUtils/renderWithStore'

function state({ voted = false } = {}) {
  return {
    game: {
      sessionId: 'abc12345',
      playerName: 'alice',
      isAdmin: false,
      host: 'alice',
      currentLabel: '',
      legalEstimates: ['1', '2', '3'],
    },
    results: voted ? [{ userName: 'alice', estimateValue: '3' }] : [],
    users: ['alice'],
    voted,
    notification: { error: null },
    rounds: [],
    consensus: { value: null, round: 0 },
  }
}

describe('GamePane container', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => cleanup())

  it('renders the Vote view when voted=false', () => {
    renderWithStore(<GamePane connected={true} />, { preloadedState: state({ voted: false }) })
    expect(screen.getByText(/Cast your estimate/)).toBeInTheDocument()
  })

  it('renders the Results view when voted=true', () => {
    renderWithStore(<GamePane connected={true} />, { preloadedState: state({ voted: true }) })
    expect(screen.queryByText(/Cast your estimate/)).not.toBeInTheDocument()
    expect(screen.getByText(/Round/)).toBeInTheDocument()
  })

  it('shows the Reconnecting banner when connected=false', () => {
    renderWithStore(<GamePane connected={false} />, { preloadedState: state() })
    expect(screen.getByText(/Reconnecting/)).toBeInTheDocument()
  })

  it('hides the Reconnecting banner when connected=true', () => {
    renderWithStore(<GamePane connected={true} />, { preloadedState: state() })
    expect(screen.queryByText(/Reconnecting/)).not.toBeInTheDocument()
  })

  it('is resilient to connected=undefined (initial render)', () => {
    renderWithStore(<GamePane />, { preloadedState: state() })
    expect(screen.queryByText(/Reconnecting/)).not.toBeInTheDocument()
  })
})
