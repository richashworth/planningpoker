import { CONSENSUS_OVERRIDE_UPDATED, LEAVE_GAME, RESET_SESSION } from '../actions'

const initialState = { value: null, round: 0 }

// Strict "newer round wins" rule. Equal rounds are idempotent (state preserved by reference)
// so duplicate broadcasts of the same epoch don't churn rendering.
export default function (state = initialState, action) {
  switch (action.type) {
    case CONSENSUS_OVERRIDE_UPDATED: {
      const { value, round } = action.payload ?? {}
      if (typeof round !== 'number') return state
      if (round <= state.round) return state
      return { value: value ?? null, round }
    }
    case RESET_SESSION:
      // Server also broadcasts a CONSENSUS_OVERRIDE_MESSAGE with a bumped round on reset, but we
      // optimistically clear the value here too so the UI doesn't briefly carry the old highlight
      // into the next voting view if the broadcast lags. The round counter is left alone so the
      // server's authoritative broadcast (with a strictly larger round) still wins.
      if (action.error) return state
      return { ...state, value: null }
    case LEAVE_GAME:
      return initialState
    default:
      return state
  }
}
