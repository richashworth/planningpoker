import {LEAVE_GAME, RESET_SESSION, RESULTS_UPDATED, VOTE, VOTE_OPTIMISTIC} from '../actions'

export default function (state = false, action) {
  switch (action.type) {
    case VOTE_OPTIMISTIC:
      return true;
    case VOTE:
      return action.error ? false : state;
    case LEAVE_GAME:
      return false;
    case RESET_SESSION:
      // Optimistic: immediately flip back to voting view
      return false;
    case RESULTS_UPDATED:
      return (action.payload.length < 1) ? false :
        action.payload.some(res => res['userName'] === action.meta.playerName);
    default:
      return state
  }
}
