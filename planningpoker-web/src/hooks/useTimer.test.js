import { describe, it, expect } from 'vitest'
import { computeRemainingSeconds } from './useTimer'

const baseTimer = {
  enabled: true,
  durationSeconds: 60,
  startedAt: null,
  pausedAt: null,
  accumulatedPausedMs: 0,
  serverNow: 0,
}

describe('computeRemainingSeconds', () => {
  it('returns durationSeconds when disabled', () => {
    const timer = { ...baseTimer, enabled: false }
    expect(computeRemainingSeconds(timer, Date.now())).toBe(60)
  })

  it('returns durationSeconds when not yet started (idle)', () => {
    const timer = { ...baseTimer, startedAt: null }
    expect(computeRemainingSeconds(timer, Date.now())).toBe(60)
  })

  it('returns decremented value when running mid-flight', () => {
    const startedAt = 1000000
    const nowMs = startedAt + 10000 // 10 seconds elapsed
    const timer = { ...baseTimer, startedAt, pausedAt: null, accumulatedPausedMs: 0 }
    expect(computeRemainingSeconds(timer, nowMs)).toBe(50)
  })

  it('returns frozen value when paused', () => {
    const startedAt = 1000000
    const pausedAt = startedAt + 15000 // paused after 15s
    const nowMs = pausedAt + 30000 // 30 more seconds have passed while paused
    const timer = { ...baseTimer, startedAt, pausedAt, accumulatedPausedMs: 0 }
    // should use pausedAt as reference, not nowMs
    expect(computeRemainingSeconds(timer, nowMs)).toBe(45)
  })

  it('clamps to 0 when expired', () => {
    const startedAt = 1000000
    const nowMs = startedAt + 70000 // 70s elapsed, duration is 60
    const timer = { ...baseTimer, startedAt, pausedAt: null, accumulatedPausedMs: 0 }
    expect(computeRemainingSeconds(timer, nowMs)).toBe(0)
  })

  it('accounts for accumulated paused time', () => {
    const startedAt = 1000000
    const nowMs = startedAt + 30000 // 30s since start
    const accumulatedPausedMs = 10000 // 10s was spent paused
    const timer = { ...baseTimer, startedAt, pausedAt: null, accumulatedPausedMs }
    // effective elapsed = 30s - 10s = 20s, remaining = 60 - 20 = 40
    expect(computeRemainingSeconds(timer, nowMs)).toBe(40)
  })
})
