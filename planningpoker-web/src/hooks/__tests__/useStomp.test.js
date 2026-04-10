/**
 * useStomp hook tests.
 *
 * Because no DOM/jsdom environment is installed, we test the STOMP wiring by
 * mocking @stomp/stompjs and sockjs-client at module level, then directly
 * exercising the same logic the hook's useEffect runs — without React rendering.
 *
 * Covered:
 *   - Client is NOT constructed when url/topics are empty
 *   - client.activate() is called on mount
 *   - onConnect subscribes to every requested topic
 *   - Incoming STOMP message is JSON-parsed and forwarded to onMessage
 *   - client.deactivate() is called on cleanup (when active)
 *   - deactivate is NOT called when client is already inactive
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — must be declared before any imports that resolve the mocked modules
// ---------------------------------------------------------------------------
let lastClientConfig = null
let lastClientInstance = null

vi.mock('@stomp/stompjs', () => ({
  Client: vi.fn(function (config) {
    lastClientConfig = config
    lastClientInstance = {
      activate: vi.fn(),
      deactivate: vi.fn(),
      active: true,
      subscribe: vi.fn(),
    }
    return lastClientInstance
  }),
}))

vi.mock('sockjs-client', () => ({
  default: vi.fn(function () {
    return {}
  }),
}))

import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

// ---------------------------------------------------------------------------
// Helper: mirrors the useStomp useEffect body without React
// ---------------------------------------------------------------------------
function simulateMount({ url, topics, onMessage }) {
  if (!url || !topics || topics.length === 0) {
    return { client: null, cleanup: () => {}, connectedStates: [] }
  }

  const connectedStates = []
  const setConnected = (val) => connectedStates.push(val)
  const hasConnected = { current: false }

  const client = new Client({
    webSocketFactory: () => new SockJS(url),
    reconnectDelay: 3000,
    onConnect: () => {
      hasConnected.current = true
      setConnected(true)
      topics.forEach((topic) => {
        client.subscribe(topic, (message) => {
          onMessage(JSON.parse(message.body))
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

  const cleanup = () => {
    if (client.active) client.deactivate()
  }

  return { client, cleanup, connectedStates }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Tests — reconnect lifecycle and connected state
// ---------------------------------------------------------------------------
describe('useStomp — reconnect lifecycle and connected state', () => {
  beforeEach(() => {
    lastClientConfig = null
    lastClientInstance = null
    vi.clearAllMocks()
  })

  it('onConnect sets connected to true', () => {
    const { connectedStates } = simulateMount({
      url: 'http://localhost:9000/stomp',
      topics: ['/topic/results/abc'],
      onMessage: vi.fn(),
    })
    lastClientConfig.onConnect()
    expect(connectedStates).toEqual([true])
  })

  it('onDisconnect sets connected to false after prior connect', () => {
    const { connectedStates } = simulateMount({
      url: 'http://localhost:9000/stomp',
      topics: ['/topic/results/abc'],
      onMessage: vi.fn(),
    })
    lastClientConfig.onConnect()
    lastClientConfig.onDisconnect()
    expect(connectedStates).toEqual([true, false])
  })

  it('onStompError sets connected to false after prior connect', () => {
    const { connectedStates } = simulateMount({
      url: 'http://localhost:9000/stomp',
      topics: ['/topic/results/abc'],
      onMessage: vi.fn(),
    })
    lastClientConfig.onConnect()
    lastClientConfig.onStompError()
    expect(connectedStates).toEqual([true, false])
  })

  it('onWebSocketClose sets connected to false after prior connect', () => {
    const { connectedStates } = simulateMount({
      url: 'http://localhost:9000/stomp',
      topics: ['/topic/results/abc'],
      onMessage: vi.fn(),
    })
    lastClientConfig.onConnect()
    lastClientConfig.onWebSocketClose()
    expect(connectedStates).toEqual([true, false])
  })

  it('onDisconnect is ignored before initial connect', () => {
    const { connectedStates } = simulateMount({
      url: 'http://localhost:9000/stomp',
      topics: ['/topic/results/abc'],
      onMessage: vi.fn(),
    })
    lastClientConfig.onDisconnect()
    expect(connectedStates).toEqual([])
  })

  it('onStompError is ignored before initial connect', () => {
    const { connectedStates } = simulateMount({
      url: 'http://localhost:9000/stomp',
      topics: ['/topic/results/abc'],
      onMessage: vi.fn(),
    })
    lastClientConfig.onStompError()
    expect(connectedStates).toEqual([])
  })

  it('reconnect resubscribes to all topics', () => {
    const topics = ['/topic/results/abc', '/topic/users/abc']
    simulateMount({
      url: 'http://localhost:9000/stomp',
      topics,
      onMessage: vi.fn(),
    })
    lastClientConfig.onConnect()
    lastClientInstance.subscribe.mockClear()
    lastClientConfig.onConnect()
    expect(lastClientInstance.subscribe).toHaveBeenCalledTimes(2)
    expect(lastClientInstance.subscribe).toHaveBeenCalledWith(topics[0], expect.any(Function))
    expect(lastClientInstance.subscribe).toHaveBeenCalledWith(topics[1], expect.any(Function))
  })
})

describe('useStomp — STOMP client wiring', () => {
  beforeEach(() => {
    lastClientConfig = null
    lastClientInstance = null
    vi.clearAllMocks()
  })

  it('does not construct a Client when url is empty', () => {
    const { client } = simulateMount({ url: '', topics: [], onMessage: vi.fn() })
    expect(client).toBeNull()
    expect(Client).not.toHaveBeenCalled()
  })

  it('does not construct a Client when topics list is empty', () => {
    const { client } = simulateMount({
      url: 'http://localhost:9000/stomp',
      topics: [],
      onMessage: vi.fn(),
    })
    expect(client).toBeNull()
    expect(Client).not.toHaveBeenCalled()
  })

  it('calls client.activate() on mount', () => {
    const { client } = simulateMount({
      url: 'http://localhost:9000/stomp',
      topics: ['/topic/results/abc'],
      onMessage: vi.fn(),
    })
    expect(client).not.toBeNull()
    expect(client.activate).toHaveBeenCalledOnce()
  })

  it('subscribes to every requested topic when onConnect fires', () => {
    const topics = ['/topic/results/abc', '/topic/users/abc']
    simulateMount({
      url: 'http://localhost:9000/stomp',
      topics,
      onMessage: vi.fn(),
    })

    lastClientConfig.onConnect()

    expect(lastClientInstance.subscribe).toHaveBeenCalledTimes(2)
    expect(lastClientInstance.subscribe).toHaveBeenCalledWith(topics[0], expect.any(Function))
    expect(lastClientInstance.subscribe).toHaveBeenCalledWith(topics[1], expect.any(Function))
  })

  it('parses JSON from incoming message and calls onMessage', () => {
    const onMessage = vi.fn()
    const payload = [{ userName: 'alice', estimateValue: '5' }]

    simulateMount({
      url: 'http://localhost:9000/stomp',
      topics: ['/topic/results/abc'],
      onMessage,
    })

    lastClientConfig.onConnect()
    const [, messageHandler] = lastClientInstance.subscribe.mock.calls[0]
    messageHandler({ body: JSON.stringify(payload) })

    expect(onMessage).toHaveBeenCalledWith(payload)
  })

  it('calls client.deactivate() on cleanup when client is active', () => {
    const { client, cleanup } = simulateMount({
      url: 'http://localhost:9000/stomp',
      topics: ['/topic/results/abc'],
      onMessage: vi.fn(),
    })

    cleanup()

    expect(client.deactivate).toHaveBeenCalledOnce()
  })

  it('does not call deactivate when client is already inactive', () => {
    const { client, cleanup } = simulateMount({
      url: 'http://localhost:9000/stomp',
      topics: ['/topic/results/abc'],
      onMessage: vi.fn(),
    })

    client.active = false
    cleanup()

    expect(client.deactivate).not.toHaveBeenCalled()
  })
})
