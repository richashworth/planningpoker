import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import axios from 'axios';
import { API_ROOT_URL } from '../config/Constants';
import { useColorMode } from '../App';

export default function Footer() {
  const [appVersion, setAppVersion] = useState('');
  const { toggleColorMode, mode } = useColorMode();

  useEffect(() => {
    axios.get(`${API_ROOT_URL}/version`)
      .then(res => setAppVersion(res.data))
      .catch(() => {});
  }, []);

  return (
    <Box
      component="footer"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
        py: 1.5,
        borderTop: '1px solid',
        borderColor: 'divider',
        transition: 'border-color 0.3s ease',
      }}
    >
      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
        {appVersion ? `v${appVersion}` : ''}
      </Typography>
      <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} arrow>
        <IconButton
          onClick={toggleColorMode}
          aria-label="Toggle dark mode"
          size="small"
          sx={{ color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}
        >
          {mode === 'dark' ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
      <Link
        href="https://richashworth.com/blog/agile-estimation-for-distributed-teams/"
        target="_blank"
        rel="noopener noreferrer"
        underline="none"
        sx={{ color: 'text.disabled', fontSize: '0.7rem', '&:hover': { color: 'text.secondary' } }}
      >
        About
      </Link>
    </Box>
  );
}
