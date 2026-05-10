import { describe, it, expect } from 'vitest'
import { calcConsensus, calcStats } from './consensus'

const FIB = ['1', '2', '3', '5', '8', '13', '?']
const TSHIRT = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?']

describe('calcConsensus', () => {
  it('returns mode when one value has most votes', () => {
    const results = [
      { userName: 'a', estimateValue: '5' },
      { userName: 'b', estimateValue: '5' },
      { userName: 'c', estimateValue: '3' },
    ]
    expect(calcConsensus(results, FIB)).toBe('5')
  })

  it('returns sole value for single voter', () => {
    expect(calcConsensus([{ userName: 'a', estimateValue: '8' }], FIB)).toBe('8')
  })

  it('returns null for empty array', () => {
    expect(calcConsensus([], FIB)).toBeNull()
  })

  describe('tie-break: prefer larger value', () => {
    it('picks the numerically larger value on a numeric tie', () => {
      const results = [
        { userName: 'a', estimateValue: '5' },
        { userName: 'b', estimateValue: '3' },
      ]
      expect(calcConsensus(results, FIB)).toBe('5')
    })

    it('picks the larger value via scheme order for a T-shirt tie', () => {
      const results = [
        { userName: 'a', estimateValue: 'M' },
        { userName: 'b', estimateValue: 'L' },
        { userName: 'c', estimateValue: 'S' },
      ]
      expect(calcConsensus(results, TSHIRT)).toBe('L')
    })

    it('respects custom-scheme ordering when picking the larger value', () => {
      const custom = ['tiny', 'small', 'medium', 'large', 'huge', '?']
      const results = [
        { userName: 'a', estimateValue: 'small' },
        { userName: 'b', estimateValue: 'large' },
      ]
      expect(calcConsensus(results, custom)).toBe('large')
    })

    it('falls back to numeric comparison when no scheme is provided', () => {
      const results = [
        { userName: 'a', estimateValue: '5' },
        { userName: 'b', estimateValue: '13' },
      ]
      expect(calcConsensus(results)).toBe('13')
    })
  })

  describe('"?" handling', () => {
    it('does not auto-pick "?" even when it is the most popular', () => {
      const results = [
        { userName: 'a', estimateValue: '?' },
        { userName: 'b', estimateValue: '?' },
        { userName: 'c', estimateValue: '5' },
      ]
      expect(calcConsensus(results, FIB)).toBe('5')
    })

    it('returns null when every vote is "?"', () => {
      const results = [
        { userName: 'a', estimateValue: '?' },
        { userName: 'b', estimateValue: '?' },
      ]
      expect(calcConsensus(results, FIB)).toBeNull()
    })

    it('ignores "?" in tie-break even when "?" ties with a real value', () => {
      const results = [
        { userName: 'a', estimateValue: '?' },
        { userName: 'b', estimateValue: '?' },
        { userName: 'c', estimateValue: '8' },
        { userName: 'd', estimateValue: '8' },
        { userName: 'e', estimateValue: '5' },
      ]
      expect(calcConsensus(results, FIB)).toBe('8')
    })

    it('still picks the larger non-"?" value when "?" ties with multiple real values', () => {
      const results = [
        { userName: 'a', estimateValue: '?' },
        { userName: 'b', estimateValue: '?' },
        { userName: 'c', estimateValue: '3' },
        { userName: 'd', estimateValue: '3' },
        { userName: 'e', estimateValue: '8' },
        { userName: 'f', estimateValue: '8' },
      ]
      expect(calcConsensus(results, FIB)).toBe('8')
    })
  })
})

describe('calcStats', () => {
  it('returns mode, min, max, variance for numeric values', () => {
    const results = [{ estimateValue: '1' }, { estimateValue: '3' }, { estimateValue: '5' }]
    const stats = calcStats(results, FIB)
    // three-way numeric tie tie-breaks to the larger value
    expect(stats.mode).toBe('5')
    expect(stats.min).toBe('1')
    expect(stats.max).toBe('5')
    expect(stats.variance).toBe('2.67')
  })

  it('returns mode only (null for numeric stats) for non-numeric values', () => {
    const results = [{ estimateValue: 'M' }, { estimateValue: 'L' }, { estimateValue: 'M' }]
    const stats = calcStats(results, TSHIRT)
    expect(stats.mode).toBe('M')
    expect(stats.min).toBeNull()
    expect(stats.max).toBeNull()
    expect(stats.variance).toBeNull()
  })

  it('returns all values for numeric stats when all same value', () => {
    const results = [{ estimateValue: '5' }, { estimateValue: '5' }, { estimateValue: '5' }]
    const stats = calcStats(results, FIB)
    expect(stats.mode).toBe('5')
    expect(stats.min).toBe('5')
    expect(stats.max).toBe('5')
    expect(stats.variance).toBe('0.00')
  })

  it('returns null mode when every vote is "?"', () => {
    const results = [{ estimateValue: '?' }, { estimateValue: '?' }]
    const stats = calcStats(results, FIB)
    expect(stats.mode).toBeNull()
  })

  it('returns null for empty results', () => {
    const stats = calcStats([])
    expect(stats.mode).toBeNull()
    expect(stats.min).toBeNull()
    expect(stats.max).toBeNull()
    expect(stats.variance).toBeNull()
  })
})
