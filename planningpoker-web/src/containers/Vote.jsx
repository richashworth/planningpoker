import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { vote } from '../actions';
import UsersTable from './UsersTable';
import { COFFEE_SYMBOL, LEGAL_ESTIMATES } from '../config/Constants';
import { useSettings } from '../App';

const baseCardSx = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  color: 'text.primary',
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
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

const styleVariants = {
  square: {
    borderRadius: 0.5,
    aspectRatio: '3 / 4',
    fontSize: '1.25rem',
  },
  rounded: {
    borderRadius: 3,
    aspectRatio: '3 / 4',
    fontSize: '1.25rem',
  },
  cards: {
    borderRadius: 3,
    aspectRatio: '2.5 / 4',
    fontSize: '1.25rem',
    position: 'relative',
  },
};

function VoteCard({ value, cardStyle, onClick, sx: extraSx }) {
  const variant = styleVariants[cardStyle] || styleVariants.rounded;

  return (
    <Box
      sx={{ ...baseCardSx, ...variant, ...extraSx }}
      onClick={onClick}
    >
      {value}
      {cardStyle === 'cards' && (
        <>
          <Box sx={{ position: 'absolute', top: 5, left: 6, fontSize: '0.5rem', color: 'text.disabled', lineHeight: 1 }}>
            {value}
          </Box>
          <Box sx={{ position: 'absolute', bottom: 5, right: 6, fontSize: '0.5rem', color: 'text.disabled', lineHeight: 1, transform: 'rotate(180deg)' }}>
            {value}
          </Box>
        </>
      )}
    </Box>
  );
}

export default function Vote() {
  const dispatch = useDispatch();
  const sessionId = useSelector(state => state.game.sessionId);
  const playerName = useSelector(state => state.game.playerName);
  const { cardStyle } = useSettings();

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
            <VoteCard key={val} value={val} cardStyle={cardStyle} onClick={() => doVote(val)} />
          ))}
          <VoteCard
            value={COFFEE_SYMBOL}
            cardStyle={cardStyle}
            onClick={() => doVote(COFFEE_SYMBOL)}
            sx={{ fontSize: '1.5rem' }}
          />
        </Box>
        <UsersTable heading="Players" />
      </Box>
    </Box>
  );
}
