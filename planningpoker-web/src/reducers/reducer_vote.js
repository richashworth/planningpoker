import {
  LEAVE_GAME,
  RESET_SESSION,
  RESULTS_REPLACE,
  RESULTS_UNION,
  VOTE,
  VOTE_OPTIMISTIC,
} from '../actions'

function containsPlayer(results, playerName) {
  if (!Array.isArray(results) || !playerName) return false
  return results.some((r) => r.userName === playerName)
}

export default function (state = false, action) {
  switch (action.type) {
    case VOTE_OPTIMISTIC:
      return true
    case VOTE:
      if (action.error) return false
      if (containsPlayer(action.payload?.results, action.meta?.userName)) return true
      return state
    case LEAVE_GAME:
      return false
    case RESET_SESSION:
      return false
    case RESULTS_REPLACE:
    case RESULTS_UNION:
      if (containsPlayer(action.payload?.results, action.meta?.playerName)) return true
      return state
    default:
      return state
  }
}
