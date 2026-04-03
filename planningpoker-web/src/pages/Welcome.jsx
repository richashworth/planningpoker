import React from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

export default function Welcome() {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box sx={{ textAlign: 'center', maxWidth: 400, width: '100%', px: 2 }}>
        <Typography variant="h3" sx={{ mb: 1 }}>
          Planning Poker
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 5 }}>
          Agile estimation for distributed teams
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            component={Link}
            to="/join"
            variant="contained"
            size="large"
            fullWidth
            sx={{ py: 1.5 }}
          >
            Join Game
          </Button>
          <Button
            component={Link}
            to="/host"
            variant="outlined"
            size="large"
            fullWidth
            sx={{ py: 1.5 }}
          >
            Host New Game
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
