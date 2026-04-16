import { LEAVE_GAME, RESET_SESSION, RESULTS_UPDATED, VOTE, VOTE_OPTIMISTIC } from '../actions'

const initialResultsState = []

// Preserve reference when the server burst resends identical content, so
// downstream components (notably the chart) don't re-animate on every burst.
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
      return action.error ? state.filter((r) => r.userName !== action.meta.userName) : state
    case RESULTS_UPDATED:
      return sameResults(state, action.payload) ? state : action.payload
    case RESET_SESSION:
      if (action.error) return state
      return []
    case LEAVE_GAME:
      return []
    default:
      return state
  }
}
