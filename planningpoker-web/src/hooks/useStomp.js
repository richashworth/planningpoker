import { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

export default function useStomp({ url, topics, onMessage }) {
  const onMessageRef = useRef(onMessage)
  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])
  const [connected, setConnected] = useState(null) // null = not yet attempted; false = banner shown
  const hasConnected = useRef(false)

  useEffect(() => {
    if (!url || !topics || topics.length === 0) return

    const timeout = setTimeout(() => {
      if (!hasConnected.current) setConnected(false)
    }, 5000)

    const client = new Client({
      webSocketFactory: () => new SockJS(url),
      reconnectDelay: 3000,
      onConnect: () => {
        hasConnected.current = true
        setConnected(true)
        topics.forEach((topic) => {
          client.subscribe(topic, (message) => {
            const body = JSON.parse(message.body)
            onMessageRef.current(body)
          })
        })
      },
      onDisconnect: () => {
        if (hasConnected.current) setConnected(false)
      },
      onStompError: () => {
        if (hasConnected.current) setConnected(false)
      },
      onWebSocketClose: () => {
        if (hasConnected.current) setConnected(false)
      },
    })

    client.activate()

    return () => {
      clearTimeout(timeout)
      if (client.active) {
        client.deactivate()
      }
    }
  }, [url, topics])

  return { connected }
}
