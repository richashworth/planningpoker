import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import { joinGame, userRegistered } from '../actions'
import NameInput from '../components/NameInput'
import { USERNAME_REGEX } from '../config/Constants'

export default function JoinGame() {
  const [playerName, setPlayerName] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [isSpectator, setIsSpectator] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const isNameValid = USERNAME_REGEX.test(playerName)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    if (!isNameValid) return
    setSubmitting(true)
    setFormError('')
    try {
      const result = await dispatch(
        joinGame(playerName, sessionId, isSpectator, () => {
          dispatch(userRegistered())
          navigate('/game')
        }),
      )
      if (result?.errorMessage) setFormError(result.errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
            Join a Game
          </Typography>
          <form onSubmit={handleSubmit}>
            <NameInput
              playerName={playerName}
              onPlayerNameInputChange={(e) => {
                setPlayerName(e.target.value)
                if (formError) setFormError('')
              }}
            />
            <TextField
              label="Session ID"
              value={sessionId}
              onChange={(e) => {
                setSessionId(e.target.value)
                if (formError) setFormError('')
              }}
              required
              fullWidth
              sx={{ mb: 1 }}
              helperText="12-character session ID"
              slotProps={{ htmlInput: { maxLength: 12 } }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={isSpectator}
                  onChange={(e) => setIsSpectator(e.target.checked)}
                  size="small"
                />
              }
              label="Join as spectator (don't vote)"
              sx={{ mb: 2.5 }}
            />
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError('')}>
                {formError}
              </Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disableElevation
              disabled={!isNameValid || submitting}
            >
              {submitting ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
              Join Game
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}
