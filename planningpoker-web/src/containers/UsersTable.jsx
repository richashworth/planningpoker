import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import usePersistedToggle from '../hooks/usePersistedToggle'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import StarRounded from '@mui/icons-material/StarRounded'
import PersonRemoveRounded from '@mui/icons-material/PersonRemoveRounded'
import SwapHorizRounded from '@mui/icons-material/SwapHorizRounded'
import startCase from 'lodash/startCase'
import union from 'lodash/union'
import { kickUser, promoteUser } from '../actions'

export default function UsersTable({ heading }) {
  const dispatch = useDispatch()
  const users = useSelector((state) => state.users)
  const spectators = useSelector((state) => state.spectators)
  const currentUser = useSelector((state) => state.game.playerName)
  const isSelfSpectator = useSelector((state) => state.game.isSpectator)
  const host = useSelector((state) => state.game.host)
  const sessionId = useSelector((state) => state.game.sessionId)
  const isHost = currentUser?.toLowerCase() === host?.toLowerCase()
  const [open, toggleOpen] = usePersistedToggle('pp-players-open', true)
  const [kickTarget, setKickTarget] = useState(null)

  // Keep original usernames for comparisons and API calls; apply startCase only for display.
  // Hide the current user from the list when they're a spectator — their seat lives in
  // SpectatorsTable instead.
  const seed = isSelfSpectator ? [] : [currentUser]
  const spectatorSet = new Set((spectators || []).map((s) => s.toLowerCase()))
  const allUsers = union(seed, users)
    .filter((u) => !spectatorSet.has(u.toLowerCase()))
    .sort()

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
        {heading} · {allUsers.length}
      </Button>
      {open && (
        <Box sx={{ px: 2, pt: 1, pb: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          {allUsers.map((name) => (
            <Box
              key={name}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, minHeight: 32 }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  flexShrink: 0,
                }}
              />
              <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.85rem' }}>
                {startCase(name)}
              </Typography>
              {name.toLowerCase() === host?.toLowerCase() && (
                <Tooltip title="Host" placement="right" arrow>
                  <StarRounded sx={{ fontSize: 16, color: 'warning.main', ml: 'auto' }} />
                </Tooltip>
              )}
              {isHost && name.toLowerCase() !== host?.toLowerCase() && (
                <>
                  <Tooltip title="Transfer host" placement="top" arrow>
                    <IconButton
                      size="small"
                      onClick={() => dispatch(promoteUser(currentUser, name, sessionId))}
                      sx={{
                        ml: 'auto',
                        p: 0.25,
                        color: 'text.secondary',
                        '&:hover': { color: 'primary.main' },
                      }}
                    >
                      <SwapHorizRounded sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove from session" placement="top" arrow>
                    <IconButton
                      size="small"
                      onClick={() => setKickTarget(name)}
                      sx={{
                        p: 0.25,
                        color: 'text.secondary',
                        '&:hover': { color: 'error.main' },
                      }}
                    >
                      <PersonRemoveRounded sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          ))}
        </Box>
      )}
      <Dialog open={!!kickTarget} onClose={() => setKickTarget(null)}>
        <DialogTitle>Remove participant</DialogTitle>
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
