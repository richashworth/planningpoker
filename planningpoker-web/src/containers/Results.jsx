import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import DownloadIcon from '@mui/icons-material/Download'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ResultsTable from './ResultsTable'
import ResultsChart from './ResultsChart'
import ConsensusCardRail from '../components/ConsensusCardRail'
import { resetSession, roundCompleted } from '../actions'
import { calcConsensus } from '../utils/consensus'
import { generateCsv, downloadCsv } from '../utils/csvExport'

const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

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
  const [historyOpen, setHistoryOpen] = useState(false)

  const autoConsensus = calcConsensus(results)
  const displayConsensus = consensusOverride || autoConsensus
  const totalRounds = rounds.length + (results.length > 0 ? 1 : 0)
  const hasAnyHistory = rounds.length > 0 || results.length > 0

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
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          minHeight: 42,
          mb: 2,
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
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
              }}
            >
              {currentLabel}
            </Typography>
          )}
        </Box>
        {isAdmin && (
          <Button
            variant="contained"
            size="large"
            disableElevation
            onClick={handleNextItem}
            sx={{ px: 4, flexShrink: 0 }}
          >
            Next Item
          </Button>
        )}
      </Box>
      {isAdmin && displayConsensus && (
        <Box sx={{ mb: 2.5 }}>
          <ConsensusCardRail
            legalEstimates={legalEstimates}
            results={results}
            autoConsensus={autoConsensus}
            value={displayConsensus}
            onChange={(v) => {
              setConsensusOverride(v === autoConsensus ? null : v)
            }}
          />
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
      {hasAnyHistory && (
        <Box sx={{ mt: 2.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap',
              px: 1.75,
              py: 1.25,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.paper',
            }}
          >
            {rounds.length > 0 ? (
              <Button
                variant="text"
                onClick={() => setHistoryOpen((v) => !v)}
                aria-expanded={historyOpen}
                startIcon={historyOpen ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                sx={{
                  color: 'text.primary',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  p: 0,
                  minWidth: 0,
                  '&:hover': { bgcolor: 'transparent' },
                  '& .MuiButton-startIcon': { mr: 0.75 },
                }}
              >
                {historyOpen ? 'Hide' : 'Show'} session history
                <Box component="span" sx={{ color: 'text.disabled', fontWeight: 500, ml: 0.75 }}>
                  · {rounds.length} completed {rounds.length === 1 ? 'round' : 'rounds'}
                </Box>
              </Button>
            ) : (
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
            )}
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExportCsv}
            >
              Export CSV
            </Button>
          </Box>
          {historyOpen && rounds.length > 0 && (
            <Box
              sx={{
                mt: 1,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.paper',
                overflow: 'hidden',
              }}
            >
              {rounds.map((r, i) => (
                <Box
                  key={i}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto auto',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 1.75,
                    py: 1.25,
                    borderTop: i === 0 ? 'none' : '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    sx={{
                      color: 'text.disabled',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                      minWidth: 24,
                    }}
                  >
                    #{i + 1}
                  </Typography>
                  <Typography
                    sx={{
                      color: 'text.primary',
                      fontSize: '0.8125rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r.label || <em>No label</em>}
                  </Typography>
                  <Typography sx={{ color: 'text.disabled', fontSize: '0.6875rem' }}>
                    {fmtTime(r.timestamp)}
                  </Typography>
                  <Box
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: 0.75,
                      bgcolor: 'action.hover',
                      color: 'text.primary',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                      textAlign: 'center',
                      minWidth: 28,
                    }}
                  >
                    {r.consensus}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}
