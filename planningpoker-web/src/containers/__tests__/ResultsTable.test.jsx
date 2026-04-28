// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { screen, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

import ResultsTable from '../ResultsTable'
import { renderWithStore } from '../../testUtils/renderWithStore'

function state({ results = [], users = [] } = {}) {
  return {
    game: { sessionId: 'x', playerName: 'alice', host: 'alice', legalEstimates: [] },
    results,
    users,
    voted: false,
    notification: { error: null },
    rounds: [],
  }
}

describe('ResultsTable container', () => {
  afterEach(() => cleanup())

  it('renders the Votes header even when empty', () => {
    renderWithStore(<ResultsTable />, { preloadedState: state() })
    expect(screen.getByText('Votes')).toBeInTheDocument()
  })

  it('renders one row per voter', () => {
    renderWithStore(<ResultsTable />, {
      preloadedState: state({
        results: [
          { userName: 'alice', estimateValue: '5' },
          { userName: 'bob', estimateValue: '3' },
        ],
        users: ['alice', 'bob'],
      }),
    })
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('lists users who have not yet voted', () => {
    renderWithStore(<ResultsTable />, {
      preloadedState: state({
        results: [{ userName: 'alice', estimateValue: '5' }],
        users: ['alice', 'bob'],
      }),
    })
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })
})
