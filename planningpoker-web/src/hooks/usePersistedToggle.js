import { useCallback, useEffect, useState } from 'react'

export default function usePersistedToggle(storageKey, defaultOpen) {
  const [open, setOpen] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored === '0') return false
      if (stored === '1') return true
    } catch {
      // localStorage unavailable (SSR, private mode) — fall through to default
    }
    return defaultOpen
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, open ? '1' : '0')
    } catch {
      // ignore — persistence is best-effort
    }
  }, [storageKey, open])

  const toggle = useCallback(() => setOpen((v) => !v), [])
  return [open, toggle]
}
