import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import _ from 'lodash';
import { leaveGame } from '../actions';
import { useColorMode } from '../App';

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sessionId = useSelector(state => state.game.sessionId);
  const playerName = useSelector(state => state.game.playerName);
  const { toggleColorMode, mode } = useColorMode();

  const handleLogout = () => {
    dispatch(leaveGame(playerName, sessionId, () => navigate('/')));
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: (t) => t.palette.mode === 'dark'
          ? 'rgba(18, 18, 21, 0.8)'
          : 'rgba(250, 250, 250, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        transition: 'background-color 0.3s ease',
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <Typography variant="h6" sx={{ flexGrow: 1, fontSize: '1.1rem' }}>
          Planning Poker
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {sessionId && (
            <>
              <Typography variant="body2" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                {_.startCase(playerName)}
              </Typography>
              <Chip
                label={sessionId}
                size="small"
                sx={{
                  bgcolor: 'action.hover',
                  border: '1px solid',
                  borderColor: 'divider',
                  color: 'text.secondary',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  height: 26,
                }}
              />
              <Button
                variant="text"
                size="small"
                onClick={handleLogout}
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.8rem',
                  minWidth: 'auto',
                  '&:hover': { color: 'error.main', bgcolor: 'transparent' },
                }}
              >
                Log out
              </Button>
            </>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem', mr: 0.5 }}>
              {mode === 'dark' ? 'Dark' : 'Light'}
            </Typography>
            <Switch
              checked={mode === 'dark'}
              onChange={toggleColorMode}
              size="small"
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#fafafa',
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  bgcolor: '#3b82f6',
                },
                '& .MuiSwitch-track': {
                  borderRadius: 10,
                },
              }}
              inputProps={{ 'aria-label': 'Toggle dark mode' }}
            />
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
