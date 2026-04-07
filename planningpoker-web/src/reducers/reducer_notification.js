const SHOW_ERROR = 'show-error'
const CLEAR_ERROR = 'clear-error'

export { SHOW_ERROR, CLEAR_ERROR }

export default function reducer_notification(state = null, action) {
  switch (action.type) {
    case SHOW_ERROR:
      return action.payload
    case CLEAR_ERROR:
      return null
    default:
      return state
  }
}
