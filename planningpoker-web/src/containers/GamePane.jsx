import React from 'react'
import { useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Vote from './Vote'
import Results from './Results'

export default function GamePane({ connected }) {
  const voted = useSelector((state) => state.voted)

  return (
    <>
      {connected === false && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            mb: 2,
            borderRadius: 1,
            bgcolor: (t) =>
              t.palette.mode === 'dark' ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)',
            border: '1px solid',
            borderColor: 'error.main',
          }}
        >
          <Box
            sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main', flexShrink: 0 }}
          />
          <Typography variant="body2" sx={{ color: 'error.main', fontSize: '0.8rem' }}>
            Reconnecting...
          </Typography>
        </Box>
      )}
      <Box aria-live="polite" aria-atomic="true">
        {voted ? <Results /> : <Vote />}
      </Box>
    </>
  )
}
