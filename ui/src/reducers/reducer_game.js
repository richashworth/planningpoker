import { CREATE_GAME, JOIN_GAME } from '../actions'

const initialGameState = {game: {playerName: '', sessionId: ''}}
const newState = (playerName, sessionId) => ({playerName, sessionId});

export default function(state = initialGameState, action) {
  switch(action.type) {
    case CREATE_GAME:
        return newState(action.meta.userName, action.payload.data);
    case JOIN_GAME:
        return newState(action.meta.userName, action.meta.sessionId);
    default:
      return state
  }
}
