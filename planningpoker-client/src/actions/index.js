import axios from 'axios';
import {ROOT_URL} from '../config/Constants';

export const CREATE_GAME = 'create-game';
export const GAME_CREATED = 'game-created';
export const JOIN_GAME = 'join-game';
export const RESET_SESSION = 'reset-session';
export const RESULTS_UPDATED = 'results-updated';
export const USERS_UPDATED = 'users-updated';
export const USER_REGISTERED = 'user-registered';
export const VOTE = 'vote';

// Events
export const gameCreated = () => ({type: GAME_CREATED});

export const userRegistered = () => ({type: USER_REGISTERED});

export const resultsUpdated = (results, playerName) => (
  {type: RESULTS_UPDATED, payload: results, meta: {playerName: playerName}}
);

export const usersUpdated = (users) => (
  {type: USERS_UPDATED, payload: users}
);

// User-driven actions
export function createGame(playerName, callback) {
  const request = axios.post(`${ROOT_URL}/createSession`, `userName=${playerName}`);
  request.then(() => callback());

  return {
    type: CREATE_GAME,
    payload: request, // redux-promise will take care of resolving the promise
    meta: {userName: playerName}
  };
}

export function joinGame(playerName, sessionId, callback) {
  const request = axios.post(`${ROOT_URL}/joinSession`,
    `userName=${playerName}&sessionId=${sessionId}`);
  request.then(() => callback());

  return {
    type: JOIN_GAME,
    payload: request,
    meta: {userName: playerName, sessionId: sessionId}
  };
}

export function vote(playerName, sessionId, estimateValue) {
  axios.post(`${ROOT_URL}/vote`,
    `userName=${playerName}&sessionId=${sessionId}&estimateValue=${estimateValue}`);

  return {
    type: VOTE,
    payload: playerName
  };
}

export function resetSession(playerName, sessionId) {
  axios.post(`${ROOT_URL}/reset`, `sessionId=${sessionId}&userName=${playerName}`);

  return {
    type: RESET_SESSION
  };
}
