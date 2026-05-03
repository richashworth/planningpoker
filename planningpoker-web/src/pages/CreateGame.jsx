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
import { createGame, gameCreated } from '../actions'
import NameInput from '../components/NameInput'
import SchemeTile from '../components/SchemeTile'
import { SCHEME_VALUES, SCHEME_METADATA, SCHEME_ORDER, USERNAME_REGEX } from '../config/Constants'

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

export default function CreateGame() {
  const [playerName, setPlayerName] = useState('')
  const [schemeType, setSchemeType] = useState('fibonacci')
  const [customValues, setCustomValues] = useState('')
  const [includeUnsure, setIncludeUnsure] = useState(false)
  const [customError, setCustomError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()

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
    if (submitting) return
    if (!USERNAME_REGEX.test(playerName)) return
    if (!isCustomValid()) return
    setSubmitting(true)
    try {
      await dispatch(
        createGame(
          playerName,
          {
            schemeType,
            customValues: schemeType === 'custom' ? customValues : null,
            includeUnsure,
          },
          () => {
            dispatch(gameCreated())
            navigate('/game')
          },
        ),
      )
    } finally {
      setSubmitting(false)
    }
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
