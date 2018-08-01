import { CREATE_GAME, JOIN_GAME } from '../actions'

const initialGameState = {game: {playerName: '', sessionId: ''}}

export default function(state = initialGameState, action) {
  switch(action.type) {
    case CREATE_GAME:
        return {playerName: action.meta.userName, sessionId: action.payload.data};
    case JOIN_GAME:
        return {playerName: action.meta.userName, sessionId: action.meta.sessionId};
    default:
      return state
  }
}
