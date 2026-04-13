import { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import PauseIcon from '@mui/icons-material/Pause'
import ReplayIcon from '@mui/icons-material/Replay'
import TimerIcon from '@mui/icons-material/Timer'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import {
  vote,
  voteOptimistic,
  setLabel,
  startTimer,
  pauseTimer,
  resumeTimer,
  resetTimer,
  configureTimer,
} from '../actions'
import { useTimer } from '../hooks/useTimer'
import UsersTable from './UsersTable'

const TIMER_PRESETS = [
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 120, label: '2 minutes' },
  { value: 300, label: '5 minutes' },
]

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

function formatMMSS(seconds) {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
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
  const [menuAnchor, setMenuAnchor] = useState(null)
  const debounceTimerRef = useRef(null)
  const savedTimerRef = useRef(null)

  const { timer, remainingSeconds, running, paused, expired } = useTimer()

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

  const handleSetClick = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    commitLabel()
  }

  const doVote = (val) => {
    if (selected) return
    setSelected(val)
    dispatch(voteOptimistic(playerName, val))
    dispatch(vote(playerName, sessionId, val))
  }

  // Determine chip visual state
  const idle = timer.enabled && !timer.startedAt
  const warn = running && remainingSeconds <= 10 && remainingSeconds > 3
  const danger = running && remainingSeconds <= 3

  let chipColor = 'default'
  if (running && !warn && !danger) chipColor = 'success'
  if (warn) chipColor = 'warning'
  if (danger || expired) chipColor = 'error'

  let chipLabel
  if (expired) {
    chipLabel = "Time's up"
  } else if (paused) {
    chipLabel = `${formatMMSS(remainingSeconds)} paused`
  } else if (idle) {
    chipLabel = `Timer ${formatMMSS(timer.durationSeconds)}`
  } else {
    chipLabel = formatMMSS(remainingSeconds)
  }

  const handleMenuOpen = (e) => setMenuAnchor(e.currentTarget)
  const handleMenuClose = () => setMenuAnchor(null)
  const handlePresetSelect = (seconds) => {
    dispatch(configureTimer(playerName, sessionId, true, seconds))
    dispatch(resetTimer(playerName, sessionId))
    handleMenuClose()
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
                    endAdornment: (
                      <InputAdornment position="end">
                        {justSaved && (
                          <Typography
                            variant="caption"
                            sx={{ color: 'success.main', mr: 1, whiteSpace: 'nowrap' }}
                          >
                            ✓ Saved
                          </Typography>
                        )}
                        <Button
                          variant="text"
                          size="small"
                          onClick={handleSetClick}
                          disabled={labelInput === lastBroadcastLabel}
                          aria-label="Set round label"
                        >
                          Set
                        </Button>
                      </InputAdornment>
                    ),
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

            {timer.enabled && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                <Chip
                  icon={<TimerIcon />}
                  label={chipLabel}
                  color={chipColor}
                  size="small"
                  sx={
                    danger
                      ? {
                          '@keyframes pp-timer-pulse': {
                            '0%, 100%': { opacity: 1 },
                            '50%': { opacity: 0.55 },
                          },
                          animation: 'pp-timer-pulse 1s ease-in-out infinite',
                        }
                      : undefined
                  }
                />
                {isAdmin && (
                  <>
                    {idle && (
                      <Tooltip title="Start timer">
                        <IconButton
                          size="small"
                          aria-label="Start timer"
                          onClick={() => dispatch(startTimer(playerName, sessionId))}
                        >
                          <PlayArrowIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {running && (
                      <>
                        <Tooltip title="Pause timer">
                          <IconButton
                            size="small"
                            aria-label="Pause timer"
                            onClick={() => dispatch(pauseTimer(playerName, sessionId))}
                          >
                            <PauseIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reset timer">
                          <IconButton
                            size="small"
                            aria-label="Reset timer"
                            onClick={() => dispatch(resetTimer(playerName, sessionId))}
                          >
                            <ReplayIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    {paused && (
                      <>
                        <Tooltip title="Resume timer">
                          <IconButton
                            size="small"
                            aria-label="Resume timer"
                            onClick={() => dispatch(resumeTimer(playerName, sessionId))}
                          >
                            <PlayArrowIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reset timer">
                          <IconButton
                            size="small"
                            aria-label="Reset timer"
                            onClick={() => dispatch(resetTimer(playerName, sessionId))}
                          >
                            <ReplayIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    {expired && (
                      <Tooltip title="Reset timer">
                        <IconButton
                          size="small"
                          aria-label="Reset timer"
                          onClick={() => dispatch(resetTimer(playerName, sessionId))}
                        >
                          <ReplayIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Timer options">
                      <IconButton size="small" aria-label="Timer options" onClick={handleMenuOpen}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Menu
                      anchorEl={menuAnchor}
                      open={Boolean(menuAnchor)}
                      onClose={handleMenuClose}
                    >
                      {TIMER_PRESETS.map((p) => (
                        <MenuItem key={p.value} onClick={() => handlePresetSelect(p.value)}>
                          {p.label}
                        </MenuItem>
                      ))}
                    </Menu>
                  </>
                )}
              </Box>
            )}
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
