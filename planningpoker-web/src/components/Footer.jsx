import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import axios from 'axios';
import { API_ROOT_URL } from '../config/Constants';

export default function Footer() {
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    axios.get(`${API_ROOT_URL}/version`)
      .then(res => setAppVersion(res.data));
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
      }}
    >
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        {appVersion ? `v${appVersion}` : ''}
      </Typography>
      <Link
        href="https://richashworth.com/blog/agile-estimation-for-distributed-teams/"
        target="_blank"
        rel="noopener noreferrer"
        sx={{ color: 'text.secondary', fontSize: '0.75rem', '&:hover': { color: 'primary.main' } }}
      >
        About
      </Link>
    </Box>
  );
}
