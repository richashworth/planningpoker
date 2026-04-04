import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function useStomp({ url, topics, onMessage }) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!url || !topics || topics.length === 0) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(url),
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true);
        topics.forEach(topic => {
          client.subscribe(topic, (message) => {
            const body = JSON.parse(message.body);
            onMessageRef.current(body);
          });
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
    });

    client.activate();

    return () => {
      if (client.active) {
        client.deactivate();
      }
    };
  }, [url, JSON.stringify(topics)]);

  return { connected };
}
