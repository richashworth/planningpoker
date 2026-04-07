import axios from 'axios'
import { API_ROOT_URL } from '../config/Constants'

export const CREATE_GAME = 'create-game'
export const GAME_CREATED = 'game-created'
export const JOIN_GAME = 'join-game'
export const LEAVE_GAME = 'leave-game'
export const RESET_SESSION = 'reset-session'
export const RESULTS_UPDATED = 'results-updated'
export const USERS_UPDATED = 'users-updated'
export const USER_REGISTERED = 'user-registered'
export const HOST_UPDATED = 'host-updated'
export const KICK_USER = 'kick-user'
export const PROMOTE_USER = 'promote-user'
export const KICKED = 'kicked'
export const VOTE = 'vote'
export const VOTE_OPTIMISTIC = 'vote-optimistic'

export const showError = (message) => ({ type: 'show-error', payload: message })
export const clearError = () => ({ type: 'clear-error' })

export const voteOptimistic = (playerName, estimateValue) => ({
  type: VOTE_OPTIMISTIC,
  payload: { userName: playerName, estimateValue },
})

// Events
export const gameCreated = () => ({ type: GAME_CREATED })

export const userRegistered = () => ({ type: USER_REGISTERED })

export const resultsUpdated = (results, playerName) => ({
  type: RESULTS_UPDATED,
  payload: results,
  meta: { playerName: playerName },
})

export const usersUpdated = (users) => ({ type: USERS_UPDATED, payload: users })

export const kicked = () => ({ type: KICKED })

// User-driven actions (thunks)
export function createGame(playerName, schemeOptions, onSuccess) {
  return async (dispatch) => {
    try {
      const { data } = await axios.post(`${API_ROOT_URL}/createSession`, {
        userName: playerName,
        schemeType: schemeOptions.schemeType,
        customValues: schemeOptions.customValues,
        includeUnsure: schemeOptions.includeUnsure,
        includeCoffee: schemeOptions.includeCoffee,
      })
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
    try {
      await axios.post(
        `${API_ROOT_URL}/logout`,
        new URLSearchParams({ userName: playerName, sessionId }),
      )
      dispatch({ type: LEAVE_GAME })
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Failed to leave session', err)
      dispatch({ type: LEAVE_GAME })
    }
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

export function resetSession(playerName, sessionId) {
  return async (dispatch) => {
    try {
      const { data } = await axios.post(
        `${API_ROOT_URL}/reset`,
        new URLSearchParams({ sessionId, userName: playerName }),
      )
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
