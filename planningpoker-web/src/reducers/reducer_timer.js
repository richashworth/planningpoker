import { TIMER_UPDATED, LEAVE_GAME, KICKED, CREATE_GAME, JOIN_GAME } from '../actions'

const initial = {
  enabled: false,
  durationSeconds: 60,
  startedAt: null,
  pausedAt: null,
  accumulatedPausedMs: 0,
  serverNow: 0,
  lastReceivedAt: 0,
}

export default function (state = initial, action) {
  switch (action.type) {
    case CREATE_GAME:
    case JOIN_GAME:
      if (action.error || !action.payload?.timer) return state
      return { ...state, ...action.payload.timer, lastReceivedAt: Date.now() }
    case TIMER_UPDATED:
      if (!action.payload) return state
      return { ...state, ...action.payload, lastReceivedAt: Date.now() }
    case LEAVE_GAME:
    case KICKED:
      return initial
    default:
      return state
  }
}
