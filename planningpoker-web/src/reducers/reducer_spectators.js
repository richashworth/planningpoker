import { LEAVE_GAME, USERS_UPDATED } from '../actions'

const initialSpectatorsState = []

export default function (state = initialSpectatorsState, action) {
  switch (action.type) {
    case USERS_UPDATED: {
      const next = action.payload?.spectators
      return Array.isArray(next) ? next : state
    }
    case LEAVE_GAME:
      return []
    default:
      return state
  }
}
