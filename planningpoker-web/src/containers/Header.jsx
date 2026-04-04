import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
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
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = () => {
    setAnchorEl(null);
    dispatch(leaveGame(playerName, sessionId, () => navigate('/')));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleThemeToggle = () => {
    setAnchorEl(null);
    toggleColorMode();
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
        <Typography variant="h6" sx={{ fontSize: '1.1rem', color: '#fff' }}>
          Planning Poker
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        {sessionId ? (
          <>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', display: { xs: 'none', sm: 'block' } }}>
              Session
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
              onClick={(e) => setAnchorEl(e.currentTarget)}
              endIcon={<ArrowDropDownIcon />}
              sx={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: '0.85rem',
                textTransform: 'none',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              {startCase(playerName)}
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={handleThemeToggle}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {mode === 'dark'
                    ? <LightModeOutlinedIcon fontSize="small" />
                    : <DarkModeOutlinedIcon fontSize="small" />
                  }
                </ListItemIcon>
                <ListItemText>{mode === 'dark' ? 'Light mode' : 'Dark mode'}</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Log out</ListItemText>
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'} arrow>
            <Button
              onClick={toggleColorMode}
              startIcon={mode === 'dark' ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
              sx={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.8rem',
                textTransform: 'none',
                '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              {mode === 'dark' ? 'Light mode' : 'Dark mode'}
            </Button>
          </Tooltip>
        )}
      </Toolbar>
    </AppBar>
  );
}
