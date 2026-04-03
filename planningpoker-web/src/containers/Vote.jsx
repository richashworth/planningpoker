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
  fontSize: '1.3rem',
  fontWeight: 700,
  color: 'text.primary',
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
  cursor: 'pointer',
  userSelect: 'none',
  transition: 'all 0.15s ease-out',
  '&:hover': {
    borderColor: 'primary.main',
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(59,130,246,0.15)',
  },
  '&:active': {
    transform: 'translateY(-1px)',
  },
};

export default function Vote() {
  const dispatch = useDispatch();
  const sessionId = useSelector(state => state.game.sessionId);
  const playerName = useSelector(state => state.game.playerName);

  const doVote = (val) => dispatch(vote(playerName, sessionId, val));

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2.5 }}>
        Cast your estimate
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 260px' }, gap: 3, alignItems: 'start' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
            gap: 1,
          }}
        >
          {LEGAL_ESTIMATES.map(val => (
            <Box key={val} sx={voteCardSx} onClick={() => doVote(val)}>
              {val}
            </Box>
          ))}
          <Box sx={{ ...voteCardSx, fontSize: '1.7rem' }} onClick={() => doVote(COFFEE_SYMBOL)}>
            {COFFEE_SYMBOL}
          </Box>
        </Box>
        <UsersTable heading="Players" />
      </Box>
    </Box>
  );
}
