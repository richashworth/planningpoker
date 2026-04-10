import Box from '@mui/material/Box'

export default function LiveAnnouncer({ message }) {
  return (
    <Box
      role="status"
      aria-live="polite"
      aria-atomic="true"
      sx={{
        position: 'absolute',
        width: 1,
        height: 1,
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
        whiteSpace: 'nowrap',
        border: 0,
        p: 0,
        m: '-1px',
      }}
    >
      {message}
    </Box>
  )
}
