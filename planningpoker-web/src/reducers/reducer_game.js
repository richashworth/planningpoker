import {
  CREATE_GAME,
  GAME_CREATED,
  JOIN_GAME,
  LABEL_UPDATED,
  LEAVE_GAME,
  RESET_SESSION,
  RESULTS_REPLACE,
  USER_REGISTERED,
  USERS_UPDATED,
  VOTE,
  KICKED,
} from '../actions'

const initialGameState = {
  playerName: '',
  sessionId: '',
  isAdmin: false,
  isRegistered: false,
  isSpectator: false,
  legalEstimates: [],
  schemeType: 'fibonacci',
  includeUnsure: true,
  host: '',
  kickedMessage: '',
  currentLabel: '',
  clientRound: 0,
}

function applySessionPayload(state, action) {
  // sessionId comes from payload on CREATE_GAME (server-issued) and from meta on
  // JOIN_GAME (client-supplied); everything else is identical between the two cases.
  return {
    ...state,
    playerName: action.meta.userName,
    sessionId: action.payload.sessionId ?? action.meta.sessionId,
    isSpectator: !!action.meta.isSpectator,
    legalEstimates: action.payload.values,
    schemeType: action.payload.schemeType,
    includeUnsure: action.payload.includeUnsure,
    host: action.payload.host || '',
    clientRound: action.payload.round ?? 0,
    currentLabel: action.payload.label || '',
  }
}

export default function (state = initialGameState, action) {
  switch (action.type) {
    case CREATE_GAME:
      if (action.error) return state
      return applySessionPayload(state, action)
    case GAME_CREATED:
      return { ...state, isAdmin: true, isRegistered: true }
    case USER_REGISTERED:
      return { ...state, isRegistered: true }
    case JOIN_GAME:
      if (action.error) return state
      return applySessionPayload(state, action)
    case USERS_UPDATED:
      return { ...state, host: action.payload.host || '' }
    case LABEL_UPDATED:
      return { ...state, currentLabel: action.payload || '' }
    case RESULTS_REPLACE:
      return { ...state, clientRound: action.payload.round ?? state.clientRound }
    case VOTE:
      if (action.error) return state
      return {
        ...state,
        clientRound: action.payload?.round ?? state.clientRound,
      }
    case RESET_SESSION:
      if (action.error) return state
      return {
        ...state,
        currentLabel: '',
        clientRound: action.payload?.round ?? state.clientRound,
      }
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
