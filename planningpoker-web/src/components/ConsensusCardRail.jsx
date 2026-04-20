import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export default function ConsensusCardRail({ legalEstimates, results, value, onChange }) {
  const counts = {}
  for (const { estimateValue } of results) {
    counts[estimateValue] = (counts[estimateValue] || 0) + 1
  }

  return (
    <Box sx={{ minWidth: 0, pt: 1 }}>
      <Typography
        variant="body2"
        sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.8rem', mb: 1 }}
      >
        Lock in the estimate
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', pt: 0.75, pr: 0.75 }}>
        {legalEstimates.map((v) => {
          const n = counts[v] || 0
          const selected = v === value
          const voted = n > 0
          return (
            <Box
              key={v}
              component="button"
              type="button"
              aria-label={`Set consensus to ${v}${n ? ` (${n} vote${n === 1 ? '' : 's'})` : ''}`}
              aria-pressed={selected}
              onClick={() => onChange(v)}
              sx={{
                position: 'relative',
                width: 44,
                height: 58,
                p: 0,
                borderRadius: '6px',
                border: '1.5px solid',
                borderColor: selected ? 'primary.main' : 'divider',
                bgcolor: selected ? 'primary.main' : voted ? 'background.paper' : 'transparent',
                color: selected ? '#fff' : voted ? 'text.primary' : 'text.disabled',
                fontFamily: 'inherit',
                fontSize: '1rem',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                transform: selected ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: selected
                  ? '0 4px 12px rgba(102,126,234,0.35)'
                  : voted
                    ? '0 1px 2px rgba(0,0,0,0.08)'
                    : 'none',
                opacity: !voted && !selected ? 0.45 : 1,
                '&:hover': {
                  borderColor: 'primary.main',
                  opacity: 1,
                },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 2,
                },
              }}
            >
              {v}
              {n > 0 && (
                <Box
                  component="span"
                  aria-hidden
                  sx={{
                    position: 'absolute',
                    top: -7,
                    right: -7,
                    minWidth: 18,
                    height: 18,
                    px: '5px',
                    borderRadius: '999px',
                    bgcolor: selected ? 'background.paper' : 'primary.main',
                    color: selected ? 'primary.main' : '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid',
                    borderColor: 'background.paper',
                    lineHeight: 1,
                  }}
                >
                  {n}
                </Box>
              )}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
