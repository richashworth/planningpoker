import axios from 'axios'
import { API_ROOT_URL } from '../config/Constants'

export const CREATE_GAME = 'create-game'
export const GAME_CREATED = 'game-created'
export const JOIN_GAME = 'join-game'
export const LEAVE_GAME = 'leave-game'
export const RESET_SESSION = 'reset-session'
export const RESULTS_REPLACE = 'results-replace'
export const RESULTS_UNION = 'results-union'
export const USER_LEFT_RECEIVED = 'user-left-received'
export const USERS_UPDATED = 'users-updated'
export const USER_REGISTERED = 'user-registered'
export const HOST_UPDATED = 'host-updated'
export const KICK_USER = 'kick-user'
export const PROMOTE_USER = 'promote-user'
export const KICKED = 'kicked'
export const VOTE = 'vote'
export const VOTE_OPTIMISTIC = 'vote-optimistic'
export const SET_LABEL = 'set-label'
export const LABEL_UPDATED = 'label-updated'
export const ROUND_COMPLETED = 'round-completed'
export const ROUNDS_REPLACE = 'rounds-replace'
export const SET_CONSENSUS_OVERRIDE = 'set-consensus-override'
export const CONSENSUS_OVERRIDE_UPDATED = 'consensus-override-updated'
export const CONSENSUS_OVERRIDE_LOCAL = 'consensus-override-local'

export const showError = (message) => ({ type: 'show-error', payload: message })
export const clearError = () => ({ type: 'clear-error' })

export const voteOptimistic = (playerName, estimateValue) => ({
  type: VOTE_OPTIMISTIC,
  payload: { userName: playerName, estimateValue },
})

export const gameCreated = () => ({ type: GAME_CREATED })

export const userRegistered = () => ({ type: USER_REGISTERED })

export const resultsReplace = (round, results, playerName) => ({
  type: RESULTS_REPLACE,
  payload: { round, results },
  meta: { playerName },
})

export const resultsUnion = (round, results, playerName) => ({
  type: RESULTS_UNION,
  payload: { round, results },
  meta: { playerName },
})

export const userLeftReceived = (leaver) => ({
  type: USER_LEFT_RECEIVED,
  payload: { leaver },
})

export const labelUpdated = (label) => ({ type: LABEL_UPDATED, payload: label })

export const roundCompleted = (round) => ({ type: ROUND_COMPLETED, payload: round })

export const roundsReplace = (rounds) => ({ type: ROUNDS_REPLACE, payload: rounds })

export const usersUpdated = (users) => ({ type: USERS_UPDATED, payload: users })

export const consensusOverrideUpdated = ({ value, round }) => ({
  type: CONSENSUS_OVERRIDE_UPDATED,
  payload: { value: value ?? null, round },
})

export const consensusOverrideLocal = (value) => ({
  type: CONSENSUS_OVERRIDE_LOCAL,
  payload: { value: value ?? null },
})

export const kicked = () => ({ type: KICKED })

// Shared POST + dispatch helper. Wraps the axios call, dispatches a typed
// success or error action, and routes the server's error message (or a
// fallback) through showError. Each thunk that posts to a mutation endpoint
// flows through here so the success/error envelope shape stays consistent.
//
// Options:
//   url                - path appended to API_ROOT_URL
//   params             - object encoded as URLSearchParams (form POST). Used
//                        when `body` is omitted.
//   body               - raw request body sent as-is (for JSON endpoints).
//   type               - action type dispatched on both success and failure.
//   meta               - meta object included on the dispatched action.
//   fallbackError      - showError message when the server didn't supply one.
//   omitSuccessPayload - dispatch `{ type }` only on success (no payload/meta).
//                        Matches existing thunks that don't carry success data.
//   onSuccess          - called after the success dispatch, with response data.
//   onError            - called before the standard error dispatches, with the
//                        caught error. Lets a thunk run revert logic before the
//                        error/showError actions fire (preserves dispatch order).
async function postForm(dispatch, opts) {
  const {
    url,
    params,
    body,
    type,
    meta,
    fallbackError,
    omitSuccessPayload = false,
    onSuccess,
    onError,
  } = opts
  const metaPart = meta ? { meta } : {}
  try {
    const requestBody = body !== undefined ? body : new URLSearchParams(params)
    const { data } = await axios.post(`${API_ROOT_URL}${url}`, requestBody)
    dispatch(omitSuccessPayload ? { type } : { type, payload: data, ...metaPart })
    if (onSuccess) onSuccess(data)
    return { data, error: null }
  } catch (err) {
    if (onError) onError(err)
    dispatch({ type, payload: err, error: true, ...metaPart })
    dispatch(showError(err.response?.data?.error || fallbackError))
    return { data: null, error: err }
  }
}

export function createGame(playerName, schemeOptions, onSuccess) {
  return async (dispatch) => {
    await postForm(dispatch, {
      url: '/createSession',
      body: {
        userName: playerName,
        schemeType: schemeOptions.schemeType,
        customValues: schemeOptions.customValues,
        includeUnsure: schemeOptions.includeUnsure,
      },
      type: CREATE_GAME,
      meta: { userName: playerName },
      fallbackError: 'Failed to create session',
      onSuccess: () => {
        if (onSuccess) onSuccess()
      },
    })
  }
}

export function leaveGame(playerName, sessionId, onSuccess) {
  return async (dispatch) => {
    // Reset local state first so the users-list broadcast that follows the
    // server-side logout can't trip PlayGame's kick-detection effect on us.
    dispatch({ type: LEAVE_GAME })
    try {
      await axios.post(
        `${API_ROOT_URL}/logout`,
        new URLSearchParams({ userName: playerName, sessionId }),
      )
    } catch (err) {
      console.error('Failed to leave session', err)
    }
    if (onSuccess) onSuccess()
  }
}

export function joinGame(playerName, sessionId, onSuccess) {
  return async (dispatch) => {
    await postForm(dispatch, {
      url: '/joinSession',
      params: { userName: playerName, sessionId },
      type: JOIN_GAME,
      meta: { userName: playerName, sessionId },
      fallbackError: 'Failed to join session',
      onSuccess: () => {
        if (onSuccess) onSuccess()
      },
    })
  }
}

export function vote(playerName, sessionId, estimateValue) {
  return async (dispatch) => {
    await postForm(dispatch, {
      url: '/vote',
      params: { userName: playerName, sessionId, estimateValue },
      type: VOTE,
      meta: { userName: playerName, estimateValue },
      fallbackError: 'Failed to submit vote',
    })
  }
}

export function resetSession(playerName, sessionId, consensus) {
  return async (dispatch) => {
    const params = { sessionId, userName: playerName }
    if (consensus != null && consensus !== '') params.consensus = consensus
    await postForm(dispatch, {
      url: '/reset',
      params,
      type: RESET_SESSION,
      fallbackError: 'Failed to reset session',
    })
  }
}

export function kickUser(userName, targetUser, sessionId) {
  return async (dispatch) => {
    await postForm(dispatch, {
      url: '/kick',
      params: { userName, targetUser, sessionId },
      type: KICK_USER,
      fallbackError: 'Failed to kick user',
    })
  }
}

export function promoteUser(userName, targetUser, sessionId) {
  return async (dispatch) => {
    await postForm(dispatch, {
      url: '/promote',
      params: { userName, targetUser, sessionId },
      type: PROMOTE_USER,
      fallbackError: 'Failed to promote user',
    })
  }
}

export function refresh(sessionId, playerName) {
  return async (dispatch) => {
    try {
      const { data } = await axios.get(`${API_ROOT_URL}/refresh`, {
        params: { sessionId },
      })
      dispatch(resultsReplace(data.round, data.results, playerName))
      dispatch(labelUpdated(data.label || ''))
      if (Array.isArray(data.users)) dispatch(usersUpdated({ users: data.users, host: data.host }))
      if (Array.isArray(data.completedRounds)) dispatch(roundsReplace(data.completedRounds))
    } catch (err) {
      console.error('Failed to refresh session state', err)
    }
  }
}

export function setLabel(userName, sessionId, label) {
  return async (dispatch) => {
    await postForm(dispatch, {
      url: '/setLabel',
      params: { userName, sessionId, label },
      type: SET_LABEL,
      fallbackError: 'Failed to set label',
      omitSuccessPayload: true,
    })
  }
}

export function setConsensusOverride(userName, sessionId, value) {
  return async (dispatch, getState) => {
    // Optimistically update the value so the click feels instant; the server's
    // broadcast (with a strictly newer round) is the authoritative reconciler.
    // On POST failure we revert to the prior value before the error dispatches.
    const prior = getState().consensus?.value ?? null
    dispatch(consensusOverrideLocal(value))
    const params = { userName, sessionId }
    if (value != null && value !== '') params.value = value
    await postForm(dispatch, {
      url: '/setConsensus',
      params,
      type: SET_CONSENSUS_OVERRIDE,
      fallbackError: 'Failed to set consensus',
      omitSuccessPayload: true,
      onError: () => dispatch(consensusOverrideLocal(prior)),
    })
  }
}
