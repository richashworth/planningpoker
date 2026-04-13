import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import CircularProgress from '@mui/material/CircularProgress'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { createGame, gameCreated } from '../actions'
import NameInput from '../components/NameInput'
import SchemeTile from '../components/SchemeTile'
import { SCHEME_VALUES, SCHEME_METADATA, SCHEME_ORDER } from '../config/Constants'

function validateCustomValues(input) {
  const values = input
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
  const unique = [...new Set(values)]
  if (unique.length < 2) return 'At least 2 values required'
  if (unique.length > 20) return 'At most 20 values allowed'
  const tooLong = unique.find((v) => v.length > 10)
  if (tooLong) return `Value "${tooLong}" exceeds 10 characters`
  if (unique.length < values.length) return 'Duplicate values removed'
  return ''
}

const TIMER_PRESETS = [
  { value: 'off', label: 'Off' },
  { value: 30, label: '30s' },
  { value: 60, label: '1m' },
  { value: 120, label: '2m' },
  { value: 300, label: '5m' },
  { value: 'custom', label: 'Custom' },
]

export default function CreateGame() {
  const [playerName, setPlayerName] = useState('')
  const [schemeType, setSchemeType] = useState('fibonacci')
  const [customValues, setCustomValues] = useState('')
  const [includeUnsure, setIncludeUnsure] = useState(false)
  const [customError, setCustomError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [timerPreset, setTimerPreset] = useState('off')
  const [timerCustomSeconds, setTimerCustomSeconds] = useState(60)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const timerEnabled = timerPreset !== 'off'
  const timerDefaultSeconds =
    timerPreset === 'custom' ? timerCustomSeconds : timerEnabled ? timerPreset : 60

  const handleCustomChange = (e) => {
    const val = e.target.value
    setCustomValues(val)
    if (val.trim()) {
      setCustomError(validateCustomValues(val))
    } else {
      setCustomError('')
    }
  }

  const isCustomValid = () => {
    if (schemeType !== 'custom') return true
    const values = customValues
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
    const unique = [...new Set(values)]
    if (unique.length < 2 || unique.length > 20) return false
    if (unique.find((v) => v.length > 10)) return false
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nameRegex = /^[a-zA-Z0-9 _-]{3,20}$/
    if (!nameRegex.test(playerName)) return
    if (!isCustomValid()) return
    setSubmitting(true)
    await dispatch(
      createGame(
        playerName,
        {
          schemeType,
          customValues: schemeType === 'custom' ? customValues : null,
          includeUnsure,
          timerEnabled,
          timerDefaultSeconds,
        },
        () => {
          dispatch(gameCreated())
          navigate('/game')
        },
      ),
    )
    setSubmitting(false)
  }

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 1.5, sm: 3 },
      }}
    >
      <Card sx={{ maxWidth: 560, width: '100%' }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
          <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
            Host a Game
          </Typography>
          <form onSubmit={handleSubmit}>
            <NameInput
              playerName={playerName}
              onPlayerNameInputChange={(e) => setPlayerName(e.target.value)}
            />

            <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 600 }}>
              Estimation Scheme
            </Typography>
            <Box
              role="listbox"
              aria-label="Estimation scheme"
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: { xs: 1, sm: 1.5 },
                mb: 2.5,
                '@media (max-width: 479px)': {
                  '& .scheme-values': { display: 'none' },
                },
              }}
            >
              {SCHEME_ORDER.map((key) => {
                const meta = SCHEME_METADATA[key]
                const isCustom = key === 'custom'
                return (
                  <SchemeTile
                    key={key}
                    scheme={meta}
                    values={
                      SCHEME_VALUES[key]
                        ? [...SCHEME_VALUES[key], ...(includeUnsure ? ['?'] : [])]
                        : undefined
                    }
                    selected={schemeType === key}
                    onClick={() => setSchemeType(key)}
                    isCustom={isCustom}
                    sx={isCustom ? { gridColumn: '1 / -1' } : undefined}
                    customInput={
                      isCustom && schemeType === 'custom' ? (
                        <TextField
                          label="Custom Values"
                          placeholder="S, M, L, XL"
                          value={customValues}
                          onChange={handleCustomChange}
                          error={!!customError && customError !== 'Duplicate values removed'}
                          helperText={customError || 'Enter 2-20 comma-separated values'}
                          fullWidth
                          size="small"
                          sx={{ mt: 1 }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : null
                    }
                  />
                )
              })}
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={includeUnsure}
                  onChange={(e) => setIncludeUnsure(e.target.checked)}
                  size="small"
                />
              }
              label="Include ? (unsure)"
              sx={{ mb: 2.5 }}
            />

            <Box sx={{ mb: 2.5 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 0.75 }}
              >
                Round timer
              </Typography>
              <ToggleButtonGroup
                value={timerPreset}
                exclusive
                size="small"
                onChange={(_, val) => {
                  if (val !== null) setTimerPreset(val)
                }}
                aria-label="Round timer"
                sx={{
                  display: 'flex',
                  '& .MuiToggleButton-root': { flex: 1, textTransform: 'none' },
                }}
              >
                {TIMER_PRESETS.map((p) => (
                  <ToggleButton key={p.value} value={p.value} aria-label={p.label}>
                    {p.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              {timerPreset === 'custom' && (
                <TextField
                  label="Duration (seconds)"
                  type="number"
                  value={timerCustomSeconds}
                  onChange={(e) =>
                    setTimerCustomSeconds(Math.max(5, Math.min(3600, Number(e.target.value))))
                  }
                  inputProps={{ min: 5, max: 3600 }}
                  fullWidth
                  size="small"
                  sx={{ mt: 1.5 }}
                />
              )}
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disableElevation
              disabled={!isCustomValid() || submitting}
            >
              {submitting ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
              Start Game
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}
