import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { vote, voteOptimistic } from '../actions'
import UsersTable from './UsersTable'
import SpectatorsTable from './SpectatorsTable'
import SessionHistory from './SessionHistory'

function cardSx(isSelected, isDisabled) {
  return {
    minWidth: 80,
    minHeight: 107,
    px: 1.5,
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    fontWeight: 700,
    color: isDisabled ? 'text.disabled' : 'text.primary',
    bgcolor: isSelected ? 'primary.main' : 'background.paper',
    border: '2px solid',
    borderColor: isSelected ? 'primary.main' : 'divider',
    borderRadius: 0.5,
    cursor: isDisabled ? 'default' : 'pointer',
    userSelect: 'none',
    opacity: isDisabled && !isSelected ? 0.4 : 1,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    ...(isSelected && {
      color: 'primary.contrastText',
      transform: 'scale(1.04)',
      boxShadow: (t) => `0 4px 16px ${t.palette.primary.main}40`,
    }),
    ...(!isDisabled &&
      !isSelected && {
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-3px)',
          boxShadow: (t) =>
            t.palette.mode === 'dark'
              ? '0 8px 24px rgba(102,126,234,0.15)'
              : '0 8px 24px rgba(102,126,234,0.12)',
        },
        '&:active': {
          transform: 'translateY(0) scale(0.98)',
          transition: 'all 0.1s ease',
        },
      }),
  }
}

export default function Vote({ consensusOverride = null }) {
  const dispatch = useDispatch()
  const sessionId = useSelector((state) => state.game.sessionId)
  const playerName = useSelector((state) => state.game.playerName)
  const legalEstimates = useSelector((state) => state.game.legalEstimates)
  const [selected, setSelected] = useState(null)

  const doVote = (val) => {
    if (selected) return
    setSelected(val)
    dispatch(voteOptimistic(playerName, val))
    dispatch(vote(playerName, sessionId, val))
  }

  const allValues = legalEstimates

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 42, mb: 1 }}>
        <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
          Cast your estimate
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 240px' },
          gridTemplateAreas: {
            xs: `"cards" "players" "history"`,
            md: `"cards players" "history players"`,
          },
          columnGap: 3,
          rowGap: { xs: 3, md: 0 },
          alignItems: 'start',
        }}
      >
        <Box sx={{ gridArea: 'cards', minWidth: 0 }}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.75,
            }}
          >
            {allValues.map((val) => (
              <Box
                key={val}
                role="button"
                tabIndex={0}
                aria-label={`Vote ${val}`}
                sx={{
                  ...cardSx(selected === val, selected !== null && selected !== val),
                  ...(val === '\u2615' && { fontSize: '1.5rem' }),
                }}
                onClick={() => doVote(val)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    doVote(val)
                  }
                }}
              >
                {val}
              </Box>
            ))}
          </Box>
        </Box>
        <Box sx={{ gridArea: 'players' }}>
          <UsersTable heading="Players" />
          <SpectatorsTable />
        </Box>
        <Box sx={{ gridArea: 'history', minWidth: 0 }}>
          <SessionHistory consensusOverride={consensusOverride} />
        </Box>
      </Box>
    </Box>
  )
}
