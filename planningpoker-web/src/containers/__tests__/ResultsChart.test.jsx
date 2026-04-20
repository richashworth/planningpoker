// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// react-chartjs-2 renders to canvas; stub to a sentinel so we can verify it's
// instantiated with the props we care about.
const barSpy = vi.fn(() => null)
vi.mock('react-chartjs-2', () => ({
  Bar: (props) => {
    barSpy(props)
    return null
  },
}))

import ResultsChart from '../ResultsChart'
import { renderWithStore } from '../../testUtils/renderWithStore'

function state({ results = [], legalEstimates = ['1', '2', '3', '5', '8'] } = {}) {
  return {
    game: { sessionId: 'x', playerName: 'alice', host: 'alice', legalEstimates },
    results,
    users: [],
    voted: false,
    notification: { error: null },
    rounds: [],
  }
}

describe('ResultsChart container', () => {
  afterEach(() => {
    cleanup()
    barSpy.mockReset()
  })

  it('mounts without crashing on empty results', () => {
    renderWithStore(<ResultsChart />, { preloadedState: state() })
    expect(barSpy).toHaveBeenCalled()
  })

  it('passes a dataset with all legal estimate labels to Chart.js', () => {
    renderWithStore(<ResultsChart />, {
      preloadedState: state({
        results: [
          { userName: 'alice', estimateValue: '5' },
          { userName: 'bob', estimateValue: '5' },
        ],
      }),
    })

    const props = barSpy.mock.calls[barSpy.mock.calls.length - 1][0]
    expect(props.data.labels).toEqual(['1', '2', '3', '5', '8'])
    // The bar for "5" should have count 2
    const values = props.data.datasets[0].data
    expect(values[3]).toBe(2)
  })
})
