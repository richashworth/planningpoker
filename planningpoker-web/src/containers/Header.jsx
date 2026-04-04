import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
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
        bgcolor: 'background.default',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Planning Poker
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {sessionId && (
            <>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
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
                }}
              />
              <Button
                variant="text"
                size="small"
                onClick={handleLogout}
                sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
              >
                Log Out
              </Button>
            </>
          )}
          <IconButton
            onClick={toggleColorMode}
            size="small"
            sx={{ color: 'text.secondary', ml: 0.5 }}
            aria-label="Toggle dark mode"
          >
            {mode === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19'}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
