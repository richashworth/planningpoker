import { useSelector, useDispatch } from 'react-redux'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import ResultsTable from './ResultsTable'
import ResultsChart from './ResultsChart'
import ConsensusCardRail from '../components/ConsensusCardRail'
import { resetSession } from '../actions'
import { calcConsensus } from '../utils/consensus'

export default function Results({ consensusOverride, setConsensusOverride }) {
  const dispatch = useDispatch()
  const isAdmin = useSelector((state) => state.game.isAdmin)
  const sessionId = useSelector((state) => state.game.sessionId)
  const playerName = useSelector((state) => state.game.playerName)
  const currentLabel = useSelector((state) => state.game.currentLabel)
  const results = useSelector((state) => state.results)
  const rounds = useSelector((state) => state.rounds)
  const legalEstimates = useSelector((state) => state.game.legalEstimates)

  const autoConsensus = calcConsensus(results)
  const displayConsensus = consensusOverride || autoConsensus
  const totalRounds = rounds.length + (results.length > 0 ? 1 : 0)

  const handleNextItem = () => {
    const consensus = consensusOverride || calcConsensus(results) || ''
    setConsensusOverride(null)
    dispatch(resetSession(playerName, sessionId, consensus))
  }

  return (
    <Box>
      <Typography
        component="h2"
        sx={{
          fontSize: '0.6875rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'primary.main',
          mb: 0.5,
        }}
      >
        {totalRounds > 0 ? `Round ${totalRounds}` : 'Results'}
        {results.length > 0 && ' · Revealed'}
      </Typography>
      {currentLabel && (
        <Typography
          sx={{
            fontSize: '1.25rem',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: 'text.primary',
            lineHeight: 1.3,
            wordBreak: 'break-word',
            mb: 2,
          }}
        >
          {currentLabel}
        </Typography>
      )}
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
                onChange={(v) => {
                  setConsensusOverride(v === autoConsensus ? null : v)
                }}
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
          <ResultsChart />
        </Box>
        <ResultsTable />
      </Box>
    </Box>
  )
}
