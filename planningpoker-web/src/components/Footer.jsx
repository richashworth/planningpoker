import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import axios from 'axios'
import { API_ROOT_URL } from '../config/Constants'

export default function Footer() {
  const [appVersion, setAppVersion] = useState('')

  useEffect(() => {
    axios
      .get(`${API_ROOT_URL}/version`)
      .then((res) => setAppVersion(res.data))
      .catch(() => {})
  }, [])

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
        &copy; {new Date().getFullYear()} Rich Ashworth
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
        {appVersion ? `v${appVersion}` : ''}
      </Typography>
    </Box>
  )
}
