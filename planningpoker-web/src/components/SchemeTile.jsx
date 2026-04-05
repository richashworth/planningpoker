import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
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
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        borderRadius: 1.5,
        p: 1.5,
        cursor: 'pointer',
        bgcolor: selected ? 'action.selected' : 'transparent',
        transition: 'all 0.15s ease',
        ...(!selected && {
          '&:hover': {
            borderColor: 'text.disabled',
            bgcolor: 'action.hover',
          },
        }),
        ...sxProp,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Icon
          sx={{
            fontSize: '1.25rem',
            color: selected ? 'primary.main' : 'text.secondary',
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
        <Box sx={{ mt: 1 }} onClick={(e) => e.stopPropagation()}>
          {customInput}
        </Box>
      ) : values && values.length > 0 ? (
        <Box
          className="scheme-values"
          sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}
        >
          {values.map((value) => (
            <Chip
              key={value}
              label={value}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                bgcolor: 'action.hover',
                border: 'none',
                color: 'text.secondary',
              }}
            />
          ))}
        </Box>
      ) : null}
    </Box>
  )
}
