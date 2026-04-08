import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
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
import StarRounded from '@mui/icons-material/StarRounded'
import PersonRemoveRounded from '@mui/icons-material/PersonRemoveRounded'
import SwapHorizRounded from '@mui/icons-material/SwapHorizRounded'
import startCase from 'lodash/startCase'
import union from 'lodash/union'
import { kickUser, promoteUser } from '../actions'

export default function UsersTable({ heading }) {
  const dispatch = useDispatch()
  const users = useSelector((state) => state.users)
  const currentUser = useSelector((state) => state.game.playerName)
  const host = useSelector((state) => state.game.host)
  const sessionId = useSelector((state) => state.game.sessionId)
  const isHost = currentUser?.toLowerCase() === host?.toLowerCase()
  const [kickTarget, setKickTarget] = useState(null)

  // Keep original usernames for comparisons and API calls; apply startCase only for display
  const allUsers = union([currentUser], users).sort()

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        p: 2,
        transition: 'border-color 0.3s ease, background-color 0.3s ease',
      }}
    >
      <Typography
        variant="overline"
        sx={{
          color: 'text.secondary',
          mb: 1.5,
          display: 'block',
          fontSize: '0.65rem',
          letterSpacing: '0.08em',
        }}
      >
        {heading}
      </Typography>
      {allUsers.map((name) => (
        <Box key={name} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
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
                  sx={{ p: 0.25, color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                >
                  <PersonRemoveRounded sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      ))}
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
