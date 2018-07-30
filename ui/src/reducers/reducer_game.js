import { CREATE_GAME } from '../actions'

export default function(state = null, action) {
  switch(action.type) {
    case CREATE_GAME:
      return action.payload;
    default:
      return state
  }
}
