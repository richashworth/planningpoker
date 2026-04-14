import { useEffect, useRef, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import GamePane from '../containers/GamePane'
import useStomp from '../hooks/useStomp'
import { resultsUpdated, usersUpdated, kicked, labelUpdated, RESET_SESSION } from '../actions'
import { API_ROOT_URL } from '../config/Constants'
import axios from 'axios'

export default function PlayGame() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const playerName = useSelector((state) => state.game.playerName)
  const sessionId = useSelector((state) => state.game.sessionId)
  const isUserRegistered = useSelector((state) => state.game.isRegistered)
  const voted = useSelector((state) => state.voted)
  const users = useSelector((state) => state.users)
  const kickedMessage = useSelector((state) => state.game.kickedMessage)
  const lastResultsTime = useRef(0)
  const wasConnected = useRef(false)
  // Tracks when the player was first confirmed in the session via a USERS_MESSAGE.
  // Kicks are only honoured after a short grace period to ignore stale burst
  // messages sent before the player joined (which may still arrive afterward).
  const sessionConfirmedAt = useRef(0)

  useEffect(() => {
    if (!isUserRegistered) {
      navigate('/')
    }
  }, [isUserRegistered, navigate])

  // Detect kick: if registered user is no longer in the WS users list.
  // Guards:
  //   1. Only act after we have seen ourselves in the list at least once.
  //   2. Allow a 4s grace window after that first confirmation to let any
  //      stale burst messages (sent before we joined) finish arriving. Stale
  //      bursts from the host's session-creation fire for up to ~2.7 s and
  //      may contain only the host's name.
  useEffect(() => {
    if (!isUserRegistered || !sessionId || users.length === 0) return
    const inSession = users.some((u) => u.toLowerCase() === playerName.toLowerCase())
    if (inSession) {
      if (!sessionConfirmedAt.current) {
        sessionConfirmedAt.current = Date.now()
      }
    } else if (sessionConfirmedAt.current && Date.now() - sessionConfirmedAt.current > 4000) {
      dispatch(kicked())
    }
  }, [users, isUserRegistered, sessionId, playerName, dispatch])

  // Pass kicked message to Welcome page via sessionStorage
  useEffect(() => {
    if (kickedMessage) {
      sessionStorage.setItem('pp-kicked-message', kickedMessage)
    }
  }, [kickedMessage])

  const topics = useMemo(
    () => [`/topic/results/${sessionId}`, `/topic/users/${sessionId}`],
    [sessionId],
  )

  const { connected } = useStomp({
    url: `${API_ROOT_URL}/stomp`,
    topics,
    onMessage: (msg) => {
      switch (msg.type) {
        case 'RESULTS_MESSAGE': {
          lastResultsTime.current = Date.now()
          // Backwards compat: old backend sends bare array; new backend sends { results, label }
          const results = Array.isArray(msg.payload) ? msg.payload : msg.payload.results
          const label = Array.isArray(msg.payload) ? undefined : msg.payload.label
          dispatch(resultsUpdated(results, playerName))
          if (label !== undefined) dispatch(labelUpdated(label))
          return
        }
        case 'RESET_MESSAGE':
          return dispatch({ type: RESET_SESSION })
        case 'USERS_MESSAGE':
          return dispatch(usersUpdated(msg.payload))
        default:
          return
      }
    },
  })

  // Detect WebSocket reconnect and validate session still exists on backend
  useEffect(() => {
    if (connected === true) {
      if (wasConnected.current) {
        // This is a reconnect (not the initial connect) — validate the session
        axios.get(`${API_ROOT_URL}/sessionUsers?sessionId=${sessionId}`).catch(() => {
          sessionStorage.setItem(
            'pp-kicked-message',
            'The session ended because the server was restarted.',
          )
          dispatch(kicked())
        })
      }
      wasConnected.current = true
    }
  }, [connected, sessionId, dispatch])

  // Fallback: if we voted but no WS results arrive within 8s, ask backend to re-broadcast
  useEffect(() => {
    if (!voted || !sessionId) return

    const timer = setTimeout(() => {
      const elapsed = Date.now() - lastResultsTime.current
      if (elapsed > 6000) {
        axios.get(`${API_ROOT_URL}/refresh?sessionId=${sessionId}`).catch(() => {})
      }
    }, 8000)

    return () => clearTimeout(timer)
  }, [voted, sessionId])

  return (
    <Box sx={{ maxWidth: 1100, width: '100%', mx: 'auto', p: 3, pt: 4 }}>
      <GamePane connected={connected} />
    </Box>
  )
}
