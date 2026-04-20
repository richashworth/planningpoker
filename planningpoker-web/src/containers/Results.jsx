import { useSelector, useDispatch } from 'react-redux'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import DownloadIcon from '@mui/icons-material/Download'
import ResultsTable from './ResultsTable'
import ResultsChart from './ResultsChart'
import ConsensusCardRail from '../components/ConsensusCardRail'
import { resetSession, roundCompleted } from '../actions'
import { calcConsensus } from '../utils/consensus'
import { generateCsv, downloadCsv } from '../utils/csvExport'

export default function Results({ consensusOverride, setConsensusOverride }) {
  const dispatch = useDispatch()
  const isAdmin = useSelector((state) => state.game.isAdmin)
  const sessionId = useSelector((state) => state.game.sessionId)
  const playerName = useSelector((state) => state.game.playerName)
  const currentLabel = useSelector((state) => state.game.currentLabel)
  const results = useSelector((state) => state.results)
  const rounds = useSelector((state) => state.rounds)
  const users = useSelector((state) => state.users)
  const legalEstimates = useSelector((state) => state.game.legalEstimates)

  const autoConsensus = calcConsensus(results)
  const displayConsensus = consensusOverride || autoConsensus
  const totalRounds = rounds.length + (results.length > 0 ? 1 : 0)

  const handleNextItem = () => {
    const round = {
      label: currentLabel,
      consensus: consensusOverride || calcConsensus(results),
      votes: [...results],
      timestamp: new Date().toISOString(),
    }
    dispatch(roundCompleted(round))
    setConsensusOverride(null)
    dispatch(resetSession(playerName, sessionId))
  }

  const handleExportCsv = () => {
    const currentRound = {
      label: currentLabel,
      consensus: consensusOverride || calcConsensus(results),
      votes: [...results],
      timestamp: new Date().toISOString(),
    }
    const allRounds = [...rounds, currentRound]
    // Include all current session users plus any historical voters (who may have since left)
    const historicalVoters = allRounds.flatMap((r) => r.votes.map((v) => v.userName))
    const allPlayers = [...new Set([...users, ...historicalVoters])].sort()
    const csv = generateCsv(allRounds, allPlayers)
    downloadCsv(csv, `planning-poker-${sessionId}.csv`)
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ fontSize: '1.1rem', mb: currentLabel ? 1 : 2 }}>
        Results
      </Typography>
      {currentLabel && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
      {isAdmin && (rounds.length > 0 || results.length > 0) && (
        <Box
          sx={{
            mt: 2,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontSize: '0.7rem',
            }}
          >
            Session history · {totalRounds} {totalRounds === 1 ? 'round' : 'rounds'}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleExportCsv}
            disabled={rounds.length === 0 && results.length === 0}
          >
            Export CSV
          </Button>
        </Box>
      )}
    </Box>
  )
}
