import {USERS_UPDATED} from '../actions'

const initialUsersState = [];

export default function (state = initialUsersState, action) {
  switch (action.type) {
    case USERS_UPDATED:
      return action.payload
    default:
      return state
  }
}
