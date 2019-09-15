import {CREATE_GAME, LEAVE_GAME, GAME_CREATED, JOIN_GAME, USER_REGISTERED} from '../actions'

const initialGameState =
  {
    game:
      {
        playerName: '',
        sessionId: '',
        isAdmin: false,
        isRegistered: false
      }
  };

export default function (state = initialGameState, action) {
  switch (action.type) {
    case CREATE_GAME:
      return {...state, playerName: action.meta.userName, sessionId: action.payload.data};
    case GAME_CREATED:
      return {...state, isAdmin: true, isRegistered: true};
    case USER_REGISTERED:
      return {...state, isRegistered: true};
    case JOIN_GAME:
      return {...state, playerName: action.meta.userName, sessionId: action.meta.sessionId};
    case LEAVE_GAME:
      return {...state, playerName: null, sessionId: null, isRegistered: false, isAdmin: false};
    default:
      return state
  }
}
