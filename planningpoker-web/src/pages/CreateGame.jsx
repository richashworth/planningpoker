import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { createGame, gameCreated } from '../actions';
import NameInput from '../components/NameInput';
import { SCHEME_VALUES } from '../config/Constants';

function getPreviewValues(schemeType, customValues, includeUnsure, includeCoffee) {
  let values = schemeType === 'custom'
    ? customValues.split(',').map(v => v.trim()).filter(v => v.length > 0)
    : SCHEME_VALUES[schemeType] || []
  values = [...new Set(values)]
  if (includeUnsure) values.push('?')
  if (includeCoffee) values.push('\u2615')
  return values
}

function validateCustomValues(input) {
  const values = input.split(',').map(v => v.trim()).filter(v => v.length > 0)
  const unique = [...new Set(values)]
  if (unique.length < 2) return 'At least 2 values required'
  if (unique.length > 20) return 'At most 20 values allowed'
  const tooLong = unique.find(v => v.length > 10)
  if (tooLong) return `Value "${tooLong}" exceeds 10 characters`
  if (unique.length < values.length) return 'Duplicate values removed'
  return ''
}

export default function CreateGame() {
  const [playerName, setPlayerName] = useState('');
  const [schemeType, setSchemeType] = useState('story_points');
  const [customValues, setCustomValues] = useState('');
  const [includeUnsure, setIncludeUnsure] = useState(true);
  const [includeCoffee, setIncludeCoffee] = useState(true);
  const [customError, setCustomError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
    const values = customValues.split(',').map(v => v.trim()).filter(v => v.length > 0)
    const unique = [...new Set(values)]
    if (unique.length < 2 || unique.length > 20) return false
    if (unique.find(v => v.length > 10)) return false
    return true
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const nameRegex = /^[a-zA-Z0-9 _-]{3,20}$/;
    if (!nameRegex.test(playerName)) return;
    if (!isCustomValid()) return;
    dispatch(createGame(playerName, {
      schemeType,
      customValues: schemeType === 'custom' ? customValues : null,
      includeUnsure,
      includeCoffee
    }, () => {
      dispatch(gameCreated());
      navigate('/game');
    }));
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
      <Card sx={{ maxWidth: 480, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
            Host a Game
          </Typography>
          <form onSubmit={handleSubmit}>
            <NameInput
              playerName={playerName}
              onPlayerNameInputChange={(e) => setPlayerName(e.target.value)}
            />

            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              Estimation Scheme
            </Typography>
            <ToggleButtonGroup
              value={schemeType}
              exclusive
              onChange={(e, val) => { if (val !== null) setSchemeType(val) }}
              fullWidth
              size="small"
              sx={{ mb: 2 }}
            >
              <ToggleButton value="story_points">Story Points</ToggleButton>
              <ToggleButton value="tshirt">T-shirt</ToggleButton>
              <ToggleButton value="simple">Simple</ToggleButton>
              <ToggleButton value="time">Time</ToggleButton>
              <ToggleButton value="custom">Custom</ToggleButton>
            </ToggleButtonGroup>

            {schemeType === 'custom' && (
              <TextField
                label="Custom Values"
                placeholder="S, M, L, XL"
                value={customValues}
                onChange={handleCustomChange}
                error={!!customError && customError !== 'Duplicate values removed'}
                helperText={customError || 'Enter 2-20 comma-separated values'}
                fullWidth
                sx={{ mb: 2 }}
              />
            )}

            <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
              <FormControlLabel
                control={<Switch checked={includeUnsure} onChange={(e) => setIncludeUnsure(e.target.checked)} size="small" />}
                label="Include ? (unsure)"
                sx={{ flex: 1 }}
              />
              <FormControlLabel
                control={<Switch checked={includeCoffee} onChange={(e) => setIncludeCoffee(e.target.checked)} size="small" />}
                label={`Include \u2615 (break)`}
                sx={{ flex: 1 }}
              />
            </Box>

            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              Card Preview
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.5,
                mb: 2.5,
                p: 1.5,
                bgcolor: 'action.hover',
                borderRadius: 1,
                minHeight: 48,
              }}
            >
              {getPreviewValues(schemeType, customValues, includeUnsure, includeCoffee).map(val => (
                <Box
                  key={val}
                  sx={{
                    width: 40,
                    height: 54,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: val === '\u2615' ? '1rem' : '0.7rem',
                    fontWeight: 700,
                    color: 'text.primary',
                    bgcolor: 'background.paper',
                    border: '1.5px solid',
                    borderColor: 'divider',
                    borderRadius: 0.5,
                    userSelect: 'none',
                  }}
                >
                  {val}
                </Box>
              ))}
            </Box>

            <Button type="submit" variant="contained" fullWidth size="large" disableElevation disabled={!isCustomValid()}>
              Start Game
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
