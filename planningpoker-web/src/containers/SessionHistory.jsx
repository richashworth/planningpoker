import { useState } from 'react'
import { useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import DownloadIcon from '@mui/icons-material/Download'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { calcConsensus } from '../utils/consensus'
import { generateCsv, downloadCsv } from '../utils/csvExport'
import { generateMarkdownTable, copyToClipboard } from '../utils/markdownExport'

const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

// includeInflight=true treats the live round as part of history (results screen, post-reveal).
// On the voting screen, leave it false so the current round never feeds the count or the CSV
// export — otherwise Export CSV would leak votes before reveal.
export default function SessionHistory({ consensusOverride = null, includeInflight = false }) {
  const sessionId = useSelector((state) => state.game.sessionId)
  const currentLabel = useSelector((state) => state.game.currentLabel)
  const legalEstimates = useSelector((state) => state.game.legalEstimates)
  const rounds = useSelector((state) => state.rounds)
  const users = useSelector((state) => state.users)
  const spectators = useSelector((state) => state.spectators)
  const results = useSelector((state) => state.results)
  const voted = useSelector((state) => state.voted)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [toast, setToast] = useState(null)

  const hasInflightRound = includeInflight && voted && results.length > 0
  const hasAnyHistory = rounds.length > 0 || hasInflightRound
  const totalRounds = rounds.length + (hasInflightRound ? 1 : 0)

  if (!hasAnyHistory) return null

  const buildAllRounds = () => {
    const allRounds = [...rounds]
    if (hasInflightRound) {
      allRounds.push({
        label: currentLabel,
        consensus: consensusOverride || calcConsensus(results, legalEstimates),
        votes: [...results],
        timestamp: new Date().toISOString(),
      })
    }
    return allRounds
  }

  const handleExportCsv = () => {
    const allRounds = buildAllRounds()
    // Include all current session users (excluding spectators, who never vote) plus any
    // historical voters (who may have since left)
    const spectatorSet = new Set((spectators || []).map((s) => s.toLowerCase()))
    const voters = users.filter((u) => !spectatorSet.has(u.toLowerCase()))
    const historicalVoters = allRounds.flatMap((r) => r.votes.map((v) => v.userName))
    const allPlayers = [...new Set([...voters, ...historicalVoters])].sort()
    const csv = generateCsv(allRounds, allPlayers)
    downloadCsv(csv, `planning-poker-${sessionId}.csv`)
  }

  const handleCopyMarkdown = async () => {
    const markdown = generateMarkdownTable(buildAllRounds())
    try {
      await copyToClipboard(markdown)
      setToast({ severity: 'success', message: 'Copied markdown to clipboard' })
    } catch {
      setToast({ severity: 'error', message: 'Could not copy to clipboard' })
    }
  }

  return (
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
            · {totalRounds} {totalRounds === 1 ? 'round' : 'rounds'}
          </Box>
        </Button>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ContentCopyIcon />}
            onClick={handleCopyMarkdown}
          >
            Copy as Markdown
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleExportCsv}
          >
            Export CSV
          </Button>
        </Box>
      </Box>
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={2500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast?.severity ?? 'success'}
          variant="filled"
          onClose={() => setToast(null)}
          sx={{ width: '100%' }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
      {historyOpen && hasAnyHistory && (
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
          {buildAllRounds().map((r, i, all) => {
            const isInflight = hasInflightRound && i === all.length - 1
            return (
              <Box
                key={i}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto minmax(40px, max-content)',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 1.75,
                  py: 1.25,
                  borderTop: i === 0 ? 'none' : '1px solid',
                  borderColor: 'divider',
                  bgcolor: isInflight ? 'action.hover' : 'transparent',
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
                <Typography
                  sx={{
                    color: isInflight ? 'primary.main' : 'text.disabled',
                    fontSize: '0.6875rem',
                    fontWeight: isInflight ? 700 : 400,
                    letterSpacing: isInflight ? '0.06em' : 'normal',
                    textTransform: isInflight ? 'uppercase' : 'none',
                  }}
                >
                  {isInflight ? 'Current' : fmtTime(r.timestamp)}
                </Typography>
                <Box
                  data-testid="round-consensus"
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
            )
          })}
        </Box>
      )}
    </Box>
  )
}
