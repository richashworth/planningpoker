import { useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import countBy from 'lodash/countBy'
import difference from 'lodash/difference'
import orderBy from 'lodash/orderBy'
import startCase from 'lodash/startCase'
import usePersistedToggle from '../hooks/usePersistedToggle'

export default function ResultsTable() {
  const results = useSelector((state) => state.results)
  const users = useSelector((state) => state.users)
  const spectators = useSelector((state) => state.spectators)
  const [open, toggleOpen] = usePersistedToggle('pp-votes-open', true)

  const spectatorSet = new Set((spectators || []).map((s) => s.toLowerCase()))
  const voters = users.filter((u) => !spectatorSet.has(u.toLowerCase()))
  const notVoted = difference(
    voters,
    results.map((x) => x.userName),
  )

  const voteFreqs = countBy(results, (x) => x.estimateValue)
  const countedResults = results.map((x) => ({ ...x, count: voteFreqs[x.estimateValue] }))
  const sortedResults = orderBy(
    countedResults,
    ['count', 'estimateValue', 'userName'],
    ['asc', 'asc', 'asc'],
  )

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
        transition: 'border-color 0.3s ease, background-color 0.3s ease',
      }}
    >
      <Button
        variant="text"
        onClick={toggleOpen}
        aria-expanded={open}
        startIcon={open ? <ExpandMoreIcon /> : <ChevronRightIcon />}
        sx={{
          width: '100%',
          justifyContent: 'flex-start',
          color: 'text.primary',
          fontSize: '0.8125rem',
          fontWeight: 600,
          textTransform: 'none',
          px: 1.5,
          py: 1,
          '&:hover': { bgcolor: 'action.hover' },
          '& .MuiButton-startIcon': { mr: 0.5 },
        }}
      >
        Votes · {results.length} of {voters.length}
      </Button>
      {open && (
        <Box
          sx={{
            maxHeight: 360,
            overflowY: 'auto',
            px: 2,
            pt: 1,
            pb: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            component="table"
            aria-label="Voting results"
            sx={{ width: '100%', borderCollapse: 'collapse' }}
          >
            <thead>
              <tr>
                <Box
                  component="th"
                  scope="col"
                  sx={{
                    textAlign: 'left',
                    pb: 0.75,
                    fontSize: '0.65rem',
                    color: 'text.disabled',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    position: 'sticky',
                    top: 0,
                    bgcolor: 'background.paper',
                    zIndex: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  Player
                </Box>
                <Box
                  component="th"
                  scope="col"
                  sx={{
                    textAlign: 'right',
                    pb: 0.75,
                    fontSize: '0.65rem',
                    color: 'text.disabled',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    position: 'sticky',
                    top: 0,
                    bgcolor: 'background.paper',
                    zIndex: 1,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  Vote
                </Box>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((x) => (
                <tr key={x.userName}>
                  <Box component="td" sx={{ py: 0.5, fontSize: '0.85rem', color: 'text.primary' }}>
                    {startCase(x.userName)}
                  </Box>
                  <Box
                    component="td"
                    sx={{
                      py: 0.5,
                      fontSize: '0.85rem',
                      color: 'text.primary',
                      textAlign: 'right',
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {x.estimateValue}
                  </Box>
                </tr>
              ))}
              {notVoted.map((x) => (
                <tr key={x}>
                  <Box
                    component="td"
                    sx={{
                      py: 0.5,
                      fontSize: '0.85rem',
                      color: 'text.disabled',
                      fontStyle: 'italic',
                    }}
                  >
                    {startCase(x)}
                  </Box>
                  <Box
                    component="td"
                    sx={{
                      py: 0.5,
                      fontSize: '0.85rem',
                      color: 'text.disabled',
                      textAlign: 'right',
                    }}
                  >
                    —
                  </Box>
                </tr>
              ))}
            </tbody>
          </Box>
        </Box>
      )}
    </Box>
  )
}
