import React from 'react';
import { useSelector } from 'react-redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import _ from 'lodash';

export default function ResultsTable() {
  const results = useSelector(state => state.results);
  const users = useSelector(state => state.users);

  const notVoted = _.difference(users, results.map(x => x.userName));

  const voteFreqs = _.countBy(results, x => x.estimateValue);
  const countedResults = results.map(x => ({ ...x, count: voteFreqs[parseInt(x.estimateValue, 10)] }));
  const sortedResults = _.orderBy(countedResults, ['count', 'estimateValue', 'userName'], ['asc', 'asc', 'asc']);

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        p: 2,
        transition: 'border-color 0.3s ease, background-color 0.3s ease',
      }}
    >
      <Typography
        variant="overline"
        sx={{ color: 'text.secondary', mb: 1.5, display: 'block', fontSize: '0.65rem', letterSpacing: '0.08em' }}
      >
        Votes
      </Typography>
      <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <Box component="th" sx={{ textAlign: 'left', pb: 0.75, fontSize: '0.65rem', color: 'text.disabled', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Player
            </Box>
            <Box component="th" sx={{ textAlign: 'right', pb: 0.75, fontSize: '0.65rem', color: 'text.disabled', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Vote
            </Box>
          </tr>
        </thead>
        <tbody>
          {sortedResults.map(x => (
            <tr key={x.userName}>
              <Box component="td" sx={{ py: 0.5, fontSize: '0.85rem', color: 'text.primary' }}>
                {_.startCase(x.userName)}
              </Box>
              <Box component="td" sx={{ py: 0.5, fontSize: '0.85rem', color: 'text.primary', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {x.estimateValue}
              </Box>
            </tr>
          ))}
          {notVoted.map(x => (
            <tr key={x}>
              <Box component="td" sx={{ py: 0.5, fontSize: '0.85rem', color: 'text.disabled', fontStyle: 'italic' }}>
                {_.startCase(x)}
              </Box>
              <Box component="td" sx={{ py: 0.5, fontSize: '0.85rem', color: 'text.disabled', textAlign: 'right' }}>
                —
              </Box>
            </tr>
          ))}
        </tbody>
      </Box>
    </Box>
  );
}
