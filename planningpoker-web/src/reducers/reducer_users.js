import {LEAVE_GAME, USERS_UPDATED} from '../actions'

const initialUsersState = [];

export default function (state = initialUsersState, action) {
  switch (action.type) {
    case USERS_UPDATED:
      return action.payload;
    case LEAVE_GAME:
      return [];
    default:
      return state
  }
}
