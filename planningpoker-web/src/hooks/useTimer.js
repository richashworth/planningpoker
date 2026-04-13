import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'

export function computeRemainingSeconds(timer, nowMs) {
  if (!timer.enabled) return timer.durationSeconds
  if (!timer.startedAt) return timer.durationSeconds
  const reference = timer.pausedAt ?? nowMs
  const elapsedMs = reference - timer.startedAt - timer.accumulatedPausedMs
  return Math.max(0, timer.durationSeconds - Math.floor(elapsedMs / 1000))
}

export function useTimer() {
  const timer = useSelector((s) => s.timer)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!timer.enabled || !timer.startedAt || timer.pausedAt) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [timer.enabled, timer.startedAt, timer.pausedAt])
  const remainingSeconds = computeRemainingSeconds(timer, now)
  const running = Boolean(
    timer.enabled && timer.startedAt && !timer.pausedAt && remainingSeconds > 0,
  )
  const paused = Boolean(timer.enabled && timer.startedAt && timer.pausedAt)
  const expired = Boolean(timer.enabled && timer.startedAt && remainingSeconds === 0)
  return { timer, remainingSeconds, running, paused, expired }
}
