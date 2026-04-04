import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ResultsTable from './ResultsTable';
import ResultsChart from './ResultsChart';
import { resetSession } from '../actions';

export default function Results() {
  const dispatch = useDispatch();
  const isAdmin = useSelector(state => state.game.isAdmin);
  const sessionId = useSelector(state => state.game.sessionId);
  const playerName = useSelector(state => state.game.playerName);

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3, fontSize: '1.1rem' }}>
        Results
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 240px' }, gap: 3, alignItems: 'start' }}>
        <Box>
          <Box
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              p: 2.5,
              mb: 2.5,
              transition: 'border-color 0.3s ease, background-color 0.3s ease',
            }}
          >
            <ResultsChart />
          </Box>
          {isAdmin && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                disableElevation
                onClick={() => dispatch(resetSession(playerName, sessionId))}
                sx={{ px: 4 }}
              >
                Next Item
              </Button>
            </Box>
          )}
        </Box>
        <ResultsTable />
      </Box>
    </Box>
  );
}
