import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Vote from './Vote'
import Results from './Results'
import SessionHeader from './SessionHeader'
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

  // Dedup the reveal announcement off the voted state transition (not raw WS
  // message arrival) so the server's burst of duplicate broadcasts is absorbed.
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

  // First consensus announcement is deferred 1500ms so screen readers finish
  // reading the reveal text before it gets overwritten; subsequent changes use
  // a 750ms trailing-edge debounce.
  useEffect(() => {
    if (!voted) return
    if (!displayConsensus) return
    if (displayConsensus === lastAnnouncedConsensusRef.current) return

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
          <Vote consensusOverride={consensusOverride} />
        )}
      </Box>
    </>
  )
}
