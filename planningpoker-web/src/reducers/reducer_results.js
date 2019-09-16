import {LEAVE_GAME, RESULTS_UPDATED} from '../actions'

const initialResultsState = [];

export default function (state = initialResultsState, action) {
  switch (action.type) {
    case RESULTS_UPDATED:
      return action.payload;
    case LEAVE_GAME:
      return initialResultsState;
    default:
      return state
  }
}
