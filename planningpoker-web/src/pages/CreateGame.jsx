import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { createGame, gameCreated } from '../actions';
import NameInput from '../components/NameInput';

export default function CreateGame() {
  const [playerName, setPlayerName] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createGame(playerName, () => {
      dispatch(gameCreated());
      navigate('/game');
    }));
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
      <Card sx={{ maxWidth: 420, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, textAlign: 'center', fontWeight: 600 }}>
            Host a Game
          </Typography>
          <form onSubmit={handleSubmit}>
            <NameInput
              playerName={playerName}
              onPlayerNameInputChange={(e) => setPlayerName(e.target.value)}
            />
            <Button type="submit" variant="contained" fullWidth size="large" sx={{ py: 1.2 }}>
              Start Game
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
