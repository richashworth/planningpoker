import { useEffect, useRef, useMemo } from 'react'
import { useSelector, useDispatch, useStore } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import GamePane from '../containers/GamePane'
import useStomp from '../hooks/useStomp'
import {
  resultsReplace,
  resultsUnion,
  roundCompleted,
  userLeftReceived,
  usersUpdated,
  kicked,
  labelUpdated,
  refresh,
  consensusOverrideUpdated,
  RESET_SESSION,
} from '../actions'
import { API_ROOT_URL } from '../config/Constants'
import axios from 'axios'

export default function PlayGame() {
  const dispatch = useDispatch()
  const store = useStore()
  const navigate = useNavigate()
  const playerName = useSelector((state) => state.game.playerName)
  const sessionId = useSelector((state) => state.game.sessionId)
  const isUserRegistered = useSelector((state) => state.game.isRegistered)
  const voted = useSelector((state) => state.voted)
  const users = useSelector((state) => state.users)
  const kickedMessage = useSelector((state) => state.game.kickedMessage)
  const lastResultsTime = useRef(0)
  const wasConnected = useRef(false)

  useEffect(() => {
    if (!isUserRegistered) {
      navigate('/')
    }
  }, [isUserRegistered, navigate])

  useEffect(() => {
    if (!isUserRegistered || !sessionId || users.length === 0) return
    const inSession = users.some((u) => u.toLowerCase() === playerName.toLowerCase())
    if (!inSession) {
      dispatch(kicked())
    }
  }, [users, isUserRegistered, sessionId, playerName, dispatch])

  useEffect(() => {
    if (kickedMessage) {
      sessionStorage.setItem('pp-kicked-message', kickedMessage)
    }
  }, [kickedMessage])

  const topics = useMemo(
    () => [
      `/topic/results/${sessionId}`,
      `/topic/users/${sessionId}`,
      `/topic/consensus/${sessionId}`,
    ],
    [sessionId],
  )

  const { connected } = useStomp({
    url: `${API_ROOT_URL}/stomp`,
    topics,
    onMessage: (msg) => {
      const currentRound = store.getState().game.clientRound ?? 0
      switch (msg.type) {
        case 'RESULTS_MESSAGE': {
          lastResultsTime.current = Date.now()
          const { round, results, label } = msg.payload ?? {}
          if (typeof round !== 'number') return
          if (round > currentRound) {
            dispatch(resultsReplace(round, results ?? [], playerName))
            if (label !== undefined) dispatch(labelUpdated(label))
          } else if (round === currentRound) {
            dispatch(resultsUnion(round, results ?? [], playerName))
            if (label !== undefined) dispatch(labelUpdated(label))
          }
          return
        }
        case 'RESET_MESSAGE': {
          const round = msg.payload?.round
          if (typeof round === 'number' && round > currentRound) {
            dispatch({ type: RESET_SESSION, payload: { round } })
          }
          return
        }
        case 'USER_LEFT_MESSAGE': {
          const { round, leaver } = msg.payload ?? {}
          if (typeof round === 'number' && round === currentRound && leaver) {
            dispatch(userLeftReceived(leaver))
          }
          return
        }
        case 'USERS_MESSAGE':
          return dispatch(usersUpdated(msg.payload))
        case 'ROUND_COMPLETED_MESSAGE':
          if (msg.payload) dispatch(roundCompleted(msg.payload))
          return
        case 'CONSENSUS_OVERRIDE_MESSAGE': {
          const { value, round } = msg.payload ?? {}
          if (typeof round !== 'number') return
          dispatch(consensusOverrideUpdated({ value, round }))
          return
        }
        default:
          return
      }
    },
  })

  useEffect(() => {
    if (connected === true) {
      if (wasConnected.current) {
        axios
          .get(`${API_ROOT_URL}/sessionUsers`, { params: { sessionId } })
          .then(() => dispatch(refresh(sessionId, playerName)))
          .catch(() => {
            sessionStorage.setItem(
              'pp-kicked-message',
              'The session ended because the server was restarted.',
            )
            dispatch(kicked())
          })
      } else {
        // Initial connect: the USERS_MESSAGE broadcast fired by createSession/joinSession
        // went out before we subscribed, so pull current state now.
        dispatch(refresh(sessionId, playerName))
      }
      wasConnected.current = true
    }
  }, [connected, sessionId, playerName, dispatch])

  useEffect(() => {
    if (!voted || !sessionId) return

    const timer = setTimeout(() => {
      const elapsed = Date.now() - lastResultsTime.current
      if (elapsed > 6000) {
        dispatch(refresh(sessionId, playerName))
      }
    }, 8000)

    return () => clearTimeout(timer)
  }, [voted, sessionId, playerName, dispatch])

  return (
    <Box sx={{ maxWidth: 1100, width: '100%', mx: 'auto', p: 3, pt: 4 }}>
      <GamePane connected={connected} />
    </Box>
  )
}
