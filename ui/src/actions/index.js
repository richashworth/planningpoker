import axios from 'axios';

export const CREATE_GAME = 'create-game';

const ROOT_URL = 'http://localhost:9000';

export function createGame(playerName, callback) {
  const request = axios.post(`${ROOT_URL}/createSession`, {'userName': playerName})
    .then(() => callback());

  return {
    type: CREATE_GAME,
    payload: ['playerName': playerName, 'sessionId': request]// redux-promise will take care of resolving the promise
  };
}
