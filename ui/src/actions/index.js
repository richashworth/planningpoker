import axios from 'axios';

export const CREATE_GAME = 'create-game';

const ROOT_URL = 'http://localhost:9000';

export function createGame(playerName, callback) {
  console.log(`sending post with user: ${playerName}`)
  const request = axios.post(`${ROOT_URL}/createSession`, `userName=${playerName}`)
  request.then(() => callback());

  return {
    type: CREATE_GAME,
    payload: request, // redux-promise will take care of resolving the promise
    meta: {userName: playerName}
  };
}
