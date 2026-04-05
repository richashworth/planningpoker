import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import TagRoundedIcon from '@mui/icons-material/TagRounded'
import StraightenRoundedIcon from '@mui/icons-material/StraightenRounded'
import LinearScaleRoundedIcon from '@mui/icons-material/LinearScaleRounded'
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'

const SCHEME_ICONS = {
  fibonacci: TagRoundedIcon,
  tshirt: StraightenRoundedIcon,
  simple: LinearScaleRoundedIcon,
  time: ScheduleRoundedIcon,
  custom: TuneRoundedIcon,
}

export default function SchemeTile({ scheme, values, selected, onClick, isCustom, customInput, sx: sxProp }) {
  const Icon = SCHEME_ICONS[scheme.key]

  return (
    <Box
      data-testid={`scheme-tile-${scheme.key}`}
      role="option"
      aria-selected={selected}
      onClick={onClick}
      sx={{
        borderRadius: 1.5,
        p: 2,
        cursor: 'pointer',
        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1c1c20' : '#fff',
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'transparent',
        boxShadow: selected
          ? (theme) => `0 4px 16px ${theme.palette.mode === 'dark' ? 'rgba(102,126,234,0.2)' : 'rgba(102,126,234,0.15)'}`
          : (theme) => theme.palette.mode === 'dark'
            ? '0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.15)'
            : '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? '0 4px 12px rgba(0,0,0,0.3)'
            : '0 4px 12px rgba(0,0,0,0.1)',
        },
        ...sxProp,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Icon
          sx={{
            fontSize: '1.15rem',
            color: selected ? 'primary.main' : 'text.disabled',
            flexShrink: 0,
          }}
        />
        <Typography
          variant="body2"
          sx={{ flex: 1, fontWeight: selected ? 600 : 500, color: selected ? 'text.primary' : 'text.secondary' }}
        >
          {scheme.name}
        </Typography>
        {selected && (
          <CheckRoundedIcon
            sx={{ color: 'primary.main', flexShrink: 0, fontSize: '1rem' }}
          />
        )}
      </Box>

      {isCustom && selected ? (
        <Box sx={{ mt: 1.5 }} onClick={(e) => e.stopPropagation()}>
          {customInput}
        </Box>
      ) : values && values.length > 0 ? (
        <Typography
          className="scheme-values"
          variant="caption"
          sx={{
            display: 'block',
            mt: 1,
            fontFamily: '"SF Mono", "Fira Code", "Consolas", monospace',
            fontSize: '0.7rem',
            color: selected ? 'text.disabled' : (theme) => theme.palette.mode === 'dark' ? '#3f3f46' : '#a1a1aa',
            letterSpacing: '0.02em',
          }}
        >
          {values.join(' · ')}
        </Typography>
      ) : null}
    </Box>
  )
}
