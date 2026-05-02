import { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import { setLabel } from '../actions'

export default function SessionHeader() {
  const dispatch = useDispatch()
  const sessionId = useSelector((state) => state.game.sessionId)
  const playerName = useSelector((state) => state.game.playerName)
  const isAdmin = useSelector((state) => state.game.isAdmin)
  const currentLabel = useSelector((state) => state.game.currentLabel)
  const rounds = useSelector((state) => state.rounds)

  const [labelInput, setLabelInput] = useState(currentLabel)
  const [lastBroadcastLabel, setLastBroadcastLabel] = useState(currentLabel)
  const [prevCurrentLabel, setPrevCurrentLabel] = useState(currentLabel)
  const [justSaved, setJustSaved] = useState(false)
  const debounceTimerRef = useRef(null)
  const savedTimerRef = useRef(null)

  // Resync local input when an external change to currentLabel arrives (e.g., another host updated it).
  // Setting state during render is the supported React pattern for prop-derived state.
  if (currentLabel !== prevCurrentLabel) {
    setPrevCurrentLabel(currentLabel)
    setLabelInput(currentLabel)
    setLastBroadcastLabel(currentLabel)
  }

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  const commitLabel = (nextValue) => {
    const value = nextValue !== undefined ? nextValue : labelInput
    if (value === lastBroadcastLabel) return
    dispatch(setLabel(playerName, sessionId, value))
    setLastBroadcastLabel(value)
    setJustSaved(true)
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    savedTimerRef.current = setTimeout(() => setJustSaved(false), 1500)
  }

  const handleLabelChange = (e) => {
    const next = e.target.value
    setLabelInput(next)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      commitLabel(next)
    }, 1000)
  }

  const handleBlur = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    commitLabel()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
      commitLabel()
    }
  }

  const currentRound = rounds.length + 1

  return (
    <Box sx={{ mb: 2 }}>
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
        Round {currentRound}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 40 }}>
        <Box sx={{ flex: 1 }}>
          {isAdmin ? (
            <TextField
              variant="standard"
              placeholder="Item label (optional)"
              fullWidth
              size="small"
              value={labelInput}
              onChange={handleLabelChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              slotProps={{
                htmlInput: { maxLength: 100 },
                input: {
                  endAdornment: justSaved ? (
                    <InputAdornment position="end">
                      <Typography
                        variant="caption"
                        sx={{ color: 'success.main', whiteSpace: 'nowrap' }}
                      >
                        ✓ Saved
                      </Typography>
                    </InputAdornment>
                  ) : null,
                },
              }}
            />
          ) : (
            currentLabel && (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                {currentLabel}
              </Typography>
            )
          )}
        </Box>
      </Box>
    </Box>
  )
}
