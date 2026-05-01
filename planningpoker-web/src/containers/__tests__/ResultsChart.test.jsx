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

  it('uses uniform default colors when no consensus is passed', () => {
    renderWithStore(<ResultsChart />, { preloadedState: state() })
    const ds = barSpy.mock.calls[barSpy.mock.calls.length - 1][0].data.datasets[0]
    const unique = new Set(ds.backgroundColor)
    expect(unique.size).toBe(1)
    expect(ds.borderWidth.every((w) => w === 1)).toBe(true)
  })

  it('highlights only the bar matching the consensus value', () => {
    renderWithStore(<ResultsChart consensus="5" />, { preloadedState: state() })
    const ds = barSpy.mock.calls[barSpy.mock.calls.length - 1][0].data.datasets[0]
    // labels are ['1','2','3','5','8'] — index 3 is '5'
    expect(ds.backgroundColor[3]).not.toBe(ds.backgroundColor[0])
    expect(ds.borderWidth[3]).toBe(2)
    expect(ds.borderWidth[0]).toBe(1)
    // Only one bar is highlighted
    const highlightedCount = ds.borderWidth.filter((w) => w === 2).length
    expect(highlightedCount).toBe(1)
  })

  it('highlights the x-axis tick whenever consensus is set', () => {
    // Case A: consensus value has zero votes
    renderWithStore(<ResultsChart consensus="2" />, {
      preloadedState: state({
        results: [{ userName: 'alice', estimateValue: '5' }],
      }),
    })
    let props = barSpy.mock.calls[barSpy.mock.calls.length - 1][0]
    let tickColorFn = props.options.scales.x.ticks.color
    let tickFontFn = props.options.scales.x.ticks.font
    expect(typeof tickColorFn).toBe('function')
    expect(tickColorFn({ index: 1 })).not.toBe(tickColorFn({ index: 0 }))
    expect(tickFontFn({ index: 1 })).toEqual({ weight: 'bold' })
    expect(tickFontFn({ index: 0 })).toEqual({})

    cleanup()
    barSpy.mockReset()

    // Case B: consensus value has votes — tick still highlights
    renderWithStore(<ResultsChart consensus="5" />, {
      preloadedState: state({
        results: [{ userName: 'alice', estimateValue: '5' }],
      }),
    })
    props = barSpy.mock.calls[barSpy.mock.calls.length - 1][0]
    tickColorFn = props.options.scales.x.ticks.color
    tickFontFn = props.options.scales.x.ticks.font
    // index 3 is '5'
    expect(tickColorFn({ index: 3 })).not.toBe(tickColorFn({ index: 0 }))
    expect(tickFontFn({ index: 3 })).toEqual({ weight: 'bold' })
  })

  it('does not highlight any x-axis tick when no consensus is set', () => {
    renderWithStore(<ResultsChart />, { preloadedState: state() })
    const props = barSpy.mock.calls[barSpy.mock.calls.length - 1][0]
    const tickColorFn = props.options.scales.x.ticks.color
    const tickFontFn = props.options.scales.x.ticks.font
    const colors = [0, 1, 2, 3, 4].map((i) => tickColorFn({ index: i }))
    expect(new Set(colors).size).toBe(1)
    ;[0, 1, 2, 3, 4].forEach((i) => expect(tickFontFn({ index: i })).toEqual({}))
  })

  it('registers the axis-highlight plugin with current consensus options', () => {
    renderWithStore(<ResultsChart consensus="2" />, {
      preloadedState: state({
        results: [{ userName: 'alice', estimateValue: '5' }],
      }),
    })
    const props = barSpy.mock.calls[barSpy.mock.calls.length - 1][0]
    expect(Array.isArray(props.plugins)).toBe(true)
    expect(props.plugins.some((p) => p.id === 'consensusAxisHighlight')).toBe(true)
    expect(props.options.plugins.consensusAxisHighlight).toEqual({
      consensus: '2',
      legalEstimates: ['1', '2', '3', '5', '8'],
      aggregateData: [0, 0, 0, 1, 0],
    })
  })

  it('passes null consensus to the axis-highlight plugin when none provided', () => {
    renderWithStore(<ResultsChart />, { preloadedState: state() })
    const props = barSpy.mock.calls[barSpy.mock.calls.length - 1][0]
    expect(props.options.plugins.consensusAxisHighlight.consensus).toBeNull()
  })
})
