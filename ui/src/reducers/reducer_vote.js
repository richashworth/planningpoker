import {RESULTS_UPDATED, VOTE} from '../actions'

export default function (state = false, action) {
  switch (action.type) {
    case RESULTS_UPDATED:
      return (action.payload.length < 1) ? false : state
    case VOTE:
      return true
    default:
      return false
  }
}
