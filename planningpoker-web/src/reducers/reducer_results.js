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

// Preserve reference when an update carries identical content, so the chart
// doesn't restart its in-flight bar-grow animation on the server's echo of
// an optimistic vote.
function sameResults(a, b) {
  if (a === b) return true
  if (a.length !== b.length) return false
  const index = new Map(a.map((r) => [r.userName, r.estimateValue]))
  for (const r of b) {
    if (index.get(r.userName) !== r.estimateValue) return false
  }
  return true
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
    case RESULTS_REPLACE: {
      const incoming = action.payload.results ?? state
      return sameResults(state, incoming) ? state : incoming
    }
    case RESULTS_UNION: {
      const merged = mergeByUser(state, action.payload.results ?? [])
      return sameResults(state, merged) ? state : merged
    }
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
