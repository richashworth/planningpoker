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
import { lightTheme } from '../../theme'

const PRIMARY = lightTheme.palette.primary.main
const BAR_MUTED = lightTheme.palette.chart.barMuted

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

function lastBarProps() {
  return barSpy.mock.calls[barSpy.mock.calls.length - 1][0]
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

    const props = lastBarProps()
    expect(props.data.labels).toEqual(['1', '2', '3', '5', '8'])
    expect(props.data.datasets[0].data[3]).toBe(2)
  })

  it('uses the muted bar fill for every bar when no consensus is set', () => {
    renderWithStore(<ResultsChart />, { preloadedState: state() })
    const ds = lastBarProps().data.datasets[0]
    expect(new Set(ds.backgroundColor).size).toBe(1)
    expect(ds.backgroundColor[0]).toBe(BAR_MUTED)
    expect(ds.borderWidth.every((w) => w === 0)).toBe(true)
  })

  it('paints the consensus bar with primary and others muted', () => {
    renderWithStore(<ResultsChart consensus="5" />, { preloadedState: state() })
    const ds = lastBarProps().data.datasets[0]
    // labels are ['1','2','3','5','8'] — index 3 is '5'
    expect(ds.backgroundColor[3]).toBe(PRIMARY)
    expect(ds.backgroundColor[0]).toBe(BAR_MUTED)
    expect(ds.backgroundColor.filter((c) => c === PRIMARY)).toHaveLength(1)
    // Border matches fill, no separate outline.
    expect(ds.borderColor).toEqual(ds.backgroundColor)
  })

  it('hides the underlying tick label for the consensus index so the pill renders cleanly', () => {
    renderWithStore(<ResultsChart consensus="2" />, { preloadedState: state() })
    const tickColorFn = lastBarProps().options.scales.x.ticks.color
    expect(typeof tickColorFn).toBe('function')
    // Index 1 is '2' (the consensus) → transparent; index 0 is '1' → secondary text color.
    expect(tickColorFn({ index: 1 })).toBe('transparent')
    expect(tickColorFn({ index: 0 })).not.toBe('transparent')
  })

  it('does not hide any tick label when no consensus is set', () => {
    renderWithStore(<ResultsChart />, { preloadedState: state() })
    const tickColorFn = lastBarProps().options.scales.x.ticks.color
    const colors = [0, 1, 2, 3, 4].map((i) => tickColorFn({ index: i }))
    expect(new Set(colors).size).toBe(1)
    expect(colors[0]).not.toBe('transparent')
  })

  it('registers the axis-pill plugin with current consensus options', () => {
    renderWithStore(<ResultsChart consensus="2" />, {
      preloadedState: state({
        results: [{ userName: 'alice', estimateValue: '5' }],
      }),
    })
    const props = lastBarProps()
    expect(Array.isArray(props.plugins)).toBe(true)
    expect(props.plugins.some((p) => p.id === 'consensusAxisPill')).toBe(true)
    // Old plugin is gone.
    expect(props.plugins.some((p) => p.id === 'consensusAxisHighlight')).toBe(false)
    expect(props.options.plugins.consensusAxisPill).toEqual({
      consensus: '2',
      legalEstimates: ['1', '2', '3', '5', '8'],
      pillBg: PRIMARY,
      pillFg: '#fff',
    })
  })

  it('passes null consensus to the axis-pill plugin when none provided', () => {
    renderWithStore(<ResultsChart />, { preloadedState: state() })
    expect(lastBarProps().options.plugins.consensusAxisPill.consensus).toBeNull()
  })
})
