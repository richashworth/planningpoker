import axios from 'axios';

export const CREATE_GAME = 'create-game';
export const GAME_CREATED = 'game-created';
export const JOIN_GAME = 'join-game';
export const VOTE = 'vote';
export const RESULTS_UPDATED = 'results-updated';

const ROOT_URL = 'http://localhost:9000';

export const gameCreated = () => ({type: GAME_CREATED});

export function createGame(playerName, callback) {

  const request = axios.post(`${ROOT_URL}/createSession`, `userName=${playerName}`)
  request.then(() => callback());

  return {
    type: CREATE_GAME,
    payload: request, // redux-promise will take care of resolving the promise
    meta: {userName: playerName}
  };
}

export function joinGame(playerName, sessionId, callback) {
  const request = axios.post(`${ROOT_URL}/joinSession`,
    `userName=${playerName}&sessionId=${sessionId}`)
  request.then(() => callback());

  return {
    type: JOIN_GAME,
    payload: request, // redux-promise will take care of resolving the promise
    meta: {userName: playerName, sessionId: sessionId}
  };
}

export function vote(playerName, sessionId, estimateValue, callback) {

  const request = axios.post(`${ROOT_URL}/vote`,
    `userName=${playerName}&sessionId=${sessionId}&estimateValue=${estimateValue}`)
  request.then(() => callback());

  return {
    type: VOTE
  };
}

export function resultsUpdated(results) {

  return {
    type: RESULTS_UPDATED,
    payload: results // redux-promise will take care of resolving the promise
  };
}
