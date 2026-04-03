import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { joinGame, userRegistered } from '../actions';
import NameInput from '../components/NameInput';

export default function JoinGame() {
  const [playerName, setPlayerName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(joinGame(playerName, sessionId, () => {
      dispatch(userRegistered());
      navigate('/game');
    }));
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
      <Card sx={{ maxWidth: 420, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, textAlign: 'center', fontWeight: 600 }}>
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
            />
            <Button type="submit" variant="contained" fullWidth size="large" sx={{ py: 1.2 }}>
              Join Game
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
