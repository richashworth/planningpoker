import { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import { vote, voteOptimistic, setLabel } from '../actions'
import UsersTable from './UsersTable'

function cardSx(isSelected, isDisabled) {
  return {
    aspectRatio: '3 / 4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    fontWeight: 700,
    color: isDisabled ? 'text.disabled' : 'text.primary',
    bgcolor: isSelected ? 'primary.main' : 'background.paper',
    border: '2px solid',
    borderColor: isSelected ? 'primary.main' : 'divider',
    borderRadius: 0.5,
    cursor: isDisabled ? 'default' : 'pointer',
    userSelect: 'none',
    opacity: isDisabled && !isSelected ? 0.4 : 1,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    ...(isSelected && {
      color: 'primary.contrastText',
      transform: 'scale(1.04)',
      boxShadow: (t) => `0 4px 16px ${t.palette.primary.main}40`,
    }),
    ...(!isDisabled &&
      !isSelected && {
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-3px)',
          boxShadow: (t) =>
            t.palette.mode === 'dark'
              ? '0 8px 24px rgba(102,126,234,0.15)'
              : '0 8px 24px rgba(102,126,234,0.12)',
        },
        '&:active': {
          transform: 'translateY(0) scale(0.98)',
          transition: 'all 0.1s ease',
        },
      }),
  }
}

export default function Vote() {
  const dispatch = useDispatch()
  const sessionId = useSelector((state) => state.game.sessionId)
  const playerName = useSelector((state) => state.game.playerName)
  const isAdmin = useSelector((state) => state.game.isAdmin)
  const currentLabel = useSelector((state) => state.game.currentLabel)
  const legalEstimates = useSelector((state) => state.game.legalEstimates)
  const [selected, setSelected] = useState(null)
  const [labelInput, setLabelInput] = useState(currentLabel)
  const [lastBroadcastLabel, setLastBroadcastLabel] = useState(currentLabel)
  const [justSaved, setJustSaved] = useState(false)
  const debounceTimerRef = useRef(null)
  const savedTimerRef = useRef(null)

  useEffect(() => {
    setLabelInput(currentLabel)
    setLastBroadcastLabel(currentLabel)
  }, [currentLabel])

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

  const doVote = (val) => {
    if (selected) return
    setSelected(val)
    dispatch(voteOptimistic(playerName, val))
    dispatch(vote(playerName, sessionId, val))
  }

  const allValues = legalEstimates

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 42, mb: 1 }}>
        <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
          Cast your estimate
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 240px' },
          gap: 3,
          alignItems: 'start',
          minHeight: 300,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, minHeight: 40 }}>
            <Box sx={{ flex: 1 }}>
              {isAdmin ? (
                <TextField
                  variant="standard"
                  placeholder="Round label (optional)"
                  fullWidth
                  size="small"
                  value={labelInput}
                  onChange={handleLabelChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  inputProps={{ maxLength: 100 }}
                  InputProps={{
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
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              gap: 0.75,
            }}
          >
            {allValues.map((val) => (
              <Box
                key={val}
                role="button"
                tabIndex={0}
                aria-label={`Vote ${val}`}
                sx={{
                  ...cardSx(selected === val, selected !== null && selected !== val),
                  ...(val === '\u2615' && { fontSize: '1.5rem' }),
                }}
                onClick={() => doVote(val)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    doVote(val)
                  }
                }}
              >
                {val}
              </Box>
            ))}
          </Box>
        </Box>
        <UsersTable heading="Players" />
      </Box>
    </Box>
  )
}
