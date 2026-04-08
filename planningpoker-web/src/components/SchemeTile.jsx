import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import SvgIcon from '@mui/material/SvgIcon'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import LinearScaleRoundedIcon from '@mui/icons-material/LinearScaleRounded'
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'

function TShirtIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path
        d="M4,11 L8.5,5 Q10.5,8 12,8 Q13.5,8 15.5,5 L20,11 L17,12 L17,21 L7,21 L7,12 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </SvgIcon>
  )
}

function FibonacciSpiralIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path
        d="M12,12.5 C12,11.5 12.8,10.8 13.8,11 C15.3,11.4 15.8,13.3 15,14.5 C14.2,15.7 12.3,16.2 10.8,15.3 C9,14.3 8.5,12 9.3,10.3 C10.2,8.3 12.5,7.5 14.8,8.2 C17.5,9.1 19,12 18.3,14.8 C17.5,18 14.5,20 11.3,19.5 C7.5,18.8 5,15.3 5.5,11.5 C6,7.5 9.8,5 13.8,5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </SvgIcon>
  )
}

const SCHEME_ICONS = {
  fibonacci: FibonacciSpiralIcon,
  tshirt: TShirtIcon,
  simple: LinearScaleRoundedIcon,
  time: ScheduleRoundedIcon,
  custom: TuneRoundedIcon,
}

export default function SchemeTile({
  scheme,
  values,
  selected,
  onClick,
  isCustom,
  customInput,
  sx: sxProp,
}) {
  const Icon = SCHEME_ICONS[scheme.key]

  return (
    <Box
      data-testid={`scheme-tile-${scheme.key}`}
      role="option"
      aria-selected={selected}
      onClick={onClick}
      sx={{
        borderRadius: 1.5,
        p: { xs: 1.5, sm: 2 },
        cursor: 'pointer',
        bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#1c1c20' : '#fff'),
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        boxShadow: selected
          ? (theme) =>
              `0 4px 16px ${theme.palette.mode === 'dark' ? 'rgba(102,126,234,0.2)' : 'rgba(102,126,234,0.15)'}`
          : (theme) =>
              theme.palette.mode === 'dark'
                ? '0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.15)'
                : '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
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
            color: selected ? 'primary.main' : 'text.primary',
            flexShrink: 0,
          }}
        />
        <Typography
          variant="body2"
          sx={{
            flex: 1,
            fontWeight: selected ? 600 : 500,
            color: 'text.primary',
          }}
        >
          {scheme.name}
        </Typography>
        {selected && (
          <CheckRoundedIcon sx={{ color: 'primary.main', flexShrink: 0, fontSize: '1rem' }} />
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
            color: 'text.secondary',
            letterSpacing: '0.02em',
          }}
        >
          {values.join(', ')}
        </Typography>
      ) : null}
    </Box>
  )
}
