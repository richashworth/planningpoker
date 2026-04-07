import axios from 'axios';
import {API_ROOT_URL} from '../config/Constants';

export const CREATE_GAME = 'create-game';
export const GAME_CREATED = 'game-created';
export const JOIN_GAME = 'join-game';
export const LEAVE_GAME = 'leave-game';
export const RESET_SESSION = 'reset-session';
export const RESULTS_UPDATED = 'results-updated';
export const USERS_UPDATED = 'users-updated';
export const USER_REGISTERED = 'user-registered';
export const HOST_UPDATED = 'host-updated';
export const KICK_USER = 'kick-user';
export const PROMOTE_USER = 'promote-user';
export const KICKED = 'kicked';
export const VOTE = 'vote';
export const VOTE_OPTIMISTIC = 'vote-optimistic';

export const voteOptimistic = (playerName, estimateValue) => ({
  type: VOTE_OPTIMISTIC,
  payload: { userName: playerName, estimateValue },
});

// Events
export const gameCreated = () => ({type: GAME_CREATED});

export const userRegistered = () => ({type: USER_REGISTERED});

export const resultsUpdated = (results, playerName) => (
  {type: RESULTS_UPDATED, payload: results, meta: {playerName: playerName}}
);

export const usersUpdated = (users) => (
  {type: USERS_UPDATED, payload: users}
);

export const kicked = () => ({type: KICKED});

// User-driven actions
export function createGame(playerName, schemeOptions, callback) {
  const request = axios.post(`${API_ROOT_URL}/createSession`, {
    userName: playerName,
    schemeType: schemeOptions.schemeType,
    customValues: schemeOptions.customValues,
    includeUnsure: schemeOptions.includeUnsure,
    includeCoffee: schemeOptions.includeCoffee
  });
  request.then(() => callback()).catch(err => {
    const msg = err.response?.data?.error || 'Failed to create session';
    alert(msg);
  });

  return {
    type: CREATE_GAME,
    payload: request,
    meta: {userName: playerName}
  };
}

export function leaveGame(playerName, sessionId, callback) {
  const request = axios.post(`${API_ROOT_URL}/logout`,
    new URLSearchParams({ userName: playerName, sessionId }));
  request.then(() => callback()).catch(err => {
    console.error('Failed to leave session', err);
  });

  return {
    type: LEAVE_GAME,
    payload: request,
  };
}

export function joinGame(playerName, sessionId, callback) {
  const request = axios.post(`${API_ROOT_URL}/joinSession`,
    new URLSearchParams({ userName: playerName, sessionId }));
  request.then(() => callback()).catch(err => {
    const msg = err.response?.data?.error || 'Failed to join session';
    alert(msg);
  });

  return {
    type: JOIN_GAME,
    payload: request,
    meta: {userName: playerName, sessionId: sessionId}
  };
}

export function vote(playerName, sessionId, estimateValue) {
  const request = axios.post(`${API_ROOT_URL}/vote`,
    new URLSearchParams({ userName: playerName, sessionId, estimateValue }));

  return {
    type: VOTE,
    payload: request,
    meta: { userName: playerName, estimateValue }
  };
}

export function resetSession(playerName, sessionId) {
  const request = axios.post(`${API_ROOT_URL}/reset`, new URLSearchParams({ sessionId, userName: playerName }));

  return {
    type: RESET_SESSION,
    payload: request
  };
}

export function kickUser(userName, targetUser, sessionId) {
  const request = axios.post(`${API_ROOT_URL}/kick`,
    new URLSearchParams({ userName, targetUser, sessionId }))
  request.catch(err => {
    const msg = err.response?.data?.error || 'Failed to kick user'
    alert(msg)
  })
  return {
    type: KICK_USER,
    payload: request,
  }
}

export function promoteUser(userName, targetUser, sessionId) {
  const request = axios.post(`${API_ROOT_URL}/promote`,
    new URLSearchParams({ userName, targetUser, sessionId }))
  request.catch(err => {
    const msg = err.response?.data?.error || 'Failed to promote user'
    alert(msg)
  })
  return {
    type: PROMOTE_USER,
    payload: request,
  }
}
