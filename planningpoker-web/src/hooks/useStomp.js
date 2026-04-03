import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function useStomp({ url, topics, onMessage }) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!url || !topics || topics.length === 0) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(url),
      reconnectDelay: 5000,
      onConnect: () => {
        topics.forEach(topic => {
          client.subscribe(topic, (message) => {
            const body = JSON.parse(message.body);
            onMessageRef.current(body);
          });
        });
      },
    });

    client.activate();

    return () => {
      if (client.active) {
        client.deactivate();
      }
    };
  }, [url, JSON.stringify(topics)]);
}
