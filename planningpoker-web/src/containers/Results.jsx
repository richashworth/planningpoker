import { useSelector, useDispatch } from 'react-redux'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import ResultsTable from './ResultsTable'
import ResultsChart from './ResultsChart'
import SessionHistory from './SessionHistory'
import ConsensusCardRail from '../components/ConsensusCardRail'
import { resetSession, setConsensusOverride } from '../actions'
import { calcConsensus } from '../utils/consensus'

const eyebrowSx = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'text.secondary',
  lineHeight: 1,
}

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
  const consensusCount = displayConsensus
    ? results.filter((r) => r.estimateValue === displayConsensus).length
    : 0

  const handleNextItem = () => {
    dispatch(resetSession(playerName, sessionId, displayConsensus || ''))
  }

  const handleConsensusChange = (v) => {
    // Clicking the auto-consensus card clears the override; clicking another card locks that value in.
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
          </Box>
        </Box>
      )}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 240px' },
          gridTemplateAreas: {
            xs: `"chart" "votes" "history"`,
            md: `"chart votes" "history votes"`,
          },
          columnGap: 3,
          rowGap: { xs: 3, md: 0 },
          alignItems: 'start',
          minHeight: 300,
        }}
      >
        <Box sx={{ gridArea: 'chart', minWidth: 0 }}>
          <Box
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              padding: '14px 16px 8px',
              transition: 'border-color 0.3s ease, background-color 0.3s ease',
            }}
          >
            {displayConsensus && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  mb: 1,
                }}
              >
                <Typography component="span" sx={eyebrowSx}>
                  Distribution
                </Typography>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'baseline',
                    gap: 0.75,
                  }}
                >
                  <Typography component="span" sx={eyebrowSx}>
                    Consensus
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'primary.main',
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1,
                    }}
                  >
                    {displayConsensus}
                  </Typography>
                  <Typography
                    component="span"
                    aria-hidden="true"
                    sx={{ color: 'text.disabled', fontSize: 11, lineHeight: 1 }}
                  >
                    ·
                  </Typography>
                  <Typography
                    component="span"
                    sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1 }}
                  >
                    {consensusCount === 0
                      ? 'no votes'
                      : `${consensusCount} ${consensusCount === 1 ? 'vote' : 'votes'}`}
                  </Typography>
                </Box>
              </Box>
            )}
            <ResultsChart consensus={displayConsensus} />
          </Box>
        </Box>
        <Box sx={{ gridArea: 'votes' }}>
          <ResultsTable />
        </Box>
        <Box sx={{ gridArea: 'history', minWidth: 0 }}>
          <SessionHistory consensusOverride={consensusOverride} includeInflight />
        </Box>
      </Box>
    </Box>
  )
}
