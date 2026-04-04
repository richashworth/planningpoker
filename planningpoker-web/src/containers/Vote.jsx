import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { vote } from '../actions';
import UsersTable from './UsersTable';
import { COFFEE_SYMBOL, LEGAL_ESTIMATES } from '../config/Constants';

const voteCardSx = {
  aspectRatio: '3 / 4',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.25rem',
  fontWeight: 700,
  color: 'text.primary',
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  cursor: 'pointer',
  userSelect: 'none',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    borderColor: 'primary.main',
    transform: 'translateY(-3px)',
    boxShadow: (t) => t.palette.mode === 'dark'
      ? '0 8px 24px rgba(59,130,246,0.12)'
      : '0 8px 24px rgba(37,99,235,0.1)',
  },
  '&:active': {
    transform: 'translateY(0) scale(0.98)',
    transition: 'all 0.1s ease',
  },
};

export default function Vote() {
  const dispatch = useDispatch();
  const sessionId = useSelector(state => state.game.sessionId);
  const playerName = useSelector(state => state.game.playerName);

  const doVote = (val) => dispatch(vote(playerName, sessionId, val));

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontSize: '1.1rem' }}>
        Cast your estimate
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 240px' }, gap: 3, alignItems: 'start' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
            gap: 0.75,
          }}
        >
          {LEGAL_ESTIMATES.map(val => (
            <Box key={val} sx={voteCardSx} onClick={() => doVote(val)}>
              {val}
            </Box>
          ))}
          <Box sx={{ ...voteCardSx, fontSize: '1.5rem' }} onClick={() => doVote(COFFEE_SYMBOL)}>
            {COFFEE_SYMBOL}
          </Box>
        </Box>
        <UsersTable heading="Players" />
      </Box>
    </Box>
  );
}
