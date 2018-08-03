import {RESULTS_UPDATED} from '../actions'

export default function (state=[], action) {
  switch (action.type) {
    case RESULTS_UPDATED:
      return action.payload
    default:
      return state
  }
}
