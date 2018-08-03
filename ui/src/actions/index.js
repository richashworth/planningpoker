import axios from 'axios';

export const CREATE_GAME = 'create-game';
export const GAME_CREATED = 'game-created';
export const JOIN_GAME = 'join-game';
export const RESET_SESSION = 'reset-session';
export const RESULTS_UPDATED = 'results-updated';
export const VOTE = 'vote';

const ROOT_URL = 'http://localhost:9000';

// Events
export const gameCreated = () => ({type: GAME_CREATED});
export const resultsUpdated = (results) =>({type: RESULTS_UPDATED, payload: results});

// User-driven actions
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

export function resetSession(playerName, sessionId, callback) {
console.log('in action:'+sessionId+playerName)
  const request = axios.post(`${ROOT_URL}/reset`, `sessionId=${sessionId}&userName=${playerName}`);
  request.then(() => callback());

  return {
    type: RESET_SESSION
  };
}

//
// curl 'http://localhost:9000/createSession' -H 'Origin: http://localhost:3000' -H 'Accept-Encoding: gzip, deflate, br' -H 'Accept-Language: en-US,en;q=0.9' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36' -H 'Content-Type: application/x-www-form-urlencoded' -H 'Accept: application/json, text/plain, |)}>#*' -H 'Referer: http://localhost:3000/create' -H 'Connection: keep-alive' -H 'DNT: 1' --data 'userName=2g42b' --compressed
//
//
//
// curl 'http://localhost:9000/reset' -X DELETE -H 'Origin: http://localhost:3000' -H 'Accept-Encoding: gzip, deflate, br' -H 'Accept-Language: en-US,en;q=0.9' -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36' -H 'Accept: application/json, text/plain, */*' -H 'Referer: http://localhost:3000/results' -H 'Connection: keep-alive' -H 'DNT: 1' --compressed
