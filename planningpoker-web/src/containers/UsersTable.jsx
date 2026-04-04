import React from 'react';
import { useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import _ from 'lodash';

export default function UsersTable({ heading }) {
  const users = useSelector(state => state.users);
  const currentUser = useSelector(state => state.game.playerName);

  const allUsers = _.union([currentUser], users).map(_.startCase).sort();

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        p: 2,
        transition: 'border-color 0.3s ease, background-color 0.3s ease',
      }}
    >
      <Typography
        variant="overline"
        sx={{ color: 'text.secondary', mb: 1.5, display: 'block', fontSize: '0.65rem', letterSpacing: '0.08em' }}
      >
        {heading}
      </Typography>
      {allUsers.map(name => (
        <Box key={name} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: 'success.main',
              flexShrink: 0,
            }}
          />
          <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.85rem' }}>
            {name}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
