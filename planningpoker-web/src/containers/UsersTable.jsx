import React from 'react';
import { useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import StarRounded from '@mui/icons-material/StarRounded';
import startCase from 'lodash/startCase';
import union from 'lodash/union';

export default function UsersTable({ heading }) {
  const users = useSelector(state => state.users);
  const currentUser = useSelector(state => state.game.playerName);
  const host = useSelector(state => state.game.host);

  const allUsers = union([currentUser], users).map(startCase).sort();

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
          {name.toLowerCase() === host?.toLowerCase() && (
            <Tooltip title="Host" placement="right" arrow>
              <StarRounded sx={{ fontSize: 16, color: 'warning.main', ml: 'auto' }} />
            </Tooltip>
          )}
        </Box>
      ))}
    </Box>
  );
}
