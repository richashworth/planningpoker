import { useSelector, useDispatch } from 'react-redux'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ResultsTable from './ResultsTable'
import ResultsChart from './ResultsChart'
import SessionHistory from './SessionHistory'
import ConsensusCardRail from '../components/ConsensusCardRail'
import { resetSession } from '../actions'
import { calcConsensus } from '../utils/consensus'

export default function Results({ consensusOverride, setConsensusOverride }) {
  const dispatch = useDispatch()
  const isAdmin = useSelector((state) => state.game.isAdmin)
  const sessionId = useSelector((state) => state.game.sessionId)
  const playerName = useSelector((state) => state.game.playerName)
  const results = useSelector((state) => state.results)
  const legalEstimates = useSelector((state) => state.game.legalEstimates)

  const autoConsensus = calcConsensus(results)
  const displayConsensus = consensusOverride || autoConsensus

  const handleNextItem = () => {
    const consensus = consensusOverride || calcConsensus(results) || ''
    setConsensusOverride(null)
    dispatch(resetSession(playerName, sessionId, consensus))
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
              p: 2.5,
              transition: 'border-color 0.3s ease, background-color 0.3s ease',
            }}
          >
            <ResultsChart />
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
