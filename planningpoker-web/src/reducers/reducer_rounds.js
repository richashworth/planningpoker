import { ROUND_COMPLETED, LEAVE_GAME } from '../actions'

const initialState = []

export default function (state = initialState, action) {
  switch (action.type) {
    case ROUND_COMPLETED:
      return [...state, action.payload]
    case LEAVE_GAME:
      return initialState
    default:
      return state
  }
}
