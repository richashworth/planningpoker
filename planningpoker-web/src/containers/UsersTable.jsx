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
        borderRadius: 2,
        p: 2.5,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{ color: 'text.secondary', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}
      >
        {heading}
      </Typography>
      {allUsers.map(name => (
        <Box key={name} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.6 }}>
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              bgcolor: '#22c55e',
              boxShadow: '0 0 6px rgba(34,197,94,0.4)',
              flexShrink: 0,
            }}
          />
          <Typography variant="body2" sx={{ color: 'text.primary' }}>
            {name}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
