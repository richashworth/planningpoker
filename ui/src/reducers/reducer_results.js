import {RESULTS_UPDATED} from '../actions'

export default function (state = [], action) {
  switch (action.type) {
    case RESULTS_UPDATED:
      console.log('in resupdred'+JSON.stringify(action.payload));
      return action.payload
    default:
      return state
  }
}
