import {CREATE_GAME, GAME_CREATED, JOIN_GAME, LEAVE_GAME, USER_REGISTERED, USERS_UPDATED, KICKED} from '../actions'

const initialGameState = {
  playerName: '',
  sessionId: '',
  isAdmin: false,
  isRegistered: false,
  legalEstimates: [],
  schemeType: 'fibonacci',
  includeUnsure: true,
  includeCoffee: true,
  host: '',
  kickedMessage: ''
};

export default function (state = initialGameState, action) {
  switch (action.type) {
    case CREATE_GAME:
      if (action.error) return state;
      return {
        ...state,
        playerName: action.meta.userName,
        sessionId: action.payload.data.sessionId,
        legalEstimates: action.payload.data.values,
        schemeType: action.payload.data.schemeType,
        includeUnsure: action.payload.data.includeUnsure,
        includeCoffee: action.payload.data.includeCoffee,
        host: action.payload.data.host || ''
      };
    case GAME_CREATED:
      return {...state, isAdmin: true, isRegistered: true};
    case USER_REGISTERED:
      return {...state, isRegistered: true};
    case JOIN_GAME:
      if (action.error) return state;
      return {
        ...state,
        playerName: action.meta.userName,
        sessionId: action.meta.sessionId,
        legalEstimates: action.payload.data.values,
        schemeType: action.payload.data.schemeType,
        includeUnsure: action.payload.data.includeUnsure,
        includeCoffee: action.payload.data.includeCoffee,
        host: action.payload.data.host || ''
      };
    case USERS_UPDATED:
      return { ...state, host: action.payload.host || '' };
    case KICKED:
      return { ...initialGameState, kickedMessage: 'You have been removed from the session by the host.' };
    case LEAVE_GAME:
      return initialGameState;
    default:
      return state
  }
}
