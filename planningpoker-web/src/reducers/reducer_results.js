import {
  LEAVE_GAME,
  RESET_SESSION,
  RESULTS_REPLACE,
  RESULTS_UNION,
  USER_LEFT_RECEIVED,
  VOTE,
  VOTE_OPTIMISTIC,
} from '../actions'

const initialResultsState = []

function mergeByUser(base, incoming) {
  const byName = new Map(base.map((r) => [r.userName, r]))
  for (const r of incoming) {
    byName.set(r.userName, r)
  }
  return Array.from(byName.values())
}

export default function (state = initialResultsState, action) {
  switch (action.type) {
    case VOTE_OPTIMISTIC: {
      const { userName, estimateValue } = action.payload
      return [...state.filter((r) => r.userName !== userName), { userName, estimateValue }]
    }
    case VOTE:
      if (action.error) return state.filter((r) => r.userName !== action.meta.userName)
      return action.payload?.results ?? state
    case RESULTS_REPLACE:
      return action.payload.results ?? state
    case RESULTS_UNION:
      return mergeByUser(state, action.payload.results ?? [])
    case USER_LEFT_RECEIVED:
      return state.filter((r) => r.userName.toLowerCase() !== action.payload.leaver.toLowerCase())
    case RESET_SESSION:
      if (action.error) return state
      return []
    case LEAVE_GAME:
      return []
    default:
      return state
  }
}
