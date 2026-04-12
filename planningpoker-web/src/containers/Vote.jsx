import { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import EditIcon from '@mui/icons-material/Edit'
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
  const [isEditing, setIsEditing] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const debounceTimer = useRef(null)
  const savedTimer = useRef(null)

  useEffect(() => {
    setLabelInput(currentLabel)
    setLastBroadcastLabel(currentLabel)
  }, [currentLabel])

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      if (savedTimer.current) clearTimeout(savedTimer.current)
    }
  }, [])

  const commitLabel = (nextValue) => {
    const value = nextValue !== undefined ? nextValue : labelInput
    if (value === lastBroadcastLabel) return
    dispatch(setLabel(playerName, sessionId, value))
    setLastBroadcastLabel(value)
    setJustSaved(true)
    if (savedTimer.current) clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setJustSaved(false), 1500)
  }

  const handleLabelChange = (e) => {
    const next = e.target.value
    setLabelInput(next)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      commitLabel(next)
    }, 1000)
  }

  const handleBlur = () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
      debounceTimer.current = null
    }
    commitLabel()
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
        debounceTimer.current = null
      }
      commitLabel()
      setIsEditing(false)
    } else if (e.key === 'Escape') {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
        debounceTimer.current = null
      }
      setLabelInput(lastBroadcastLabel)
      setIsEditing(false)
    }
  }

  const enterEdit = () => {
    setIsEditing(true)
  }

  const handleBannerKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      enterEdit()
    }
  }

  const doVote = (val) => {
    if (selected) return
    setSelected(val)
    dispatch(voteOptimistic(playerName, val))
    dispatch(vote(playerName, sessionId, val))
  }

  const allValues = legalEstimates

  const bannerBaseSx = {
    mb: 3,
    px: 1.75,
    py: 1.5,
    bgcolor: 'rgba(102,126,234,0.08)',
    border: '1px solid rgba(102,126,234,0.35)',
    borderRadius: 0.75,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 1,
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 42, mb: 1 }}>
        <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
          Cast your estimate
        </Typography>
      </Box>
      {isAdmin ? (
        isEditing ? (
          <Box sx={{ ...bannerBaseSx, py: 1 }}>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography
                variant="caption"
                sx={{
                  letterSpacing: '0.08em',
                  color: 'text.secondary',
                  display: 'block',
                  fontSize: '0.7rem',
                }}
              >
                CURRENT ITEM
              </Typography>
              <TextField
                variant="standard"
                fullWidth
                size="small"
                autoFocus
                placeholder="Round label (optional)"
                value={labelInput}
                onChange={handleLabelChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                inputProps={{ maxLength: 100 }}
              />
            </Box>
            {justSaved && (
              <Typography
                variant="caption"
                sx={{ color: 'success.main', ml: 1, whiteSpace: 'nowrap' }}
              >
                ✓ Saved
              </Typography>
            )}
          </Box>
        ) : (
          <Box
            role="button"
            tabIndex={0}
            aria-label="Edit current item"
            onClick={enterEdit}
            onKeyDown={handleBannerKeyDown}
            sx={{
              ...bannerBaseSx,
              cursor: 'pointer',
              '&:hover': { borderColor: 'primary.main' },
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  letterSpacing: '0.08em',
                  color: 'text.secondary',
                  display: 'block',
                  fontSize: '0.7rem',
                }}
              >
                CURRENT ITEM
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  color: currentLabel ? 'text.primary' : 'text.secondary',
                  fontStyle: currentLabel ? 'normal' : 'italic',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentLabel || 'Add item description...'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {justSaved && (
                <Typography variant="caption" sx={{ color: 'success.main', whiteSpace: 'nowrap' }}>
                  ✓ Saved
                </Typography>
              )}
              <IconButton
                size="small"
                aria-label="Edit current item"
                onClick={(e) => {
                  e.stopPropagation()
                  enterEdit()
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        )
      ) : (
        currentLabel && (
          <Box sx={bannerBaseSx}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  letterSpacing: '0.08em',
                  color: 'text.secondary',
                  display: 'block',
                  fontSize: '0.7rem',
                }}
              >
                CURRENT ITEM
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentLabel}
              </Typography>
            </Box>
          </Box>
        )
      )}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 240px' },
          gap: 3,
          alignItems: 'start',
          minHeight: 300,
        }}
      >
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
        <UsersTable heading="Players" />
      </Box>
    </Box>
  )
}
