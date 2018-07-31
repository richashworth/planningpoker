import { CREATE_GAME } from '../actions'

const initialGameState = {game: {playerName: '', sessionId: ''}}

export default function(state = initialGameState, action) {
  switch(action.type) {
    case CREATE_GAME:
    console.log("in reducer");
      const newState = {playerName: action.meta.userName, sessionId: action.payload.data};
      return newState
    default:
      return state
  }
}
