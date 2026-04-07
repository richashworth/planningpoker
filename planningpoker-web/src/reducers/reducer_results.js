import {LEAVE_GAME, RESET_SESSION, RESULTS_UPDATED, VOTE, VOTE_OPTIMISTIC} from '../actions'

const initialResultsState = [];

export default function (state = initialResultsState, action) {
  switch (action.type) {
    case VOTE_OPTIMISTIC: {
      const { userName, estimateValue } = action.payload;
      return [...state.filter(r => r.userName !== userName), { userName, estimateValue }];
    }
    case VOTE:
      return action.error
        ? state.filter(r => r.userName !== action.meta.userName)
        : state
    case RESULTS_UPDATED:
      return action.payload;
    case RESET_SESSION:
      if (action.error) return state;
      return [];
    case LEAVE_GAME:
      return [];
    default:
      return state
  }
}
