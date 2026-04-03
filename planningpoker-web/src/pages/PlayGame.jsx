import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import GamePane from '../containers/GamePane';
import useStomp from '../hooks/useStomp';
import { resultsUpdated, usersUpdated } from '../actions';
import { API_ROOT_URL } from '../config/Constants';

export default function PlayGame() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const playerName = useSelector(state => state.game.playerName);
  const sessionId = useSelector(state => state.game.sessionId);
  const isUserRegistered = useSelector(state => state.game.isRegistered);

  useEffect(() => {
    if (!isUserRegistered) {
      navigate('/');
    }
  }, [isUserRegistered, navigate]);

  useStomp({
    url: `${API_ROOT_URL}/stomp`,
    topics: [
      `/topic/items/${sessionId}`,
      `/topic/results/${sessionId}`,
      `/topic/users/${sessionId}`,
    ],
    onMessage: (msg) => {
      switch (msg.type) {
        case 'RESULTS_MESSAGE':
          return dispatch(resultsUpdated(msg.payload, playerName));
        case 'USERS_MESSAGE':
          return dispatch(usersUpdated(msg.payload));
        default:
          return;
      }
    },
  });

  return (
    <Box sx={{ maxWidth: 1100, width: '100%', mx: 'auto', p: 3, pt: 4 }}>
      <GamePane />
    </Box>
  );
}
