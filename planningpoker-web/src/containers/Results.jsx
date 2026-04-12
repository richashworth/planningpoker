import { useSelector, useDispatch } from 'react-redux'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import DownloadIcon from '@mui/icons-material/Download'
import ResultsTable from './ResultsTable'
import ResultsChart from './ResultsChart'
import { resetSession, roundCompleted } from '../actions'
import { calcConsensus, calcStats } from '../utils/consensus'
import { generateCsv, downloadCsv } from '../utils/csvExport'

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

  const handleNextItem = () => {
    const stats = calcStats(results)
    const round = {
      label: currentLabel,
      consensus: consensusOverride || calcConsensus(results),
      votes: [...results],
      timestamp: new Date().toISOString(),
      mode: stats.mode,
      min: stats.min,
      max: stats.max,
      variance: stats.variance,
    }
    dispatch(roundCompleted(round))
    setConsensusOverride(null)
    dispatch(resetSession(playerName, sessionId))
  }

  const handleExportCsv = () => {
    const stats = calcStats(results)
    const currentRound = {
      label: currentLabel,
      consensus: consensusOverride || calcConsensus(results),
      votes: [...results],
      timestamp: new Date().toISOString(),
      mode: stats.mode,
      min: stats.min,
      max: stats.max,
      variance: stats.variance,
    }
    const allRounds = [...rounds, currentRound]
    const allPlayers = [...new Set(allRounds.flatMap((r) => r.votes.map((v) => v.userName)))].sort()
    const csv = generateCsv(allRounds, allPlayers)
    downloadCsv(csv, `planning-poker-${sessionId}.csv`)
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 42,
          mb: currentLabel ? 1 : 2,
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
            Results
          </Typography>
          {displayConsensus &&
            (isAdmin ? (
              <Select
                size="small"
                value={displayConsensus}
                onChange={(e) => {
                  setConsensusOverride(e.target.value === autoConsensus ? null : e.target.value)
                }}
                sx={{ minWidth: 110 }}
              >
                {legalEstimates.map((val) => (
                  <MenuItem key={val} value={val}>
                    Consensus: {val}
                  </MenuItem>
                ))}
              </Select>
            ) : (
              <Typography variant="body1" color="primary" sx={{ fontWeight: 600 }}>
                Consensus: {displayConsensus}
              </Typography>
            ))}
        </Box>
        {isAdmin && (
          <Button
            variant="contained"
            size="large"
            disableElevation
            onClick={handleNextItem}
            sx={{ px: 4 }}
          >
            Next Item
          </Button>
        )}
      </Box>
      {currentLabel && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {currentLabel}
        </Typography>
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
        <Box>
          {isAdmin && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 1.5,
                mb: 1,
                minHeight: 32,
              }}
            >
              {rounds.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  Round {rounds.length + 1}
                </Typography>
              )}
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
        </Box>
        <ResultsTable />
      </Box>
    </Box>
  )
}
