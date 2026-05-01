import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export default function ConsensusCardRail({ legalEstimates, results, value, onChange }) {
  const counts = {}
  for (const { estimateValue } of results) {
    counts[estimateValue] = (counts[estimateValue] || 0) + 1
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1.5,
        pt: 1,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: 'text.disabled',
          fontWeight: 700,
          fontSize: '0.7rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        Consensus
      </Typography>
      <Box sx={{ display: 'inline-flex', flexWrap: 'wrap', gap: 0.75 }}>
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
                height: 32,
                minWidth: 44,
                px: 1.5,
                borderRadius: '16px',
                border: '1px solid',
                borderColor: selected ? 'primary.main' : 'divider',
                bgcolor: selected ? 'primary.main' : 'background.paper',
                color: selected ? 'primary.contrastText' : 'text.primary',
                fontFamily: 'inherit',
                fontSize: '0.8125rem',
                fontWeight: 600,
                fontVariantNumeric: 'tabular-nums',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                opacity: !selected && !voted ? 0.55 : 1,
                '&:hover': {
                  opacity: 1,
                  borderColor: 'primary.main',
                  color: selected ? 'primary.contrastText' : 'primary.main',
                },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 2,
                },
              }}
            >
              <Box component="span">{v}</Box>
              {voted && (
                <Box
                  component="span"
                  aria-hidden
                  sx={{
                    fontSize: '0.6875rem',
                    fontWeight: 500,
                    color: selected ? 'rgba(255,255,255,0.85)' : 'text.disabled',
                  }}
                >
                  ·{n}
                </Box>
              )}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
