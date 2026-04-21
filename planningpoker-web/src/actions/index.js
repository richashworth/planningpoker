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

export const showError = (message) => ({ type: 'show-error', payload: message })
export const clearError = () => ({ type: 'clear-error' })

export const voteOptimistic = (playerName, estimateValue) => ({
  type: VOTE_OPTIMISTIC,
  payload: { userName: playerName, estimateValue },
})

// Events
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

export const setConsensusOverride = (value) => ({ type: SET_CONSENSUS_OVERRIDE, payload: value })

export const usersUpdated = (users) => ({ type: USERS_UPDATED, payload: users })

export const kicked = () => ({ type: KICKED })

// User-driven actions (thunks)
export function createGame(playerName, schemeOptions, onSuccess) {
  return async (dispatch) => {
    try {
      const body = {
        userName: playerName,
        schemeType: schemeOptions.schemeType,
        customValues: schemeOptions.customValues,
        includeUnsure: schemeOptions.includeUnsure,
      }
      const { data } = await axios.post(`${API_ROOT_URL}/createSession`, body)
      dispatch({ type: CREATE_GAME, payload: data, meta: { userName: playerName } })
      if (onSuccess) onSuccess()
    } catch (err) {
      dispatch({ type: CREATE_GAME, payload: err, error: true, meta: { userName: playerName } })
      dispatch(showError(err.response?.data?.error || 'Failed to create session'))
    }
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
    try {
      const { data } = await axios.post(
        `${API_ROOT_URL}/joinSession`,
        new URLSearchParams({ userName: playerName, sessionId }),
      )
      dispatch({ type: JOIN_GAME, payload: data, meta: { userName: playerName, sessionId } })
      if (onSuccess) onSuccess()
    } catch (err) {
      dispatch({
        type: JOIN_GAME,
        payload: err,
        error: true,
        meta: { userName: playerName, sessionId },
      })
      dispatch(showError(err.response?.data?.error || 'Failed to join session'))
    }
  }
}

export function vote(playerName, sessionId, estimateValue) {
  return async (dispatch) => {
    try {
      const { data } = await axios.post(
        `${API_ROOT_URL}/vote`,
        new URLSearchParams({ userName: playerName, sessionId, estimateValue }),
      )
      dispatch({ type: VOTE, payload: data, meta: { userName: playerName, estimateValue } })
    } catch (err) {
      dispatch({
        type: VOTE,
        payload: err,
        error: true,
        meta: { userName: playerName, estimateValue },
      })
      dispatch(showError(err.response?.data?.error || 'Failed to submit vote'))
    }
  }
}

export function resetSession(playerName, sessionId, consensus) {
  return async (dispatch) => {
    try {
      const params = { sessionId, userName: playerName }
      if (consensus != null && consensus !== '') params.consensus = consensus
      const { data } = await axios.post(`${API_ROOT_URL}/reset`, new URLSearchParams(params))
      dispatch({ type: RESET_SESSION, payload: data })
    } catch (err) {
      dispatch({ type: RESET_SESSION, payload: err, error: true })
      dispatch(showError(err.response?.data?.error || 'Failed to reset session'))
    }
  }
}

export function kickUser(userName, targetUser, sessionId) {
  return async (dispatch) => {
    try {
      const { data } = await axios.post(
        `${API_ROOT_URL}/kick`,
        new URLSearchParams({ userName, targetUser, sessionId }),
      )
      dispatch({ type: KICK_USER, payload: data })
    } catch (err) {
      dispatch({ type: KICK_USER, payload: err, error: true })
      dispatch(showError(err.response?.data?.error || 'Failed to kick user'))
    }
  }
}

export function promoteUser(userName, targetUser, sessionId) {
  return async (dispatch) => {
    try {
      const { data } = await axios.post(
        `${API_ROOT_URL}/promote`,
        new URLSearchParams({ userName, targetUser, sessionId }),
      )
      dispatch({ type: PROMOTE_USER, payload: data })
    } catch (err) {
      dispatch({ type: PROMOTE_USER, payload: err, error: true })
      dispatch(showError(err.response?.data?.error || 'Failed to promote user'))
    }
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
    try {
      await axios.post(
        `${API_ROOT_URL}/setLabel`,
        new URLSearchParams({ userName, sessionId, label }),
      )
      dispatch({ type: SET_LABEL })
    } catch (err) {
      dispatch({ type: SET_LABEL, payload: err, error: true })
      dispatch(showError(err.response?.data?.error || 'Failed to set label'))
    }
  }
}
