import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import usePersistedToggle from '../hooks/usePersistedToggle'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PersonRemoveRounded from '@mui/icons-material/PersonRemoveRounded'
import startCase from 'lodash/startCase'
import { kickUser } from '../actions'

export default function SpectatorsTable() {
  const dispatch = useDispatch()
  const spectators = useSelector((state) => state.spectators)
  const currentUser = useSelector((state) => state.game.playerName)
  const host = useSelector((state) => state.game.host)
  const sessionId = useSelector((state) => state.game.sessionId)
  const isHost = currentUser?.toLowerCase() === host?.toLowerCase()
  const [open, toggleOpen] = usePersistedToggle('pp-spectators-open', false)
  const [kickTarget, setKickTarget] = useState(null)

  if (!spectators || spectators.length === 0) return null

  const sorted = [...spectators].sort()

  return (
    <Box sx={{ mt: 1.5 }}>
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
          Spectators · {sorted.length}
        </Button>
        {open && (
          <Box sx={{ px: 2, pt: 1, pb: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
            {sorted.map((name) => (
              <Box
                key={name}
                sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, minHeight: 32 }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: 'text.disabled',
                    flexShrink: 0,
                  }}
                />
                <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.85rem' }}>
                  {startCase(name)}
                </Typography>
                {isHost && name.toLowerCase() !== currentUser?.toLowerCase() && (
                  <Tooltip title="Remove from session" placement="top" arrow>
                    <IconButton
                      size="small"
                      onClick={() => setKickTarget(name)}
                      sx={{
                        ml: 'auto',
                        p: 0.25,
                        color: 'text.secondary',
                        '&:hover': { color: 'error.main' },
                      }}
                    >
                      <PersonRemoveRounded sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>
      <Dialog open={!!kickTarget} onClose={() => setKickTarget(null)}>
        <DialogTitle>Remove spectator</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove {startCase(kickTarget)} from the session?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setKickTarget(null)}>Cancel</Button>
          <Button
            onClick={() => {
              dispatch(kickUser(currentUser, kickTarget, sessionId))
              setKickTarget(null)
            }}
            color="error"
            variant="contained"
            disableElevation
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
