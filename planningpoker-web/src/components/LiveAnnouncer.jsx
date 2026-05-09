import Box from '@mui/material/Box'

export default function LiveAnnouncer({ message }) {
  return (
    <Box
      role="status"
      aria-live="polite"
      aria-atomic="true"
      sx={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
        clipPath: 'inset(50%)',
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
