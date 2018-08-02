import {CREATE_GAME, GAME_CREATED, JOIN_GAME} from '../actions'

const initialGameState = {game: {playerName: '', sessionId: '', isAdmin: false}}

export default function (state = initialGameState, action) {
  switch (action.type) {
    case CREATE_GAME:
      return {...state, playerName: action.meta.userName, sessionId: action.payload.data};
    case GAME_CREATED:
      return {...state, isAdmin: true}
    case JOIN_GAME:
      return {...state, playerName: action.meta.userName, sessionId: action.meta.sessionId};
    default:
      return state
  }
}
