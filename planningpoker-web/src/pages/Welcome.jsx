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
      <Box sx={{ textAlign: 'center', maxWidth: 380, width: '100%', px: 2 }}>
        <Typography
          variant="h3"
          sx={{ mb: 1, fontSize: { xs: '2rem', sm: '2.5rem' } }}
        >
          Planning Poker
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 6 }}>
          Agile estimation for distributed teams
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            component={Link}
            to="/join"
            variant="contained"
            size="large"
            fullWidth
            disableElevation
          >
            Join Game
          </Button>
          <Button
            component={Link}
            to="/host"
            variant="outlined"
            size="large"
            fullWidth
          >
            Host New Game
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
