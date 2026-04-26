import { useSelector, useDispatch } from 'react-redux'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import ResultsTable from './ResultsTable'
import ResultsChart from './ResultsChart'
import SessionHistory from './SessionHistory'
import ConsensusCardRail from '../components/ConsensusCardRail'
import { resetSession, setConsensusOverride } from '../actions'
import { calcConsensus } from '../utils/consensus'

export default function Results() {
  const dispatch = useDispatch()
  const isAdmin = useSelector((state) => state.game.isAdmin)
  const sessionId = useSelector((state) => state.game.sessionId)
  const playerName = useSelector((state) => state.game.playerName)
  const results = useSelector((state) => state.results)
  const legalEstimates = useSelector((state) => state.game.legalEstimates)
  const consensusOverride = useSelector((state) => state.consensus.value)

  const autoConsensus = calcConsensus(results)
  const displayConsensus = consensusOverride || autoConsensus

  const handleNextItem = () => {
    const consensus = consensusOverride || calcConsensus(results) || ''
    dispatch(resetSession(playerName, sessionId, consensus))
  }

  const handleConsensusChange = (v) => {
    // Clicking the auto-consensus card clears the override (server broadcasts null,value);
    // clicking a different card sets that value as the locked-in consensus.
    const next = v === autoConsensus ? null : v
    dispatch(setConsensusOverride(playerName, sessionId, next))
  }

  return (
    <Box>
      {isAdmin && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 240px' },
            gap: 3,
            alignItems: 'end',
            mb: 2.5,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            {displayConsensus && (
              <ConsensusCardRail
                legalEstimates={legalEstimates}
                results={results}
                value={displayConsensus}
                onChange={handleConsensusChange}
              />
            )}
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: { xs: 'stretch', md: 'flex-end' },
              gap: 1,
            }}
          >
            <Button
              variant="contained"
              size="large"
              disableElevation
              onClick={handleNextItem}
              sx={{ px: 4, alignSelf: { xs: 'stretch', md: 'flex-end' } }}
            >
              Next Item
            </Button>
            {autoConsensus && (
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>
                Suggested:{' '}
                <Box component="strong" sx={{ color: 'text.primary' }}>
                  {autoConsensus}
                </Box>{' '}
                (mode)
              </Typography>
            )}
          </Box>
        </Box>
      )}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 240px' },
          gap: 3,
          alignItems: 'start',
          minHeight: 300,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Box
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 2.5,
              transition: 'border-color 0.3s ease, background-color 0.3s ease',
            }}
          >
            <ResultsChart consensus={displayConsensus} />
          </Box>
          <SessionHistory consensusOverride={consensusOverride} />
        </Box>
        <ResultsTable />
      </Box>
    </Box>
  )
}
