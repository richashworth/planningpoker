import { CREATE_GAME, JOIN_GAME, ROUND_COMPLETED, ROUNDS_REPLACE, LEAVE_GAME } from '../actions'

const initialState = []

export default function (state = initialState, action) {
  switch (action.type) {
    case CREATE_GAME:
    case JOIN_GAME:
      if (action.error) return state
      return Array.isArray(action.payload?.completedRounds) ? action.payload.completedRounds : []
    case ROUND_COMPLETED: {
      const incoming = action.payload
      if (!incoming) return state
      // Server is the source of truth; dedupe by (round, timestamp) so a repeat broadcast
      // or a roundsReplace-then-ROUND_COMPLETED race can't double-insert.
      const exists = state.some(
        (r) => r.round === incoming.round && r.timestamp === incoming.timestamp,
      )
      return exists ? state : [...state, incoming]
    }
    case ROUNDS_REPLACE:
      return Array.isArray(action.payload) ? action.payload : state
    case LEAVE_GAME:
      return initialState
    default:
      return state
  }
}
