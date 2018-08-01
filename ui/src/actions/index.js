import axios from 'axios';

export const CREATE_GAME = 'create-game';
export const JOIN_GAME = 'join-game';

const ROOT_URL = 'http://localhost:9000';

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
  const request = axios.post(`${ROOT_URL}/joinSession`, `userName=${playerName}&sessionId=${sessionId}`)
  request.then(() => callback());

  return {
    type: JOIN_GAME,
    payload: request, // redux-promise will take care of resolving the promise
    meta: {userName: playerName, sessionId: sessionId}
  };
}
