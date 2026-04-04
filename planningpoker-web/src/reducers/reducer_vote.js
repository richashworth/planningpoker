import {LEAVE_GAME, RESULTS_UPDATED, VOTE} from '../actions'

export default function (state = false, action) {
  switch (action.type) {
    case LEAVE_GAME:
      return false;
    case RESULTS_UPDATED:
      return (action.payload.length < 1) ? false :
        action.payload.some(res => res['userName'] === action.meta.playerName);
    case VOTE:
      // redux-promise sets action.error = true if the POST rejected
      return action.error ? false : true;
    default:
      return state
  }
}
