import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { joinGame, userRegistered } from '../actions';
import NameInput from '../components/NameInput';

export default function JoinGame() {
  const [playerName, setPlayerName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nameRegex = /^[a-zA-Z0-9 _-]{3,20}$/;
    if (!nameRegex.test(playerName)) return;
    setSubmitting(true);
    await dispatch(joinGame(playerName, sessionId, () => {
      dispatch(userRegistered());
      navigate('/game');
    }));
    setSubmitting(false);
  };

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
              onPlayerNameInputChange={(e) => setPlayerName(e.target.value)}
            />
            <TextField
              label="Session ID"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              required
              fullWidth
              sx={{ mb: 2.5 }}
              helperText="8-character session ID"
              inputProps={{ maxLength: 8 }}
            />
            <Button type="submit" variant="contained" fullWidth size="large" disableElevation disabled={submitting}>
              {submitting ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
              Join Game
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
