import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

export default function SchemeTile({ scheme, values, selected, onClick, isCustom, customInput }) {
  return (
    <Box
      data-testid={`scheme-tile-${scheme.key}`}
      role="option"
      aria-selected={selected}
      onClick={onClick}
      sx={{
        border: '2px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        borderRadius: 2,
        p: 2,
        cursor: 'pointer',
        bgcolor: selected ? 'action.selected' : 'transparent',
        transition: 'border-color 0.2s, background-color 0.2s',
        position: 'relative',
        ...(!selected && {
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
          },
        }),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Typography sx={{ fontSize: '1.8rem', lineHeight: 1, flexShrink: 0 }}>
          {scheme.icon}
        </Typography>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {scheme.name}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            className="scheme-description"
            sx={{ display: 'block' }}
          >
            {scheme.description}
          </Typography>
        </Box>
        {selected && (
          <CheckCircleIcon
            sx={{ color: 'primary.main', flexShrink: 0, fontSize: '1.25rem' }}
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
            <Chip key={value} label={value} size="small" variant="outlined" />
          ))}
        </Box>
      ) : null}
    </Box>
  )
}
