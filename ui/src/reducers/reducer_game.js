import { CREATE_GAME } from '../actions'

export default function(state = null, action) {
  switch(action.type) {
    case CREATE_GAME:
    console.log("in reducer "+ action.payload.data);
      return [action.meta.userName, action.payload.data];
    default:
      return state
  }
}
