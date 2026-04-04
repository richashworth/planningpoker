import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Tooltip from '@mui/material/Tooltip';
import SettingsIcon from '@mui/icons-material/Settings';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import _ from 'lodash';
import { leaveGame } from '../actions';
import { useSettings } from '../App';

const CARD_STYLES = [
  { key: 'square', label: 'Square', radius: '2px' },
  { key: 'rounded', label: 'Rounded', radius: '8px' },
  { key: 'cards', label: 'Cards', radius: '8px', pips: true },
];

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sessionId = useSelector(state => state.game.sessionId);
  const playerName = useSelector(state => state.game.playerName);
  const { mode, cardStyle, toggleColorMode, setCardStyle } = useSettings();
  const [copied, setCopied] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

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
                deleteIcon={
                  <Tooltip title={copied ? 'Copied!' : 'Copy session ID'} arrow>
                    {copied
                      ? <CheckIcon sx={{ fontSize: 14, color: 'success.main' }} />
                      : <ContentCopyIcon sx={{ fontSize: 14 }} />
                    }
                  </Tooltip>
                }
                onDelete={handleCopy}
                sx={{
                  bgcolor: 'action.hover',
                  border: '1px solid',
                  borderColor: 'divider',
                  color: 'text.secondary',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  height: 26,
                  '& .MuiChip-deleteIcon': {
                    color: 'text.disabled',
                    '&:hover': { color: 'text.secondary' },
                  },
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
          <IconButton
            size="small"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ color: 'text.secondary' }}
            aria-label="Settings"
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  p: 2.5,
                  minWidth: 240,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                },
              },
            }}
          >
            {/* Theme toggle */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Theme</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
                  {mode === 'dark' ? 'Dark' : 'Light'}
                </Typography>
                <Switch
                  checked={mode === 'dark'}
                  onChange={toggleColorMode}
                  size="small"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#fafafa' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#3b82f6' },
                    '& .MuiSwitch-track': { borderRadius: 10 },
                  }}
                />
              </Box>
            </Box>

            {/* Card style picker */}
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>Card Style</Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {CARD_STYLES.map(style => (
                <Box
                  key={style.key}
                  onClick={() => setCardStyle(style.key)}
                  sx={{
                    cursor: 'pointer',
                    textAlign: 'center',
                    flex: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      aspectRatio: style.pips ? '2.5 / 4' : '3 / 4',
                      bgcolor: 'background.default',
                      border: '2px solid',
                      borderColor: cardStyle === style.key ? 'primary.main' : 'divider',
                      borderRadius: style.radius,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      transition: 'border-color 0.15s ease',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'text.secondary',
                      '&:hover': { borderColor: cardStyle === style.key ? 'primary.main' : 'text.disabled' },
                    }}
                  >
                    5
                    {style.pips && (
                      <>
                        <Box sx={{ position: 'absolute', top: 3, left: 4, fontSize: '0.4rem', color: 'text.disabled' }}>5</Box>
                        <Box sx={{ position: 'absolute', bottom: 3, right: 4, fontSize: '0.4rem', color: 'text.disabled', transform: 'rotate(180deg)' }}>5</Box>
                      </>
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', mt: 0.5, display: 'block' }}>
                    {style.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Popover>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
