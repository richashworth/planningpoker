import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import startCase from 'lodash/startCase';
import { leaveGame } from '../actions';
import { useColorMode } from '../App';

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sessionId = useSelector(state => state.game.sessionId);
  const playerName = useSelector(state => state.game.playerName);
  const { toggleColorMode, mode } = useColorMode();
  const [copied, setCopied] = useState(false);

  const handleLogout = () => {
    dispatch(leaveGame(playerName, sessionId, () => navigate('/')));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <Typography variant="h6" sx={{ flexGrow: 1, fontSize: '1.1rem', color: '#fff' }}>
          Planning Poker
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'} arrow>
            <IconButton
              onClick={toggleColorMode}
              size="small"
              sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}
              aria-label="Toggle dark mode"
            >
              {mode === 'dark' ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          {sessionId && (
            <>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', display: { xs: 'none', sm: 'block' } }}>
                {startCase(playerName)}
              </Typography>
              <Chip
                label={sessionId}
                size="small"
                deleteIcon={
                  <Tooltip title={copied ? 'Copied!' : 'Copy session ID'} arrow>
                    {copied
                      ? <CheckIcon sx={{ fontSize: 14, color: '#fff' }} />
                      : <ContentCopyIcon sx={{ fontSize: 14 }} />
                    }
                  </Tooltip>
                }
                onDelete={handleCopy}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: 'rgba(255,255,255,0.9)',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  height: 26,
                  borderRadius: 1,
                  '& .MuiChip-deleteIcon': {
                    color: 'rgba(255,255,255,0.6)',
                    '&:hover': { color: '#fff' },
                  },
                }}
              />
              <Button
                variant="text"
                size="small"
                onClick={handleLogout}
                sx={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.8rem',
                  minWidth: 'auto',
                  '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                Log out
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
