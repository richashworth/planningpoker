import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export default function Footer() {
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
    </Box>
  )
}
