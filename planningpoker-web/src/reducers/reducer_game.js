import {
  CREATE_GAME,
  GAME_CREATED,
  JOIN_GAME,
  LEAVE_GAME,
  USER_REGISTERED,
  USERS_UPDATED,
  KICKED,
} from '../actions'

const initialGameState = {
  playerName: '',
  sessionId: '',
  isAdmin: false,
  isRegistered: false,
  legalEstimates: [],
  schemeType: 'fibonacci',
  includeUnsure: true,
  host: '',
  kickedMessage: '',
}

export default function (state = initialGameState, action) {
  switch (action.type) {
    case CREATE_GAME:
      if (action.error) return state
      return {
        ...state,
        playerName: action.meta.userName,
        sessionId: action.payload.sessionId,
        legalEstimates: action.payload.values,
        schemeType: action.payload.schemeType,
        includeUnsure: action.payload.includeUnsure,
        host: action.payload.host || '',
      }
    case GAME_CREATED:
      return { ...state, isAdmin: true, isRegistered: true }
    case USER_REGISTERED:
      return { ...state, isRegistered: true }
    case JOIN_GAME:
      if (action.error) return state
      return {
        ...state,
        playerName: action.meta.userName,
        sessionId: action.meta.sessionId,
        legalEstimates: action.payload.values,
        schemeType: action.payload.schemeType,
        includeUnsure: action.payload.includeUnsure,
        host: action.payload.host || '',
      }
    case USERS_UPDATED:
      return { ...state, host: action.payload.host || '' }
    case KICKED:
      return {
        ...initialGameState,
        kickedMessage: 'You have been removed from the session by the host.',
      }
    case LEAVE_GAME:
      return initialGameState
    default:
      return state
  }
}
