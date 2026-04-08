import { describe, it, expect } from 'vitest'
import { calcConsensus, calcStats } from './consensus'

describe('calcConsensus', () => {
  it('returns mode when one value has most votes', () => {
    const results = [
      { userName: 'a', estimateValue: '5' },
      { userName: 'b', estimateValue: '5' },
      { userName: 'c', estimateValue: '3' },
    ]
    expect(calcConsensus(results)).toBe('5')
  })

  it('returns alphabetically first value on tie', () => {
    const results = [
      { userName: 'a', estimateValue: '5' },
      { userName: 'b', estimateValue: '3' },
    ]
    expect(calcConsensus(results)).toBe('3')
  })

  it('returns null for empty array', () => {
    expect(calcConsensus([])).toBeNull()
  })

  it('returns sole value for single voter', () => {
    expect(calcConsensus([{ userName: 'a', estimateValue: '8' }])).toBe('8')
  })

  it('handles three-way tie by picking alphabetically first', () => {
    const results = [
      { userName: 'a', estimateValue: 'M' },
      { userName: 'b', estimateValue: 'L' },
      { userName: 'c', estimateValue: 'S' },
    ]
    expect(calcConsensus(results)).toBe('L')
  })
})

describe('calcStats', () => {
  it('returns mode, min, max, variance for numeric values', () => {
    const results = [
      { estimateValue: '1' },
      { estimateValue: '3' },
      { estimateValue: '5' },
    ]
    const stats = calcStats(results)
    expect(stats.mode).toBe('1')
    expect(stats.min).toBe('1')
    expect(stats.max).toBe('5')
    expect(stats.variance).toBe('2.67')
  })

  it('returns mode only (null for numeric stats) for non-numeric values', () => {
    const results = [
      { estimateValue: 'M' },
      { estimateValue: 'L' },
      { estimateValue: 'M' },
    ]
    const stats = calcStats(results)
    expect(stats.mode).toBe('M')
    expect(stats.min).toBeNull()
    expect(stats.max).toBeNull()
    expect(stats.variance).toBeNull()
  })

  it('returns all nulls for numeric stats when all same value', () => {
    const results = [
      { estimateValue: '5' },
      { estimateValue: '5' },
      { estimateValue: '5' },
    ]
    const stats = calcStats(results)
    expect(stats.mode).toBe('5')
    expect(stats.min).toBe('5')
    expect(stats.max).toBe('5')
    expect(stats.variance).toBe('0.00')
  })

  it('returns null for empty results', () => {
    const stats = calcStats([])
    expect(stats.mode).toBeNull()
    expect(stats.min).toBeNull()
    expect(stats.max).toBeNull()
    expect(stats.variance).toBeNull()
  })
})
