import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Vote from './Vote'
import Results from './Results'
import SessionHeader from './SessionHeader'
import SessionHistory from './SessionHistory'
import LiveAnnouncer from '../components/LiveAnnouncer'
import { calcConsensus } from '../utils/consensus'

export default function GamePane({ connected }) {
  const voted = useSelector((state) => state.voted)
  const results = useSelector((state) => state.results)
  const users = useSelector((state) => state.users)
  const consensusOverride = useSelector((state) => state.consensus.value)

  const [announcement, setAnnouncement] = useState('')
  const announcedForRevealRef = useRef(false)
  const consensusDebounceRef = useRef(null)
  const lastAnnouncedConsensusRef = useRef(null)

  const autoConsensus = calcConsensus(results)
  const displayConsensus = consensusOverride || autoConsensus

  // Reveal announcement: fire once per voted false→true transition.
  // Dedup is driven by the voted state transition, not raw WS message arrival,
  // so MessagingUtils burst (10ms/50ms/150ms/500ms/2s/5s) is naturally handled.
  useEffect(() => {
    if (voted && !announcedForRevealRef.current) {
      setAnnouncement(`Votes revealed: ${results.length} of ${users.length} players voted`)
      announcedForRevealRef.current = true
    }
    if (!voted && announcedForRevealRef.current) {
      announcedForRevealRef.current = false
      lastAnnouncedConsensusRef.current = null
    }
  }, [voted, results.length, users.length])

  // Consensus announcement: first value deferred 1500ms (to avoid overwriting reveal
  // announcement in screen readers), subsequent changes debounced 750ms trailing edge.
  useEffect(() => {
    if (!voted) return
    if (!displayConsensus) return
    if (displayConsensus === lastAnnouncedConsensusRef.current) return

    // Both first and subsequent announcements go through debounce to avoid
    // overwriting the reveal announcement that fires on the same render cycle.
    // First: 1500ms (lets screen readers announce reveal first).
    // Subsequent: 750ms trailing edge.
    const delay = lastAnnouncedConsensusRef.current === null ? 1500 : 750

    if (consensusDebounceRef.current) clearTimeout(consensusDebounceRef.current)
    consensusDebounceRef.current = setTimeout(() => {
      setAnnouncement(`Consensus: ${displayConsensus}`)
      lastAnnouncedConsensusRef.current = displayConsensus
    }, delay)

    return () => {
      if (consensusDebounceRef.current) clearTimeout(consensusDebounceRef.current)
    }
  }, [voted, displayConsensus])

  return (
    <>
      {connected === false && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            mb: 2,
            borderRadius: 1,
            bgcolor: (t) =>
              t.palette.mode === 'dark' ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)',
            border: '1px solid',
            borderColor: 'error.main',
          }}
        >
          <Box
            sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main', flexShrink: 0 }}
          />
          <Typography variant="body2" sx={{ color: 'error.main', fontSize: '0.8rem' }}>
            Reconnecting...
          </Typography>
        </Box>
      )}
      <LiveAnnouncer message={announcement} />
      <Box>
        <SessionHeader />
        {voted ? (
          <Results />
        ) : (
          <>
            <Vote />
            <SessionHistory consensusOverride={consensusOverride} />
          </>
        )}
      </Box>
    </>
  )
}
