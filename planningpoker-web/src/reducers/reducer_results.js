import {LEAVE_GAME, RESET_SESSION, RESULTS_UPDATED, VOTE} from '../actions'

const initialResultsState = [];

export default function (state = initialResultsState, action) {
  switch (action.type) {
    case RESULTS_UPDATED:
      return action.payload;
    case VOTE:
      if (action.error) return state;
      // Optimistic: immediately add this user's vote to results
      return [...state, { userName: action.meta.userName, estimateValue: action.meta.estimateValue }];
    case RESET_SESSION:
      if (action.error) return state;
      return [];
    case LEAVE_GAME:
      return [];
    default:
      return state
  }
}
